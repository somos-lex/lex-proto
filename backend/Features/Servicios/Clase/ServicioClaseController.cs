using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Servicios.Clase;

[ApiController]
[Route("api/servicios/clase")]
[Authorize(Roles = "Estudiante")]
public class ServicioClaseController : ControllerBase
{
    private readonly IServicioClaseService _servicios;

    public ServicioClaseController(IServicioClaseService servicios)
    {
        _servicios = servicios;
    }

    /// <summary>El estudiante publica una clase (catálogo libre: materia y nivel a texto libre).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ServicioClaseResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear([FromBody] CrearServicioClaseRequest request)
    {
        var servicio = await _servicios.CrearAsync(User.GetUsuarioId(), request);
        return CreatedAtAction(nameof(Obtener), new { id = servicio.Id }, servicio);
    }

    /// <summary>Edita una clase propia.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ServicioClaseResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarServicioClaseRequest request)
    {
        return Ok(await _servicios.ActualizarAsync(User.GetUsuarioId(), id, request));
    }

    /// <summary>Baja lógica de una clase propia (activo = false).</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _servicios.EliminarAsync(User.GetUsuarioId(), id);
        return NoContent();
    }

    /// <summary>Detalle público de una clase (con sus campos específicos).</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ServicioClaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(int id)
    {
        return Ok(await _servicios.ObtenerAsync(id));
    }
}
