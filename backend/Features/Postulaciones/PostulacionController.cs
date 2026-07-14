using Lex.Api.Features.Trabajos;
using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Postulaciones;

// Las rutas cruzan /solicitudes y /postulaciones, por eso no hay [Route] a nivel de clase.
/// <summary>
/// [PAUSADO - Sub-hito 1.1] Módulo de Solicitudes (postulaciones) está en revisión de diseño.
/// Se decidirá su forma final en un sub-hito posterior, alineado con el catálogo cerrado.
/// </summary>
[ApiController]
[ApiExplorerSettings(IgnoreApi = true)]
[Authorize(Roles = "Admin")]
public class PostulacionController : ControllerBase
{
    private readonly IPostulacionService _postulaciones;

    public PostulacionController(IPostulacionService postulaciones)
    {
        _postulaciones = postulaciones;
    }

    /// <summary>Un estudiante se postula a una solicitud abierta.</summary>
    [HttpPost("api/solicitudes/{idSolicitud:int}/postulaciones")]
    [ProducesResponseType(typeof(PostulacionResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Postularse(int idSolicitud, [FromBody] CrearPostulacionRequest request)
    {
        var postulacion = await _postulaciones.CrearAsync(User.GetUsuarioId(), idSolicitud, request);
        return StatusCode(StatusCodes.Status201Created, postulacion);
    }

    /// <summary>El cliente dueño ve las postulaciones recibidas en su solicitud.</summary>
    [HttpGet("api/solicitudes/{idSolicitud:int}/postulaciones")]
    [ProducesResponseType(typeof(IEnumerable<PostulacionRecibidaResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Recibidas(int idSolicitud)
    {
        return Ok(await _postulaciones.ListarRecibidasAsync(User.GetUsuarioId(), idSolicitud));
    }

    /// <summary>Las postulaciones enviadas por el estudiante autenticado.</summary>
    [HttpGet("api/postulaciones/mias")]
    [ProducesResponseType(typeof(IEnumerable<PostulacionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Mias()
    {
        return Ok(await _postulaciones.ListarMiasAsync(User.GetUsuarioId()));
    }

    /// <summary>El cliente dueño acepta una postulación: cierra la solicitud y crea el trabajo.</summary>
    [HttpPost("api/postulaciones/{id:int}/aceptar")]
    [ProducesResponseType(typeof(TrabajoResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Aceptar(int id)
    {
        var trabajo = await _postulaciones.AceptarAsync(User.GetUsuarioId(), id);
        return Created($"/api/trabajos/{trabajo.Id}", trabajo);
    }
}
