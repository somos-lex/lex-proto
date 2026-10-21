using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Materias;

[ApiController]
[Route("api/materias")]
public class MateriaController : ControllerBase
{
    private readonly IMateriaService _materias;

    public MateriaController(IMateriaService materias)
    {
        _materias = materias;
    }

    /// <summary>Materias activas, opcionalmente de una carrera. Publico. Un Admin puede pedir tambien las inactivas.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<MateriaResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] int? carreraId,
        [FromQuery] bool incluirInactivas = false) =>
        Ok(await _materias.ListarAsync(carreraId, incluirInactivas && User.IsInRole("Admin")));

    /// <summary>Materias para las que el estudiante autenticado puede publicar una practica hoy.</summary>
    [HttpGet("habilitadas")]
    [Authorize(Roles = "Estudiante")]
    [ProducesResponseType(typeof(IEnumerable<MateriaResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Habilitadas() =>
        Ok(await _materias.ListarHabilitadasAsync(User.GetUsuarioId()));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(MateriaResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear([FromBody] CrearMateriaRequest request)
    {
        var materia = await _materias.CrearAsync(request);
        return CreatedAtAction(nameof(Listar), new { carreraId = materia.CarreraId }, materia);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(MateriaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarMateriaRequest request) =>
        Ok(await _materias.ActualizarAsync(id, request));

    /// <summary>Baja logica. Las practicas ya publicadas no se tocan; solo impide publicar nuevas.</summary>
    [HttpPost("{id:int}/desactivar")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(MateriaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Desactivar(int id) =>
        Ok(await _materias.CambiarActivaAsync(id, activa: false));

    [HttpPost("{id:int}/activar")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(MateriaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activar(int id) =>
        Ok(await _materias.CambiarActivaAsync(id, activa: true));
}
