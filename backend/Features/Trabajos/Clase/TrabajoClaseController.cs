using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Trabajos.Clase;

[ApiController]
[Route("api/trabajos/clase")]
[Authorize]
public class TrabajoClaseController : ControllerBase
{
    private readonly ITrabajoClaseService _trabajos;

    public TrabajoClaseController(ITrabajoClaseService trabajos)
    {
        _trabajos = trabajos;
    }

    /// <summary>Un cliente contrata un servicio de clases (crea el trabajo en Pendiente).</summary>
    [HttpPost]
    [Authorize(Roles = "Cliente")]
    [ProducesResponseType(typeof(TrabajoClaseResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Contratar([FromBody] ContratarTrabajoClaseRequest request)
    {
        var trabajo = await _trabajos.ContratarAsync(User.GetUsuarioId(), request);
        return CreatedAtAction(nameof(Obtener), new { id = trabajo.Id }, trabajo);
    }

    /// <summary>Detalle completo del trabajo de clase (solo para sus partes).</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TrabajoClaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(int id)
    {
        return Ok(await _trabajos.ObtenerAsync(User.GetUsuarioId(), id));
    }
}
