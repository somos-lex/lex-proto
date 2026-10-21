using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Admin;

// Bandeja de verificacion institucional. Separado de AdminController a proposito: aquel
// depende del escrow (IPagoService) y la verificacion no tiene por que compartirlo.
//
// El vinculo se direcciona por su clave compuesta (estudiante, carrera): estudiante_carrera
// no tiene Id propio y no se le agrega uno solo para acomodar una ruta.
[ApiController]
[Route("api/admin/verificaciones")]
[Authorize(Roles = "Admin")]
public class VerificacionController : ControllerBase
{
    private readonly IVerificacionService _verificaciones;

    public VerificacionController(IVerificacionService verificaciones)
    {
        _verificaciones = verificaciones;
    }

    /// <summary>Vinculos estudiante-carrera pendientes de verificacion, los mas viejos primero.</summary>
    [HttpGet("pendientes")]
    [ProducesResponseType(typeof(IEnumerable<VerificacionPendienteResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Pendientes() =>
        Ok(await _verificaciones.ListarPendientesAsync());

    /// <summary>
    /// Verifica el vinculo. Acepta Pendiente o Rechazado (re-aprobacion tras reenviar el comprobante).
    /// Si el estudiante no cargo comprobante, las observaciones son obligatorias: 400 si faltan las dos.
    /// </summary>
    [HttpPost("{estudianteId:int}/{carreraId:int}/aprobar")]
    [ProducesResponseType(typeof(VerificacionResueltaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Aprobar(int estudianteId, int carreraId, [FromBody] AprobarVerificacionRequest? request) =>
        Ok(await _verificaciones.AprobarAsync(User.GetUsuarioId(), estudianteId, carreraId, request?.Observaciones));

    /// <summary>Rechaza un vinculo pendiente. El motivo es obligatorio.</summary>
    [HttpPost("{estudianteId:int}/{carreraId:int}/rechazar")]
    [ProducesResponseType(typeof(VerificacionResueltaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Rechazar(int estudianteId, int carreraId, [FromBody] RechazarVerificacionRequest request) =>
        Ok(await _verificaciones.RechazarAsync(User.GetUsuarioId(), estudianteId, carreraId, request.Motivo));
}
