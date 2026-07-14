using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Features.Trabajos;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Postulaciones;

public class PostulacionService : IPostulacionService
{
    private readonly AppDbContext _db;
    private readonly ITrabajoService _trabajos;

    public PostulacionService(AppDbContext db, ITrabajoService trabajos)
    {
        _db = db;
        _trabajos = trabajos;
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

    public async Task<TrabajoResponse> AceptarAsync(int clienteId, int idPostulacion)
    {
        var postulacion = await _db.Postulaciones
            .Include(p => p.Solicitud)
            .FirstOrDefaultAsync(p => p.Id == idPostulacion)
            ?? throw new NotFoundException($"No existe la postulación {idPostulacion}.");

        var solicitud = postulacion.Solicitud;

        if (solicitud.ClienteId != clienteId)
            throw new ForbiddenException("No sos el dueño de esta solicitud.");

        if (solicitud.Estado != EstadoSolicitud.Abierta)
            throw new BadRequestException("La solicitud ya no está abierta.");

        var ahora = DateTime.UtcNow;

        // Aceptar esta postulación y rechazar las demás de la misma solicitud.
        var postulaciones = await _db.Postulaciones
            .Where(p => p.SolicitudId == solicitud.Id)
            .ToListAsync();
        foreach (var p in postulaciones)
            p.Estado = p.Id == idPostulacion
                ? EstadoPostulacion.Aceptada
                : EstadoPostulacion.Rechazada;

        // Cerrar la solicitud.
        solicitud.Estado = EstadoSolicitud.Cerrada;
        solicitud.FechaCierre = ahora;

        // Nace el trabajo con origen = Postulacion.
        var trabajo = new Trabajo
        {
            EstudianteId = postulacion.EstudianteId,
            ClienteId = solicitud.ClienteId,
            // TODO Sub-hito 1.2: el tipo del trabajo (solicitud.TipoServicio) queda
            // implícito en la subclase concreta cuando Trabajo pase a TPT.
            Origen = OrigenTrabajo.Postulacion,
            ServicioId = null,
            PostulacionId = postulacion.Id,
            PacienteId = null,
            Estado = EstadoTrabajo.Pendiente,
            Monto = postulacion.MontoPropuesto ?? 0m,
            FechaCreacion = ahora
        };
        trabajo.Historiales.Add(new TrabajoHistorial
        {
            EstadoAnterior = null,
            EstadoNuevo = EstadoTrabajo.Pendiente,
            Fecha = ahora,
            UsuarioId = clienteId
        });

        _db.Trabajos.Add(trabajo);
        await _db.SaveChangesAsync();

        return await _trabajos.ObtenerAsync(clienteId, trabajo.Id);
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
