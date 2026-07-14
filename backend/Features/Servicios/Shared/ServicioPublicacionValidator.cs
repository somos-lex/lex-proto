using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Servicios.Shared;

// Contexto del estudiante ya validado: sus carreras verificadas y su año cursado.
public record EstudianteHabilitado(int EstudianteId, int AnioCursado, IReadOnlyList<int> CarrerasVerificadas);

// Reglas de publicacion compartidas por las tres verticales. Vive en Shared para
// no triplicar las mismas validaciones en cada service.
public class ServicioPublicacionValidator : IServicioPublicacionValidator
{
    private readonly AppDbContext _db;

    public ServicioPublicacionValidator(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Validaciones 1 y 2, comunes a las tres verticales: el usuario tiene rol
    /// Estudiante activo y al menos una carrera vinculada y VERIFICADA.
    /// </summary>
    public async Task<EstudianteHabilitado> ValidarEstudianteAsync(int estudianteId)
    {
        var tieneRol = await _db.UsuarioRoles
            .AnyAsync(ur => ur.UsuarioId == estudianteId
                         && ur.Rol.Nombre == "Estudiante"
                         && ur.Usuario.Activo);
        if (!tieneRol)
            throw new BadRequestException("Tu usuario no tiene un rol de Estudiante activo.");

        var perfil = await _db.PerfilesEstudiante
            .FirstOrDefaultAsync(p => p.UsuarioId == estudianteId)
            ?? throw new BadRequestException("Tu usuario no tiene un perfil de estudiante.");

        var carrerasVerificadas = await _db.EstudianteCarreras
            .Where(ec => ec.EstudianteId == estudianteId
                      && ec.EstadoVerificacion == EstadoVerificacion.Verificado)
            .Select(ec => ec.CarreraId)
            .ToListAsync();

        if (carrerasVerificadas.Count == 0)
            throw new BadRequestException(
                "Necesitás al menos una carrera vinculada y verificada para publicar un servicio.");

        return new EstudianteHabilitado(estudianteId, perfil.AnioCursado ?? 0, carrerasVerificadas);
    }

    /// <summary>
    /// Validaciones 3, 4 y 5 (verticales de catalogo cerrado): la entrada del
    /// catalogo existe y esta activa, es de la vertical esperada, esta habilitada
    /// para alguna carrera verificada del estudiante, y el año cursado alcanza el
    /// año minimo exigido para esa carrera.
    /// </summary>
    public async Task<CatalogoServicio> ValidarCatalogoAsync(
        int catalogoServicioId, TipoServicio tipoEsperado, EstudianteHabilitado estudiante)
    {
        var entrada = await _db.CatalogoServicios
            .FirstOrDefaultAsync(c => c.Id == catalogoServicioId && c.Activo)
            ?? throw new BadRequestException(
                $"El servicio {catalogoServicioId} no existe en el catálogo o está dado de baja.");

        if (entrada.TipoServicio != tipoEsperado)
            throw new BadRequestException(
                $"El servicio de catálogo '{entrada.Nombre}' es de tipo {entrada.TipoServicio}, no {tipoEsperado}.");

        // Habilitaciones de esta entrada para las carreras verificadas del estudiante.
        var habilitaciones = await _db.CatalogoServicioCarreras
            .Where(cc => cc.CatalogoServicioId == catalogoServicioId
                      && estudiante.CarrerasVerificadas.Contains(cc.CarreraId))
            .ToListAsync();

        if (habilitaciones.Count == 0)
            throw new BadRequestException(
                $"El servicio '{entrada.Nombre}' no está habilitado para tu carrera.");

        // Alcanza con cumplir el año minimo de UNA de sus carreras habilitadas.
        var anioMinimo = habilitaciones.Min(h => h.AnioMinimo);
        if (estudiante.AnioCursado < anioMinimo)
            throw new BadRequestException(
                $"Para publicar '{entrada.Nombre}' necesitás estar en {anioMinimo}° año o superior (estás en {estudiante.AnioCursado}°).");

        return entrada;
    }
}
