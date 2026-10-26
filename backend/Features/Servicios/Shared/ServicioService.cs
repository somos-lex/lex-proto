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

    public async Task<PaginacionResponse<ServicioResponse>> ListarAsync(
        TipoServicio? tipo, int? carreraId, int? estudianteId, bool? activo,
        int page, int pageSize, CancellationToken ct = default)
    {
        // Clamp: page al menos 1, pageSize entre 1 y 100. Una pagina fuera de rango
        // devuelve items vacio (Skip mas alla del total), no un error.
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = ConstruirQuery(tipo, carreraId, estudianteId, activo);

        var total = await query.CountAsync(ct);

        // Orden estable del catalogo: los mas recientes primero.
        var servicios = await query
            .OrderByDescending(s => s.FechaPublicacion)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PaginacionResponse<ServicioResponse>
        {
            Items = await MapearAsync(servicios, ct),
            Total = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(total / (double)pageSize)
        };
    }

    // El portafolio necesita TODOS los servicios activos del estudiante, sin paginar.
    public async Task<IReadOnlyList<ServicioResponse>> ListarPorEstudianteAsync(int estudianteId)
    {
        var servicios = await ConstruirQuery(tipo: null, carreraId: null, estudianteId: estudianteId, activo: true)
            .OrderByDescending(s => s.FechaPublicacion)
            .ToListAsync();

        return await MapearAsync(servicios);
    }

    // Aplica los filtros comunes del catalogo. Devuelve el IQueryable sin materializar,
    // para que cada llamador decida si pagina o trae todo.
    private IQueryable<Servicio> ConstruirQuery(
        TipoServicio? tipo, int? carreraId, int? estudianteId, bool? activo)
    {
        var query = ConDatosDeTarjeta(_db.Servicios.AsNoTracking());

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
        return tipo switch
        {
            TipoServicio.ProyectoCerrado => query.Where(s => s is ServicioProyectoCerrado),
            TipoServicio.Clase => query.Where(s => s is ServicioClase),
            TipoServicio.Salud => query.Where(s => s is ServicioSalud),
            _ => query
        };
    }

    public async Task<ServicioDetalleResponse> ObtenerAsync(int id)
    {
        var servicio = await ConDatosDeTarjeta(_db.Servicios.AsNoTracking())
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException($"No existe el servicio {id}.");

        var comun = (await MapearAsync(new[] { servicio })).Single();
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
            Credencial = comun.Credencial,
            Supervisor = comun.Supervisor,
            Tema = comun.Tema,
            Condiciones = comun.Condiciones,
            Detalle = detalle
        };
    }

    // Lo que necesita la tarjeta (D5): el estudiante, y el catalogo y el supervisor de las
    // subclases. Con TPT, el Include sobre una navegacion de la subclase va con un cast.
    private static IQueryable<Servicio> ConDatosDeTarjeta(IQueryable<Servicio> query) => query
        .Include(s => s.Estudiante).ThenInclude(e => e.Usuario)
        .Include(s => (s as ServicioProyectoCerrado)!.CatalogoServicio)
        .Include(s => (s as ServicioSalud)!.CatalogoServicio)
        .Include(s => (s as ServicioSalud)!.Supervisor);

    private async Task<List<ServicioResponse>> MapearAsync(
        IReadOnlyList<Servicio> servicios, CancellationToken ct = default)
    {
        var credenciales = await CredencialesAsync(servicios, ct);
        return servicios.Select(s => MapearComun(s, credenciales.GetValueOrDefault(s.Id))).ToList();
    }

    // La credencial muestra siempre una carrera VERIFICADA del estudiante. En Proyecto
    // cerrado y Salud, una de las habilitadas para la entrada del catalogo (la que lo dejo
    // publicar); si el catalogo cambio despues y ya ninguna lo esta, otra verificada. En
    // Clase, que es de catalogo libre, la primera verificada. Sin ninguna verificada, null:
    // la tarjeta no puede decir "Carrera verificada por LEX".
    // Son dos consultas por pagina, no una por servicio.
    private async Task<Dictionary<int, CredencialEstudianteResponse>> CredencialesAsync(
        IReadOnlyList<Servicio> servicios, CancellationToken ct)
    {
        var estudiantes = servicios.Select(s => s.EstudianteId).Distinct().ToList();
        var verificadas = await _db.EstudianteCarreras.AsNoTracking()
            .Where(ec => estudiantes.Contains(ec.EstudianteId)
                      && ec.EstadoVerificacion == EstadoVerificacion.Verificado)
            .OrderBy(ec => ec.CarreraId)
            .Select(ec => new
            {
                ec.EstudianteId,
                ec.CarreraId,
                Carrera = ec.Carrera.Nombre,
                Institucion = ec.Carrera.Institucion.Nombre
            })
            .ToListAsync(ct);

        var catalogos = servicios.Select(CatalogoDe).OfType<int>().Distinct().ToList();
        var habilitaciones = await _db.CatalogoServicioCarreras.AsNoTracking()
            .Where(cc => catalogos.Contains(cc.CatalogoServicioId))
            .Select(cc => new { cc.CatalogoServicioId, cc.CarreraId })
            .ToListAsync(ct);

        var resultado = new Dictionary<int, CredencialEstudianteResponse>();
        foreach (var s in servicios)
        {
            var delEstudiante = verificadas.Where(v => v.EstudianteId == s.EstudianteId).ToList();
            var habilitadas = CatalogoDe(s) is int catalogo
                ? habilitaciones.Where(h => h.CatalogoServicioId == catalogo).Select(h => h.CarreraId).ToHashSet()
                : null;
            var elegida = (habilitadas is null ? null : delEstudiante.FirstOrDefault(v => habilitadas.Contains(v.CarreraId)))
                          ?? delEstudiante.FirstOrDefault();
            if (elegida is null) continue;

            resultado[s.Id] = new CredencialEstudianteResponse
            {
                Carrera = elegida.Carrera,
                Institucion = elegida.Institucion,
                AnioCursado = s.Estudiante.AnioCursado
            };
        }
        return resultado;
    }

    private static int? CatalogoDe(Servicio s) => s switch
    {
        ServicioProyectoCerrado pc => pc.CatalogoServicioId,
        ServicioSalud sa => sa.CatalogoServicioId,
        _ => null
    };

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
    private static ServicioResponse MapearComun(Servicio s, CredencialEstudianteResponse? credencial) => new()
    {
        Credencial = credencial,
        Supervisor = s is ServicioSalud { Supervisor: { } sup }
            ? new SupervisorResumenResponse { Nombre = sup.NombreCompleto, Matricula = sup.Matricula }
            : null,
        Tema = s switch
        {
            ServicioProyectoCerrado pc => pc.CatalogoServicio?.Nombre,
            ServicioSalud sa => sa.CatalogoServicio?.Nombre,
            ServicioClase c => c.Materia,
            _ => null
        },
        Condiciones = s switch
        {
            ServicioProyectoCerrado pc => new CondicionesServicioResponse { PlazoEntregaDias = pc.PlazoEntregaDias },
            ServicioClase c => new CondicionesServicioResponse
            {
                DuracionMinutosSesion = c.DuracionMinutosSesion,
                Modalidad = c.Modalidad.ToString(),
                EsPaquete = c.EsPaquete,
                CantidadSesionesPaquete = c.CantidadSesionesPaquete
            },
            ServicioSalud sa => new CondicionesServicioResponse
            {
                DuracionMinutosSesion = sa.DuracionMinutosSesion,
                Modalidad = sa.Modalidad.ToString()
            },
            _ => null
        },
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
