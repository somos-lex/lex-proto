using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Features.Perfil;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Catalogo;

[ApiController]
[Route("api/catalogo")]
public class CatalogoController : ControllerBase
{
    private readonly IPerfilService _perfil;
    private readonly AppDbContext _db;

    public CatalogoController(IPerfilService perfil, AppDbContext db)
    {
        _perfil = perfil;
        _db = db;
    }

    /// <summary>Catálogo público de carreras (con su institución) para poblar los selectores del frontend.</summary>
    [HttpGet("carreras")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<CarreraCatalogoResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Carreras()
    {
        return Ok(await _perfil.ListarCarrerasAsync());
    }

    /// <summary>
    /// Servicios del catálogo cerrado que una carrera puede ofrecer a partir de un año
    /// dado. Es lo que el frontend usa para poblar el selector al publicar un servicio.
    /// </summary>
    [HttpGet("servicios-permitidos")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<CatalogoServicioPermitidoResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ServiciosPermitidos(
        [FromQuery(Name = "carrera_id")] int carreraId,
        [FromQuery] int anio)
    {
        var permitidos = await _db.CatalogoServicioCarreras.AsNoTracking()
            .Where(cc => cc.CarreraId == carreraId
                      && cc.AnioMinimo <= anio
                      && cc.CatalogoServicio.Activo)
            .OrderBy(cc => cc.CatalogoServicio.Nombre)
            .Select(cc => new CatalogoServicioPermitidoResponse
            {
                Id = cc.CatalogoServicioId,
                Nombre = cc.CatalogoServicio.Nombre,
                Descripcion = cc.CatalogoServicio.Descripcion,
                TipoServicio = cc.CatalogoServicio.TipoServicio,
                RequiereSupervisor = cc.CatalogoServicio.RequiereSupervisor,
                Observaciones = cc.CatalogoServicio.Observaciones,
                AnioMinimo = cc.AnioMinimo
            })
            .ToListAsync();

        return Ok(permitidos);
    }

    /// <summary>Detalle de una entrada del catálogo, con el año mínimo de cada carrera habilitada.</summary>
    [HttpGet("servicios-permitidos/{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CatalogoServicioDetalleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ServicioPermitido(int id)
    {
        var entrada = await _db.CatalogoServicios.AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CatalogoServicioDetalleResponse
            {
                Id = c.Id,
                Nombre = c.Nombre,
                Descripcion = c.Descripcion,
                TipoServicio = c.TipoServicio,
                RequiereSupervisor = c.RequiereSupervisor,
                Activo = c.Activo,
                Observaciones = c.Observaciones,
                Carreras = c.Carreras.Select(cc => new CatalogoCarreraResponse
                {
                    CarreraId = cc.CarreraId,
                    Carrera = cc.Carrera.Nombre,
                    Institucion = cc.Carrera.Institucion.Nombre,
                    AnioMinimo = cc.AnioMinimo
                }).ToList()
            })
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"No existe la entrada de catálogo {id}.");

        return Ok(entrada);
    }

    /// <summary>Profesionales matriculados activos, para elegir supervisor al publicar un servicio de Salud.</summary>
    [HttpGet("supervisores")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<SupervisorResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Supervisores()
    {
        var supervisores = await _db.ProfesionalesSupervisores.AsNoTracking()
            .Where(p => p.Activo)
            .OrderBy(p => p.NombreCompleto)
            .Select(p => new SupervisorResponse
            {
                Id = p.Id,
                NombreCompleto = p.NombreCompleto,
                Matricula = p.Matricula,
                Especialidad = p.Especialidad,
                InstitucionId = p.InstitucionId,
                Institucion = p.Institucion != null ? p.Institucion.Nombre : null
            })
            .ToListAsync();

        return Ok(supervisores);
    }
}
