using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Trabajos.ProyectoCerrado;

[ApiController]
[Route("api/trabajos/proyecto-cerrado")]
[Authorize]
public class TrabajoProyectoCerradoController : ControllerBase
{
    private readonly ITrabajoProyectoCerradoService _trabajos;

    public TrabajoProyectoCerradoController(ITrabajoProyectoCerradoService trabajos)
    {
        _trabajos = trabajos;
    }

    /// <summary>Un cliente contrata un servicio de proyecto cerrado (crea el trabajo en Pendiente).</summary>
    [HttpPost]
    [Authorize(Roles = "Cliente")]
    [ProducesResponseType(typeof(TrabajoProyectoCerradoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Contratar([FromBody] ContratarTrabajoProyectoCerradoRequest request)
    {
        var trabajo = await _trabajos.ContratarAsync(User.GetUsuarioId(), request);
        return CreatedAtAction(nameof(Obtener), new { id = trabajo.Id }, trabajo);
    }

    /// <summary>Detalle completo del trabajo de proyecto cerrado (solo para sus partes).</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TrabajoProyectoCerradoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(int id)
    {
        return Ok(await _trabajos.ObtenerAsync(User.GetUsuarioId(), id));
    }
}
