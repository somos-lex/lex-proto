using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Admin;

// Verificacion institucional del vinculo estudiante-carrera. Es lo que habilita a un
// estudiante real a publicar: ServicioPublicacionValidator y las practicas clinicas
// exigen al menos una carrera Verificado, y hasta aca solo la sembraban el seed y la demo.
public class VerificacionService : IVerificacionService
{
    private readonly AppDbContext _db;

    public VerificacionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<VerificacionPendienteResponse>> ListarPendientesAsync()
    {
        // Los mas viejos primero: la bandeja se atiende por orden de llegada. El vinculo no
        // guarda cuando se pidio, asi que se ordena por el alta del usuario.
        return await _db.EstudianteCarreras.AsNoTracking()
            .Where(ec => ec.EstadoVerificacion == EstadoVerificacion.Pendiente)
            .OrderBy(ec => ec.Estudiante.Usuario.FechaRegistro)
            .ThenBy(ec => ec.EstudianteId)
            .Select(ec => new VerificacionPendienteResponse(
                ec.EstudianteId,
                ec.Estudiante.Usuario.NombreCompleto,
                ec.Estudiante.Usuario.Email,
                ec.CarreraId,
                ec.Carrera.Nombre,
                ec.Carrera.Institucion.Nombre,
                ec.Estudiante.AnioCursado,
                ec.DocumentoComprobante,
                ec.Estudiante.Usuario.FechaRegistro))
            .ToListAsync();
    }

    // Aprobar acepta tambien un vinculo Rechazado: el rechazo tipico es una constancia de
    // alumno regular ilegible, y la persona tiene que poder ser aprobada cuando la reenvia.
    public async Task<VerificacionResueltaResponse> AprobarAsync(
        int adminId, int estudianteId, int carreraId, string? observaciones)
    {
        var vinculo = await BuscarAsync(estudianteId, carreraId);

        if (vinculo.EstadoVerificacion == EstadoVerificacion.Verificado)
            throw new BadRequestException("Este vínculo ya está verificado.");

        // Ninguna aprobacion sin evidencia: o el estudiante cargo el comprobante, o el admin
        // deja escrito como lo constato (ej. constancia en papel vista en la catedra). La
        // verificacion institucional es el diferencial del producto; aprobar sin ninguna de
        // las dos cosas la convierte en un sello de goma. El comprobante sigue siendo
        // opcional al ACTIVAR el perfil: el estudiante puede registrarse y explorar en
        // Pendiente sin tramite previo.
        var observacionesLimpias = Limpiar(observaciones);
        if (string.IsNullOrWhiteSpace(vinculo.DocumentoComprobante) && observacionesLimpias is null)
            throw new BadRequestException(
                "El estudiante no cargó comprobante de su carrera. Para aprobar sin comprobante, " +
                "dejá en las observaciones cómo verificaste el vínculo (por ejemplo: constancia de " +
                "alumno regular en papel vista en la cátedra, con la fecha).");

        vinculo.EstadoVerificacion = EstadoVerificacion.Verificado;
        vinculo.FechaVerificacion = DateTime.UtcNow;
        vinculo.VerificadoPorUsuarioId = adminId;
        vinculo.ObservacionesVerificacion = observacionesLimpias;
        vinculo.MotivoRechazo = null;

        await _db.SaveChangesAsync();
        return ToResponse(vinculo);
    }

    // Rechazar solo desde Pendiente: un vinculo ya verificado no se revoca por esta via, y
    // re-rechazar uno rechazado no agrega nada.
    public async Task<VerificacionResueltaResponse> RechazarAsync(
        int adminId, int estudianteId, int carreraId, string motivo)
    {
        if (string.IsNullOrWhiteSpace(motivo))
            throw new BadRequestException("Debe indicar el motivo del rechazo.");

        var vinculo = await BuscarAsync(estudianteId, carreraId);

        if (vinculo.EstadoVerificacion != EstadoVerificacion.Pendiente)
            throw new BadRequestException(
                $"Solo se puede rechazar un vínculo pendiente (este está {vinculo.EstadoVerificacion}).");

        vinculo.EstadoVerificacion = EstadoVerificacion.Rechazado;
        vinculo.FechaVerificacion = DateTime.UtcNow;
        vinculo.VerificadoPorUsuarioId = adminId;
        vinculo.MotivoRechazo = motivo.Trim();

        await _db.SaveChangesAsync();
        return ToResponse(vinculo);
    }

    private async Task<EstudianteCarrera> BuscarAsync(int estudianteId, int carreraId) =>
        await _db.EstudianteCarreras
            .FirstOrDefaultAsync(ec => ec.EstudianteId == estudianteId && ec.CarreraId == carreraId)
        ?? throw new NotFoundException(
            $"El estudiante {estudianteId} no tiene vínculo con la carrera {carreraId}.");

    private static string? Limpiar(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    private static VerificacionResueltaResponse ToResponse(EstudianteCarrera ec) => new(
        ec.EstudianteId,
        ec.CarreraId,
        ec.EstadoVerificacion,
        ec.FechaVerificacion!.Value,
        ec.VerificadoPorUsuarioId!.Value,
        ec.ObservacionesVerificacion,
        ec.MotivoRechazo);
}
