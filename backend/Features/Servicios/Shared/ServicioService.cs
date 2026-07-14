using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Servicios.Clase;
using Lex.Api.Features.Servicios.ProyectoCerrado;
using Lex.Api.Features.Servicios.Salud;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Servicios.Shared;

// Queries agnosticas al tipo. Con TPT, EF materializa la subclase concreta al
// consultar el DbSet base: el mapeo a DTO decide la vertical con pattern matching.
public class ServicioService : IServicioService
{
    private readonly AppDbContext _db;

    public ServicioService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ServicioResponse>> ListarAsync(
        TipoServicio? tipo, int? carreraId, int? estudianteId, bool? activo)
    {
        var query = _db.Servicios.AsNoTracking()
            .Include(s => s.Estudiante).ThenInclude(e => e.Usuario)
            .AsQueryable();

        // Por defecto, el catalogo publico muestra solo los activos.
        query = query.Where(s => s.Activo == (activo ?? true));

        if (estudianteId is int est)
            query = query.Where(s => s.EstudianteId == est);

        // Filtra por la carrera (verificada) del estudiante que publica.
        if (carreraId is int carrera)
            query = query.Where(s => _db.EstudianteCarreras.Any(ec =>
                ec.EstudianteId == s.EstudianteId &&
                ec.CarreraId == carrera &&
                ec.EstadoVerificacion == EstadoVerificacion.Verificado));

        // El filtro por vertical se resuelve sobre la subclase TPT.
        query = tipo switch
        {
            TipoServicio.ProyectoCerrado => query.Where(s => s is ServicioProyectoCerrado),
            TipoServicio.Clase => query.Where(s => s is ServicioClase),
            TipoServicio.Salud => query.Where(s => s is ServicioSalud),
            _ => query
        };

        var servicios = await query
            .OrderByDescending(s => s.FechaPublicacion)
            .ToListAsync();

        return servicios.Select(MapearComun).ToList();
    }

    public async Task<IReadOnlyList<ServicioResponse>> ListarPorEstudianteAsync(int estudianteId) =>
        await ListarAsync(tipo: null, carreraId: null, estudianteId: estudianteId, activo: true);

    public async Task<ServicioDetalleResponse> ObtenerAsync(int id)
    {
        var servicio = await _db.Servicios.AsNoTracking()
            .Include(s => s.Estudiante).ThenInclude(e => e.Usuario)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException($"No existe el servicio {id}.");

        var comun = MapearComun(servicio);
        var detalle = await ObtenerDetalleAsync(servicio);

        return new ServicioDetalleResponse
        {
            Id = comun.Id,
            Titulo = comun.Titulo,
            Descripcion = comun.Descripcion,
            ImagenUrl = comun.ImagenUrl,
            Precio = comun.Precio,
            Activo = comun.Activo,
            FechaPublicacion = comun.FechaPublicacion,
            Tipo = comun.Tipo,
            EstudianteId = comun.EstudianteId,
            EstudianteNombre = comun.EstudianteNombre,
            EstudianteCalificacion = comun.EstudianteCalificacion,
            Detalle = detalle
        };
    }

    // El bloque polimorfico: trae los campos propios de la vertical concreta.
    private async Task<object?> ObtenerDetalleAsync(Servicio servicio) => servicio switch
    {
        ServicioProyectoCerrado => await _db.ServiciosProyectoCerrado.AsNoTracking()
            .Where(s => s.Id == servicio.Id)
            .Select(s => new ServicioProyectoCerradoDetalle
            {
                CatalogoServicioId = s.CatalogoServicioId,
                CatalogoServicioNombre = s.CatalogoServicio.Nombre,
                PlazoEntregaDias = s.PlazoEntregaDias,
                RevisionesIncluidas = s.RevisionesIncluidas,
                FormatoEntrega = s.FormatoEntrega
            })
            .FirstOrDefaultAsync(),

        ServicioClase c => new ServicioClaseDetalle
        {
            Materia = c.Materia,
            Nivel = c.Nivel,
            Modalidad = c.Modalidad,
            DuracionMinutosSesion = c.DuracionMinutosSesion,
            EsPaquete = c.EsPaquete,
            CantidadSesionesPaquete = c.CantidadSesionesPaquete
        },

        ServicioSalud => await _db.ServiciosSalud.AsNoTracking()
            .Where(s => s.Id == servicio.Id)
            .Select(s => new ServicioSaludDetalle
            {
                CatalogoServicioId = s.CatalogoServicioId,
                CatalogoServicioNombre = s.CatalogoServicio.Nombre,
                SupervisorId = s.SupervisorId,
                SupervisorNombre = s.Supervisor.NombreCompleto,
                SupervisorMatricula = s.Supervisor.Matricula,
                Modalidad = s.Modalidad,
                DuracionMinutosSesion = s.DuracionMinutosSesion
            })
            .FirstOrDefaultAsync(),

        _ => null
    };

    // Mapeo de los campos comunes. La vertical se deriva de la subclase concreta.
    private static ServicioResponse MapearComun(Servicio s) => new()
    {
        Id = s.Id,
        Titulo = s.Titulo,
        Descripcion = s.Descripcion,
        ImagenUrl = s.ImagenUrl,
        Precio = s.Precio,
        Activo = s.Activo,
        FechaPublicacion = s.FechaPublicacion,
        Tipo = TipoDe(s),
        EstudianteId = s.EstudianteId,
        EstudianteNombre = s.Estudiante.Usuario.NombreCompleto,
        EstudianteCalificacion = s.Estudiante.CalificacionPromedio
    };

    public static TipoServicio TipoDe(Servicio s) => s switch
    {
        ServicioProyectoCerrado => TipoServicio.ProyectoCerrado,
        ServicioClase => TipoServicio.Clase,
        ServicioSalud => TipoServicio.Salud,
        _ => throw new InvalidOperationException($"Subclase de Servicio no contemplada: {s.GetType().Name}.")
    };
}
