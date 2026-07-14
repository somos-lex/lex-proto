using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Servicios.Shared;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Servicios.Clase;

// Vertical de catalogo LIBRE: valida al estudiante (rol + carrera verificada)
// pero NO contra el catalogo cerrado. La materia y el nivel son texto libre.
public class ServicioClaseService : IServicioClaseService
{
    private readonly AppDbContext _db;
    private readonly IServicioPublicacionValidator _validator;

    public ServicioClaseService(AppDbContext db, IServicioPublicacionValidator validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ServicioClaseResponse> CrearAsync(int estudianteId, CrearServicioClaseRequest request)
    {
        ValidarCampos(request.Precio, request.DuracionMinutosSesion, request.EsPaquete, request.CantidadSesionesPaquete);

        // 1-2) rol Estudiante activo + carrera vinculada y verificada. Sin validacion de catalogo.
        await _validator.ValidarEstudianteAsync(estudianteId);

        var servicio = new ServicioClase
        {
            EstudianteId = estudianteId,
            Titulo = request.Titulo.Trim(),
            Descripcion = request.Descripcion.Trim(),
            ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl) ? null : request.ImagenUrl.Trim(),
            Precio = request.Precio,
            Activo = true,
            FechaPublicacion = DateTime.UtcNow,
            Materia = request.Materia.Trim(),
            Nivel = request.Nivel,
            Modalidad = request.Modalidad,
            DuracionMinutosSesion = request.DuracionMinutosSesion,
            EsPaquete = request.EsPaquete,
            CantidadSesionesPaquete = request.EsPaquete ? request.CantidadSesionesPaquete : null
        };

        _db.ServiciosClase.Add(servicio);
        await _db.SaveChangesAsync();

        return await ObtenerAsync(servicio.Id);
    }

    public async Task<ServicioClaseResponse> ActualizarAsync(int estudianteId, int id, ActualizarServicioClaseRequest request)
    {
        ValidarCampos(request.Precio, request.DuracionMinutosSesion, request.EsPaquete, request.CantidadSesionesPaquete);

        var servicio = await _db.ServiciosClase.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException($"No existe la clase {id}.");

        if (servicio.EstudianteId != estudianteId)
            throw new ForbiddenException("No podés editar un servicio que no es tuyo.");

        servicio.Titulo = request.Titulo.Trim();
        servicio.Descripcion = request.Descripcion.Trim();
        servicio.ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl) ? null : request.ImagenUrl.Trim();
        servicio.Precio = request.Precio;
        servicio.Materia = request.Materia.Trim();
        servicio.Nivel = request.Nivel;
        servicio.Modalidad = request.Modalidad;
        servicio.DuracionMinutosSesion = request.DuracionMinutosSesion;
        servicio.EsPaquete = request.EsPaquete;
        servicio.CantidadSesionesPaquete = request.EsPaquete ? request.CantidadSesionesPaquete : null;

        await _db.SaveChangesAsync();

        return await ObtenerAsync(servicio.Id);
    }

    public async Task EliminarAsync(int estudianteId, int id)
    {
        var servicio = await _db.ServiciosClase.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException($"No existe la clase {id}.");

        if (servicio.EstudianteId != estudianteId)
            throw new ForbiddenException("No podés dar de baja un servicio que no es tuyo.");

        servicio.Activo = false;
        await _db.SaveChangesAsync();
    }

    public async Task<ServicioClaseResponse> ObtenerAsync(int id)
    {
        return await _db.ServiciosClase.AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new ServicioClaseResponse
            {
                Id = s.Id,
                Titulo = s.Titulo,
                Descripcion = s.Descripcion,
                ImagenUrl = s.ImagenUrl,
                Precio = s.Precio,
                Activo = s.Activo,
                FechaPublicacion = s.FechaPublicacion,
                Tipo = TipoServicio.Clase,
                EstudianteId = s.EstudianteId,
                EstudianteNombre = s.Estudiante.Usuario.NombreCompleto,
                EstudianteCalificacion = s.Estudiante.CalificacionPromedio,
                Materia = s.Materia,
                Nivel = s.Nivel,
                Modalidad = s.Modalidad,
                DuracionMinutosSesion = s.DuracionMinutosSesion,
                EsPaquete = s.EsPaquete,
                CantidadSesionesPaquete = s.CantidadSesionesPaquete
            })
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"No existe la clase {id}.");
    }

    private static void ValidarCampos(decimal precio, int duracion, bool esPaquete, int? cantidadSesiones)
    {
        if (precio <= 0)
            throw new BadRequestException("El precio debe ser mayor a 0.");
        if (duracion <= 0)
            throw new BadRequestException("La duración de la sesión debe ser mayor a 0 minutos.");

        // 3) Si es paquete, la cantidad de sesiones es obligatoria y debe ser > 0.
        if (esPaquete && (cantidadSesiones is null || cantidadSesiones <= 0))
            throw new BadRequestException("Si el servicio es un paquete, la cantidad de sesiones debe ser mayor a 0.");
    }
}
