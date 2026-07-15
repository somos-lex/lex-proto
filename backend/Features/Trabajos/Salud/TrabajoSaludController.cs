using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Trabajos.Salud;

[ApiController]
[Route("api/trabajos/salud")]
[Authorize]
public class TrabajoSaludController : ControllerBase
{
    private readonly ITrabajoSaludService _trabajos;

    public TrabajoSaludController(ITrabajoSaludService trabajos)
    {
        _trabajos = trabajos;
    }

    /// <summary>Un cliente contrata un servicio de salud para un paciente (crea el trabajo en Pendiente).</summary>
    [HttpPost]
    [Authorize(Roles = "Cliente")]
    [ProducesResponseType(typeof(TrabajoSaludResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Contratar([FromBody] ContratarTrabajoSaludRequest request)
    {
        var trabajo = await _trabajos.ContratarAsync(User.GetUsuarioId(), request);
        return CreatedAtAction(nameof(Obtener), new { id = trabajo.Id }, trabajo);
    }

    /// <summary>El cliente firma el consentimiento informado del trabajo (habilita pasar a EnCurso).</summary>
    [HttpPost("{id:int}/consentimiento")]
    [Authorize(Roles = "Cliente")]
    [ProducesResponseType(typeof(TrabajoSaludResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> FirmarConsentimiento(int id)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        return Ok(await _trabajos.FirmarConsentimientoAsync(User.GetUsuarioId(), id, ip));
    }

    /// <summary>Detalle completo del trabajo de salud (solo para sus partes).</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TrabajoSaludResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(int id)
    {
        return Ok(await _trabajos.ObtenerAsync(User.GetUsuarioId(), id));
    }
}
