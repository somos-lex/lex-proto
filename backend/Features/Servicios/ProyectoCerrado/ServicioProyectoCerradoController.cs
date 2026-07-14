using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Servicios.ProyectoCerrado;

[ApiController]
[Route("api/servicios/proyecto-cerrado")]
[Authorize(Roles = "Estudiante")] // por defecto: solo estudiantes gestionan su oferta
public class ServicioProyectoCerradoController : ControllerBase
{
    private readonly IServicioProyectoCerradoService _servicios;

    public ServicioProyectoCerradoController(IServicioProyectoCerradoService servicios)
    {
        _servicios = servicios;
    }

    /// <summary>El estudiante publica un servicio de proyecto cerrado (validado contra el catálogo).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ServicioProyectoCerradoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear([FromBody] CrearServicioProyectoCerradoRequest request)
    {
        var servicio = await _servicios.CrearAsync(User.GetUsuarioId(), request);
        return CreatedAtAction(nameof(Obtener), new { id = servicio.Id }, servicio);
    }

    /// <summary>Edita un servicio de proyecto cerrado propio.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ServicioProyectoCerradoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarServicioProyectoCerradoRequest request)
    {
        return Ok(await _servicios.ActualizarAsync(User.GetUsuarioId(), id, request));
    }

    /// <summary>Baja lógica de un servicio propio (activo = false).</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _servicios.EliminarAsync(User.GetUsuarioId(), id);
        return NoContent();
    }

    /// <summary>Detalle público de un servicio de proyecto cerrado (con sus campos específicos).</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ServicioProyectoCerradoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(int id)
    {
        return Ok(await _servicios.ObtenerAsync(id));
    }
}
