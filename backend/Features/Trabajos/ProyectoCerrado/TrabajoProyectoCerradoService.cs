using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Trabajos.Shared;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Trabajos.ProyectoCerrado;

public class TrabajoProyectoCerradoService : ITrabajoProyectoCerradoService
{
    private readonly AppDbContext _db;

    public TrabajoProyectoCerradoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<TrabajoProyectoCerradoResponse> ContratarAsync(int clienteId, ContratarTrabajoProyectoCerradoRequest request)
    {
        if (!await _db.PerfilesCliente.AnyAsync(p => p.UsuarioId == clienteId))
            throw new ForbiddenException("Solo los clientes pueden contratar servicios.");

        var servicioBase = await _db.Servicios.FirstOrDefaultAsync(s => s.Id == request.ServicioId)
            ?? throw new NotFoundException($"No existe el servicio {request.ServicioId}.");

        if (servicioBase is not ServicioProyectoCerrado servicio)
            throw new BadRequestException("Este servicio no es de proyecto cerrado.");

        if (!servicio.Activo)
            throw new BadRequestException("El servicio no está disponible para contratar.");

        if (servicio.EstudianteId == clienteId)
            throw new BadRequestException("No podés contratar tu propio servicio.");

        var ahora = DateTime.UtcNow;
        var trabajo = new TrabajoProyectoCerrado
        {
            ServicioId = servicio.Id,
            ClienteId = clienteId,
            EstudianteId = servicio.EstudianteId,
            TituloSnapshot = servicio.Titulo,
            DescripcionSnapshot = servicio.Descripcion,
            PrecioAcordado = servicio.Precio,
            Estado = EstadoTrabajo.Pendiente,
            FechaCreacion = ahora,
            PlazoEntregaFecha = ahora.AddDays(servicio.PlazoEntregaDias),
            RevisionesMaximas = servicio.RevisionesIncluidas,
            RevisionesUsadas = 0,
            FormatoEntregaSnapshot = servicio.FormatoEntrega
        };
        trabajo.Historiales.Add(new TrabajoHistorial
        {
            EstadoAnterior = null,
            EstadoNuevo = EstadoTrabajo.Pendiente,
            Fecha = ahora,
            UsuarioId = clienteId
        });

        _db.TrabajosProyectoCerrado.Add(trabajo);
        await _db.SaveChangesAsync();

        return await ObtenerAsync(clienteId, trabajo.Id);
    }

    public async Task<TrabajoProyectoCerradoResponse> ObtenerAsync(int usuarioId, int idTrabajo)
    {
        var t = await _db.TrabajosProyectoCerrado.AsNoTracking()
            .Include(x => x.Cliente).ThenInclude(c => c.Usuario)
            .Include(x => x.Estudiante).ThenInclude(e => e.Usuario)
            .FirstOrDefaultAsync(x => x.Id == idTrabajo)
            ?? throw new NotFoundException($"No existe el trabajo de proyecto cerrado {idTrabajo}.");

        if (t.EstudianteId != usuarioId && t.ClienteId != usuarioId)
            throw new ForbiddenException("No participás en este trabajo.");

        return Map(t);
    }

    public static TrabajoProyectoCerradoResponse Map(TrabajoProyectoCerrado t)
    {
        var r = new TrabajoProyectoCerradoResponse
        {
            PlazoEntregaFecha = t.PlazoEntregaFecha,
            RevisionesMaximas = t.RevisionesMaximas,
            RevisionesUsadas = t.RevisionesUsadas,
            FormatoEntregaSnapshot = t.FormatoEntregaSnapshot
        };
        return r.LlenarBase(t);
    }
}
