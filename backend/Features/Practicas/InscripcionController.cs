using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Practicas;

[ApiController]
[Route("api/inscripciones")]
[Authorize]
public class InscripcionController : ControllerBase
{
    private readonly IInscripcionService _inscripciones;

    public InscripcionController(IInscripcionService inscripciones)
    {
        _inscripciones = inscripciones;
    }

    /// <summary>Inscripciones del cliente autenticado (todas, incluidas las canceladas), las practicas mas recientes primero.</summary>
    [HttpGet("mias")]
    [ProducesResponseType(typeof(IEnumerable<InscripcionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Mias() =>
        Ok(await _inscripciones.ListarMiasAsync(User.GetUsuarioId()));

    /// <summary>Cancela una inscripcion a una practica futura. Puede hacerlo el cliente o el estudiante; la practica vuelve a Publicada.</summary>
    [HttpPost("{id:int}/cancelar")]
    [ProducesResponseType(typeof(InscripcionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancelar(int id, [FromBody] CancelarInscripcionRequest? request) =>
        Ok(await _inscripciones.CancelarAsync(User.GetUsuarioId(), id, request?.Motivo));
}
