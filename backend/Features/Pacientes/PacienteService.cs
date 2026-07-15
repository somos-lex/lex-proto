using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Pacientes;

public class PacienteService : IPacienteService
{
    private readonly AppDbContext _db;

    public PacienteService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PacienteResponse> CrearAsync(int clienteId, CrearPacienteRequest request)
    {
        // El paciente cuelga del perfil de cliente (perfil_cliente.usuario_id == clienteId).
        if (!await _db.PerfilesCliente.AnyAsync(p => p.UsuarioId == clienteId))
            throw new ForbiddenException("Tu usuario no tiene un perfil de cliente.");

        // Validaciones por tipo (campos que solo aplican a Humano o a Animal).
        if (request.Tipo == TipoPaciente.Animal && string.IsNullOrWhiteSpace(request.Especie))
            throw new BadRequestException("La especie es obligatoria para un paciente animal.");

        var paciente = new Paciente
        {
            ClienteResponsableId = clienteId,
            Tipo = request.Tipo,
            NombreCompleto = request.NombreCompleto.Trim(),
            EsTitular = request.Tipo == TipoPaciente.Humano && request.EsTitular,
            FechaNacimiento = request.FechaNacimiento,
            Dni = request.Tipo == TipoPaciente.Humano ? Limpiar(request.Dni) : null,
            Especie = request.Tipo == TipoPaciente.Animal ? Limpiar(request.Especie) : null,
            Raza = request.Tipo == TipoPaciente.Animal ? Limpiar(request.Raza) : null,
            ContactoEmergenciaNombre = Limpiar(request.ContactoEmergenciaNombre),
            ContactoEmergenciaTelefono = Limpiar(request.ContactoEmergenciaTelefono),
            NotasRelevantes = Limpiar(request.NotasRelevantes)
        };

        _db.Pacientes.Add(paciente);
        await _db.SaveChangesAsync();

        return await ObtenerAsync(clienteId, paciente.Id);
    }

    public async Task<IReadOnlyList<PacienteResponse>> ListarMiosAsync(int clienteId)
    {
        return await _db.Pacientes.AsNoTracking()
            .Where(p => p.ClienteResponsableId == clienteId)
            .OrderBy(p => p.NombreCompleto)
            .Select(Proyeccion)
            .ToListAsync();
    }

    public async Task<PacienteResponse> ObtenerAsync(int clienteId, int idPaciente)
    {
        var paciente = await _db.Pacientes.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == idPaciente)
            ?? throw new NotFoundException($"No existe el paciente {idPaciente}.");

        if (paciente.ClienteResponsableId != clienteId)
            throw new ForbiddenException("Este paciente no te pertenece.");

        return ToResponse(paciente);
    }

    private static string? Limpiar(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    private static PacienteResponse ToResponse(Paciente p) => new()
    {
        Id = p.Id,
        ClienteResponsableId = p.ClienteResponsableId,
        Tipo = p.Tipo,
        NombreCompleto = p.NombreCompleto,
        EsTitular = p.EsTitular,
        FechaNacimiento = p.FechaNacimiento,
        Dni = p.Dni,
        Especie = p.Especie,
        Raza = p.Raza,
        ContactoEmergenciaNombre = p.ContactoEmergenciaNombre,
        ContactoEmergenciaTelefono = p.ContactoEmergenciaTelefono,
        NotasRelevantes = p.NotasRelevantes
    };

    private static readonly System.Linq.Expressions.Expression<Func<Paciente, PacienteResponse>> Proyeccion =
        p => new PacienteResponse
        {
            Id = p.Id,
            ClienteResponsableId = p.ClienteResponsableId,
            Tipo = p.Tipo,
            NombreCompleto = p.NombreCompleto,
            EsTitular = p.EsTitular,
            FechaNacimiento = p.FechaNacimiento,
            Dni = p.Dni,
            Especie = p.Especie,
            Raza = p.Raza,
            ContactoEmergenciaNombre = p.ContactoEmergenciaNombre,
            ContactoEmergenciaTelefono = p.ContactoEmergenciaTelefono,
            NotasRelevantes = p.NotasRelevantes
        };
}
