using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Servicios.Salud;

[ApiController]
[Route("api/servicios/salud")]
[Authorize(Roles = "Estudiante")]
public class ServicioSaludController : ControllerBase
{
    private readonly IServicioSaludService _servicios;

    public ServicioSaludController(IServicioSaludService servicios)
    {
        _servicios = servicios;
    }

    /// <summary>El estudiante publica un servicio de salud (catálogo + supervisor matriculado).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ServicioSaludResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear([FromBody] CrearServicioSaludRequest request)
    {
        var servicio = await _servicios.CrearAsync(User.GetUsuarioId(), request);
        return CreatedAtAction(nameof(Obtener), new { id = servicio.Id }, servicio);
    }

    /// <summary>Edita un servicio de salud propio.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ServicioSaludResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarServicioSaludRequest request)
    {
        return Ok(await _servicios.ActualizarAsync(User.GetUsuarioId(), id, request));
    }

    /// <summary>Baja lógica de un servicio de salud propio (activo = false).</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _servicios.EliminarAsync(User.GetUsuarioId(), id);
        return NoContent();
    }

    /// <summary>Detalle público de un servicio de salud (con supervisor y modalidad).</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ServicioSaludResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(int id)
    {
        return Ok(await _servicios.ObtenerAsync(id));
    }
}
