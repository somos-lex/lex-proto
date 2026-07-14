using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Servicios.Shared;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Servicios.Salud;

// La vertical mas restrictiva: las mismas 5 validaciones que ProyectoCerrado
// (rol, carrera verificada, catalogo, habilitacion por carrera, año minimo)
// mas supervisor matriculado activo.
public class ServicioSaludService : IServicioSaludService
{
    private readonly AppDbContext _db;
    private readonly IServicioPublicacionValidator _validator;

    public ServicioSaludService(AppDbContext db, IServicioPublicacionValidator validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ServicioSaludResponse> CrearAsync(int estudianteId, CrearServicioSaludRequest request)
    {
        ValidarCampos(request.Precio, request.DuracionMinutosSesion);

        // 1-2) rol Estudiante activo + carrera vinculada y verificada.
        var estudiante = await _validator.ValidarEstudianteAsync(estudianteId);

        // 3-5) catalogo activo de tipo Salud, habilitado para su carrera, año minimo alcanzado.
        var entrada = await _validator.ValidarCatalogoAsync(request.CatalogoServicioId, TipoServicio.Salud, estudiante);

        // 6-7) supervisor matriculado activo, obligatorio si el catalogo lo exige.
        await ValidarSupervisorAsync(request.SupervisorId, entrada);

        var servicio = new ServicioSalud
        {
            EstudianteId = estudianteId,
            Titulo = request.Titulo.Trim(),
            Descripcion = request.Descripcion.Trim(),
            ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl) ? null : request.ImagenUrl.Trim(),
            Precio = request.Precio,
            Activo = true,
            FechaPublicacion = DateTime.UtcNow,
            CatalogoServicioId = request.CatalogoServicioId,
            SupervisorId = request.SupervisorId,
            Modalidad = request.Modalidad,
            DuracionMinutosSesion = request.DuracionMinutosSesion
        };

        _db.ServiciosSalud.Add(servicio);
        await _db.SaveChangesAsync();

        return await ObtenerAsync(servicio.Id);
    }

    public async Task<ServicioSaludResponse> ActualizarAsync(int estudianteId, int id, ActualizarServicioSaludRequest request)
    {
        ValidarCampos(request.Precio, request.DuracionMinutosSesion);

        var servicio = await _db.ServiciosSalud.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException($"No existe el servicio de salud {id}.");

        if (servicio.EstudianteId != estudianteId)
            throw new ForbiddenException("No podés editar un servicio que no es tuyo.");

        var estudiante = await _validator.ValidarEstudianteAsync(estudianteId);
        var entrada = await _validator.ValidarCatalogoAsync(request.CatalogoServicioId, TipoServicio.Salud, estudiante);
        await ValidarSupervisorAsync(request.SupervisorId, entrada);

        servicio.Titulo = request.Titulo.Trim();
        servicio.Descripcion = request.Descripcion.Trim();
        servicio.ImagenUrl = string.IsNullOrWhiteSpace(request.ImagenUrl) ? null : request.ImagenUrl.Trim();
        servicio.Precio = request.Precio;
        servicio.CatalogoServicioId = request.CatalogoServicioId;
        servicio.SupervisorId = request.SupervisorId;
        servicio.Modalidad = request.Modalidad;
        servicio.DuracionMinutosSesion = request.DuracionMinutosSesion;

        await _db.SaveChangesAsync();

        return await ObtenerAsync(servicio.Id);
    }

    public async Task EliminarAsync(int estudianteId, int id)
    {
        var servicio = await _db.ServiciosSalud.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException($"No existe el servicio de salud {id}.");

        if (servicio.EstudianteId != estudianteId)
            throw new ForbiddenException("No podés dar de baja un servicio que no es tuyo.");

        servicio.Activo = false;
        await _db.SaveChangesAsync();
    }

    public async Task<ServicioSaludResponse> ObtenerAsync(int id)
    {
        return await _db.ServiciosSalud.AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new ServicioSaludResponse
            {
                Id = s.Id,
                Titulo = s.Titulo,
                Descripcion = s.Descripcion,
                ImagenUrl = s.ImagenUrl,
                Precio = s.Precio,
                Activo = s.Activo,
                FechaPublicacion = s.FechaPublicacion,
                Tipo = TipoServicio.Salud,
                EstudianteId = s.EstudianteId,
                EstudianteNombre = s.Estudiante.Usuario.NombreCompleto,
                EstudianteCalificacion = s.Estudiante.CalificacionPromedio,
                CatalogoServicioId = s.CatalogoServicioId,
                CatalogoServicioNombre = s.CatalogoServicio.Nombre,
                SupervisorId = s.SupervisorId,
                SupervisorNombre = s.Supervisor.NombreCompleto,
                SupervisorMatricula = s.Supervisor.Matricula,
                Modalidad = s.Modalidad,
                DuracionMinutosSesion = s.DuracionMinutosSesion
            })
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"No existe el servicio de salud {id}.");
    }

    // 6) El supervisor debe existir y estar activo.
    // 7) Si el catalogo exige supervisor, no puede faltar.
    private async Task ValidarSupervisorAsync(int supervisorId, CatalogoServicio entrada)
    {
        if (entrada.RequiereSupervisor && supervisorId <= 0)
            throw new BadRequestException(
                $"El servicio '{entrada.Nombre}' exige un profesional supervisor matriculado.");

        var activo = await _db.ProfesionalesSupervisores
            .AnyAsync(p => p.Id == supervisorId && p.Activo);

        if (!activo)
            throw new BadRequestException($"El supervisor {supervisorId} no existe o no está activo.");
    }

    private static void ValidarCampos(decimal precio, int duracion)
    {
        if (precio <= 0)
            throw new BadRequestException("El precio debe ser mayor a 0.");
        if (duracion <= 0)
            throw new BadRequestException("La duración de la sesión debe ser mayor a 0 minutos.");
    }
}
