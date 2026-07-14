using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Servicios.Shared;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Servicios.ProyectoCerrado;

public class ServicioProyectoCerradoService : IServicioProyectoCerradoService
{
    private readonly AppDbContext _db;
    private readonly IServicioPublicacionValidator _validator;

    public ServicioProyectoCerradoService(AppDbContext db, IServicioPublicacionValidator validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ServicioProyectoCerradoResponse> CrearAsync(int estudianteId, CrearServicioProyectoCerradoRequest request)
    {
        ValidarCampos(request.Precio, request.PlazoEntregaDias, request.RevisionesIncluidas);

        // 1-2) rol Estudiante activo + carrera vinculada y verificada.
        var estudiante = await _validator.ValidarEstudianteAsync(estudianteId);

        // 3-5) catalogo activo del tipo correcto, habilitado para su carrera, año minimo alcanzado.
        await _validator.ValidarCatalogoAsync(request.CatalogoServicioId, TipoServicio.ProyectoCerrado, estudiante);

        var servicio = new ServicioProyectoCerrado
        {
            EstudianteId = estudianteId,
            Titulo = request.Titulo.Trim(),
            Descripcion = request.Descripcion.Trim(),
            ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl) ? null : request.ImagenUrl.Trim(),
            Precio = request.Precio,
            Activo = true,
            FechaPublicacion = DateTime.UtcNow,
            CatalogoServicioId = request.CatalogoServicioId,
            PlazoEntregaDias = request.PlazoEntregaDias,
            RevisionesIncluidas = request.RevisionesIncluidas,
            FormatoEntrega = request.FormatoEntrega
        };

        _db.ServiciosProyectoCerrado.Add(servicio);
        await _db.SaveChangesAsync();

        return await ObtenerAsync(servicio.Id);
    }

    public async Task<ServicioProyectoCerradoResponse> ActualizarAsync(int estudianteId, int id, ActualizarServicioProyectoCerradoRequest request)
    {
        ValidarCampos(request.Precio, request.PlazoEntregaDias, request.RevisionesIncluidas);

        var servicio = await _db.ServiciosProyectoCerrado.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException($"No existe el servicio de proyecto cerrado {id}.");

        if (servicio.EstudianteId != estudianteId)
            throw new ForbiddenException("No podés editar un servicio que no es tuyo.");

        // El catalogo se revalida: puede haber cambiado a una entrada no habilitada.
        var estudiante = await _validator.ValidarEstudianteAsync(estudianteId);
        await _validator.ValidarCatalogoAsync(request.CatalogoServicioId, TipoServicio.ProyectoCerrado, estudiante);

        servicio.Titulo = request.Titulo.Trim();
        servicio.Descripcion = request.Descripcion.Trim();
        servicio.ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl) ? null : request.ImagenUrl.Trim();
        servicio.Precio = request.Precio;
        servicio.CatalogoServicioId = request.CatalogoServicioId;
        servicio.PlazoEntregaDias = request.PlazoEntregaDias;
        servicio.RevisionesIncluidas = request.RevisionesIncluidas;
        servicio.FormatoEntrega = request.FormatoEntrega;

        await _db.SaveChangesAsync();

        return await ObtenerAsync(servicio.Id);
    }

    public async Task EliminarAsync(int estudianteId, int id)
    {
        var servicio = await _db.ServiciosProyectoCerrado.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException($"No existe el servicio de proyecto cerrado {id}.");

        if (servicio.EstudianteId != estudianteId)
            throw new ForbiddenException("No podés dar de baja un servicio que no es tuyo.");

        // Baja logica: no se borra fisicamente.
        servicio.Activo = false;
        await _db.SaveChangesAsync();
    }

    public async Task<ServicioProyectoCerradoResponse> ObtenerAsync(int id)
    {
        return await _db.ServiciosProyectoCerrado.AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new ServicioProyectoCerradoResponse
            {
                Id = s.Id,
                Titulo = s.Titulo,
                Descripcion = s.Descripcion,
                ImagenUrl = s.ImagenUrl,
                Precio = s.Precio,
                Activo = s.Activo,
                FechaPublicacion = s.FechaPublicacion,
                Tipo = TipoServicio.ProyectoCerrado,
                EstudianteId = s.EstudianteId,
                EstudianteNombre = s.Estudiante.Usuario.NombreCompleto,
                EstudianteCalificacion = s.Estudiante.CalificacionPromedio,
                CatalogoServicioId = s.CatalogoServicioId,
                CatalogoServicioNombre = s.CatalogoServicio.Nombre,
                PlazoEntregaDias = s.PlazoEntregaDias,
                RevisionesIncluidas = s.RevisionesIncluidas,
                FormatoEntrega = s.FormatoEntrega
            })
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"No existe el servicio de proyecto cerrado {id}.");
    }

    private static void ValidarCampos(decimal precio, int plazoEntregaDias, int revisionesIncluidas)
    {
        if (precio <= 0)
            throw new BadRequestException("El precio debe ser mayor a 0.");
        if (plazoEntregaDias <= 0)
            throw new BadRequestException("El plazo de entrega debe ser mayor a 0 días.");
        if (revisionesIncluidas < 0)
            throw new BadRequestException("Las revisiones incluidas no pueden ser negativas.");
    }
}
