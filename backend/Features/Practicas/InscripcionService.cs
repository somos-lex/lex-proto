using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using static Lex.Api.Features.Practicas.PracticaConsultas;

namespace Lex.Api.Features.Practicas;

// Banco de Turnos, lado del cliente: inscribir sin costo a un paciente propio en una
// practica publicada, y cancelar la inscripcion. Sin dinero: no hay Pago ni escrow.
public class InscripcionService : IInscripcionService
{
    // Nombre del indice unico parcial que garantiza el cupo (AppDbContext, bloque 13).
    private const string IndiceCupoVigente = "ux_inscripcion_practica_vigente";

    private readonly AppDbContext _db;

    public InscripcionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<InscripcionResponse> InscribirAsync(int clienteId, int idPractica, InscribirPracticaRequest request)
    {
        if (!await _db.PerfilesCliente.AnyAsync(p => p.UsuarioId == clienteId))
            throw new ForbiddenException("Solo un usuario con perfil de cliente puede inscribir pacientes.");

        var practica = await _db.PracticasClinicas
            .FirstOrDefaultAsync(p => p.Id == idPractica)
            ?? throw new NotFoundException($"No existe la práctica {idPractica}.");

        if (practica.EstudianteId == clienteId)
            throw new BadRequestException("No podés inscribirte en tu propia práctica.");

        var ahora = DateTime.UtcNow;
        if (EstadoEfectivo(practica, ahora) != EstadoPracticaClinica.Publicada)
            throw new BadRequestException(practica.Estado == EstadoPracticaClinica.Cubierta
                ? "La práctica ya tiene un paciente inscripto."
                : "La práctica no está abierta a inscripción.");

        // Un paciente ajeno se responde igual que uno inexistente.
        var paciente = await _db.Pacientes.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PacienteId && p.ClienteResponsableId == clienteId)
            ?? throw new NotFoundException($"No existe el paciente {request.PacienteId}.");

        if (paciente.Tipo != practica.TipoPacienteRequerido)
            throw new BadRequestException(
                $"Esta práctica requiere un paciente {practica.TipoPacienteRequerido} y '{paciente.NombreCompleto}' es {paciente.Tipo}.");

        if (!request.RequisitosAceptados)
            throw new BadRequestException("Tenés que aceptar los requisitos previos de la práctica para inscribirte.");

        var inscripcion = new InscripcionPractica
        {
            PracticaClinicaId = practica.Id,
            ClienteId = clienteId,
            PacienteId = paciente.Id,
            Estado = EstadoInscripcionPractica.Inscripta,
            RequisitosAceptados = true,
            FechaAceptacionRequisitos = ahora,
            FechaInscripcion = ahora
        };
        _db.InscripcionesPractica.Add(inscripcion);
        practica.Estado = EstadoPracticaClinica.Cubierta;

        // El chequeo de arriba da el mensaje; la garantia es el indice unico parcial. Si dos
        // personas se inscriben a la vez, las dos leyeron Publicada, pero la base deja pasar
        // una sola: la otra cae aca y su transaccion (inscripcion + Cubierta) no deja nada.
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ErroresPostgres.EsViolacionUnica(ex, IndiceCupoVigente))
        {
            throw new BadRequestException("La práctica ya tiene un paciente inscripto.");
        }

        return await ObtenerAsync(inscripcion.Id);
    }

    public async Task<IReadOnlyList<InscripcionResponse>> ListarMiasAsync(int clienteId)
    {
        var ahora = DateTime.UtcNow;
        var inscripciones = await ConDatos(_db.InscripcionesPractica.AsNoTracking())
            .Where(i => i.ClienteId == clienteId)
            .OrderByDescending(i => i.PracticaClinica.FechaHoraInicio)
            .ToListAsync();

        return inscripciones.Select(i => ToResponse(i, ahora)).ToList();
    }

    // La cancela cualquiera de las dos partes: el cliente (no puede ir) o el estudiante (el
    // paciente no sirve para la practica). Es tambien la forma de "rechazar" un paciente: no
    // hay paso de confirmacion. La practica vuelve a quedar Publicada.
    public async Task<InscripcionResponse> CancelarAsync(int usuarioId, int idInscripcion, string? motivo)
    {
        var inscripcion = await _db.InscripcionesPractica
            .Include(i => i.PracticaClinica)
            .FirstOrDefaultAsync(i => i.Id == idInscripcion);

        if (inscripcion is null
            || (inscripcion.ClienteId != usuarioId && inscripcion.PracticaClinica.EstudianteId != usuarioId))
            throw new NotFoundException($"No existe la inscripción {idInscripcion}.");

        if (inscripcion.Estado != EstadoInscripcionPractica.Inscripta)
            throw new BadRequestException($"No se puede cancelar una inscripción en estado {inscripcion.Estado}.");

        var ahora = DateTime.UtcNow;
        var practica = inscripcion.PracticaClinica;
        if (practica.FechaHoraInicio <= ahora)
            throw new BadRequestException(
                $"No se puede cancelar una inscripción a una práctica que ya empezó ({HorarioArgentina.Describir(practica.FechaHoraInicio)}).");

        inscripcion.Estado = EstadoInscripcionPractica.Cancelada;
        inscripcion.FechaCancelacion = ahora;
        inscripcion.MotivoCancelacion = string.IsNullOrWhiteSpace(motivo) ? null : motivo.Trim();

        if (practica.Estado == EstadoPracticaClinica.Cubierta)
            practica.Estado = EstadoPracticaClinica.Publicada;

        await _db.SaveChangesAsync();
        return await ObtenerAsync(idInscripcion);
    }

    private async Task<InscripcionResponse> ObtenerAsync(int idInscripcion)
    {
        var inscripcion = await ConDatos(_db.InscripcionesPractica.AsNoTracking())
            .FirstAsync(i => i.Id == idInscripcion);
        return ToResponse(inscripcion, DateTime.UtcNow);
    }

    private static IQueryable<InscripcionPractica> ConDatos(IQueryable<InscripcionPractica> query) =>
        query
            .Include(i => i.Paciente)
            .Include(i => i.PracticaClinica).ThenInclude(p => p.Materia).ThenInclude(m => m.Carrera).ThenInclude(c => c.Institucion)
            .Include(i => i.PracticaClinica).ThenInclude(p => p.Estudiante).ThenInclude(e => e.Usuario)
            .Include(i => i.PracticaClinica).ThenInclude(p => p.Constancia)
            .AsSplitQuery();

    private static InscripcionResponse ToResponse(InscripcionPractica i, DateTime ahora) => new(
        i.Id,
        i.Estado,
        ToPublica(i.PracticaClinica, ahora),
        ToPaciente(i.Paciente),
        i.FechaInscripcion,
        i.FechaAceptacionRequisitos,
        i.FechaCancelacion,
        i.MotivoCancelacion,
        // Una inscripcion cancelada no es la que origino la constancia de la practica.
        i.Estado is EstadoInscripcionPractica.Asistio or EstadoInscripcionPractica.NoAsistio
            ? i.PracticaClinica.Constancia?.Codigo
            : null);
}
