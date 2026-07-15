using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Features.Trabajos.Shared;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Postulaciones;

public class PostulacionService : IPostulacionService
{
    private readonly AppDbContext _db;

    public PostulacionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PostulacionResponse> CrearAsync(int estudianteId, int idSolicitud, CrearPostulacionRequest request)
    {
        if (request.MontoPropuesto <= 0)
            throw new BadRequestException("El monto propuesto debe ser mayor a 0.");

        var solicitud = await _db.Solicitudes.FirstOrDefaultAsync(s => s.Id == idSolicitud)
            ?? throw new NotFoundException($"No existe la solicitud {idSolicitud}.");

        if (solicitud.Estado != EstadoSolicitud.Abierta)
            throw new BadRequestException("La solicitud no está abierta para postulaciones.");

        if (!await _db.PerfilesEstudiante.AnyAsync(p => p.UsuarioId == estudianteId))
            throw new ForbiddenException("Tu usuario no tiene un perfil de estudiante.");

        var yaPostulado = await _db.Postulaciones
            .AnyAsync(p => p.SolicitudId == idSolicitud && p.EstudianteId == estudianteId);
        if (yaPostulado)
            throw new BadRequestException("Ya te postulaste a esta solicitud.");

        var postulacion = new Postulacion
        {
            SolicitudId = idSolicitud,
            EstudianteId = estudianteId,
            Mensaje = request.Mensaje?.Trim(),
            MontoPropuesto = request.MontoPropuesto,
            Estado = EstadoPostulacion.Enviada,
            FechaPostulacion = DateTime.UtcNow
        };

        _db.Postulaciones.Add(postulacion);
        await _db.SaveChangesAsync();

        return await ObtenerMiaAsync(postulacion.Id);
    }

    public async Task<IReadOnlyList<PostulacionRecibidaResponse>> ListarRecibidasAsync(int clienteId, int idSolicitud)
    {
        var solicitud = await _db.Solicitudes.AsNoTracking()
            .Where(s => s.Id == idSolicitud)
            .Select(s => new { s.ClienteId })
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"No existe la solicitud {idSolicitud}.");

        if (solicitud.ClienteId != clienteId)
            throw new ForbiddenException("No sos el dueño de esta solicitud.");

        return await _db.Postulaciones.AsNoTracking()
            .Where(p => p.SolicitudId == idSolicitud)
            .OrderByDescending(p => p.FechaPostulacion)
            .Select(p => new PostulacionRecibidaResponse
            {
                Id = p.Id,
                SolicitudId = p.SolicitudId,
                EstudianteId = p.EstudianteId,
                EstudianteNombre = p.Estudiante.Usuario.NombreCompleto,
                EstudianteCalificacion = p.Estudiante.CalificacionPromedio,
                Mensaje = p.Mensaje,
                MontoPropuesto = p.MontoPropuesto,
                Estado = p.Estado,
                FechaPostulacion = p.FechaPostulacion
            })
            .ToListAsync();
    }

    public async Task<IReadOnlyList<PostulacionResponse>> ListarMiasAsync(int estudianteId)
    {
        return await _db.Postulaciones.AsNoTracking()
            .Where(p => p.EstudianteId == estudianteId)
            .OrderByDescending(p => p.FechaPostulacion)
            .Select(Proyeccion)
            .ToListAsync();
    }

    public Task<TrabajoResponse> AceptarAsync(int clienteId, int idPostulacion)
    {
        // [PAUSADO - Sub-hito 1.2] Con Trabajo convertido en jerarquia TPT atada a un
        // Servicio concreto (ProyectoCerrado/Clase/Salud), el flujo postulacion->trabajo
        // ya no mapea a un tipo unico. El modulo de Solicitudes/Postulaciones sigue
        // pausado y su rediseño (incluida esta aceptacion) se define en un hito posterior.
        throw new BadRequestException(
            "El flujo de aceptación de postulaciones está pausado y se rediseñará en un sub-hito posterior.");
    }

    private async Task<PostulacionResponse> ObtenerMiaAsync(int idPostulacion)
    {
        return await _db.Postulaciones.AsNoTracking()
            .Where(p => p.Id == idPostulacion)
            .Select(Proyeccion)
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"No existe la postulación {idPostulacion}.");
    }

    private static readonly System.Linq.Expressions.Expression<Func<Postulacion, PostulacionResponse>> Proyeccion =
        p => new PostulacionResponse
        {
            Id = p.Id,
            SolicitudId = p.SolicitudId,
            SolicitudTitulo = p.Solicitud.Titulo,
            EstudianteId = p.EstudianteId,
            Mensaje = p.Mensaje,
            MontoPropuesto = p.MontoPropuesto,
            Estado = p.Estado,
            FechaPostulacion = p.FechaPostulacion
        };
}
