using Lex.Api.Domain.Enums;
using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Solicitudes;

/// <summary>
/// [PAUSADO - Sub-hito 1.1] Módulo de Solicitudes está en revisión de diseño.
/// Se decidirá su forma final en un sub-hito posterior, alineado con el catálogo cerrado.
/// </summary>
[ApiController]
[ApiExplorerSettings(IgnoreApi = true)]
[Authorize(Roles = "Admin")]
[Route("api/solicitudes")]
public class SolicitudController : ControllerBase
{
    private readonly ISolicitudService _solicitudes;

    public SolicitudController(ISolicitudService solicitudes)
    {
        _solicitudes = solicitudes;
    }

    /// <summary>Un cliente publica una solicitud (nace Abierta).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(SolicitudResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Crear([FromBody] CrearSolicitudRequest request)
    {
        var solicitud = await _solicitudes.CrearAsync(User.GetUsuarioId(), request);
        return CreatedAtAction(nameof(Obtener), new { id = solicitud.Id }, solicitud);
    }

    /// <summary>Listado publico de solicitudes Abiertas, con filtros opcionales.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<SolicitudResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar([FromQuery] TipoServicio? tipo, [FromQuery] string? texto)
    {
        return Ok(await _solicitudes.ListarAbiertasAsync(tipo, texto));
    }

    /// <summary>Las solicitudes del cliente autenticado, con su cantidad de postulaciones.</summary>
    [HttpGet("mias")]
    [ProducesResponseType(typeof(IEnumerable<SolicitudMiaResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Mias()
    {
        return Ok(await _solicitudes.ListarMiasAsync(User.GetUsuarioId()));
    }

    /// <summary>Detalle publico de una solicitud.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(SolicitudResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Obtener(int id)
    {
        return Ok(await _solicitudes.ObtenerAsync(id));
    }

    /// <summary>El dueño cierra/cancela su solicitud (estado Cancelada).</summary>
    [HttpPatch("{id:int}/cerrar")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Cerrar(int id)
    {
        await _solicitudes.CerrarAsync(User.GetUsuarioId(), id);
        return NoContent();
    }
}
