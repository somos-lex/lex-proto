using Lex.Api.Domain.Enums;
using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Pagos;

// Consulta del escrow para las dos partes del trabajo: el cliente que puso la plata y el
// estudiante que la va a cobrar. Sin rol fijo, porque un mismo usuario puede ser las dos.
[ApiController]
[Route("api/pagos")]
[Authorize]
public class PagoController : ControllerBase
{
    private readonly IPagoService _pagos;

    public PagoController(IPagoService pagos)
    {
        _pagos = pagos;
    }

    /// <summary>Pagos en los que participa el usuario autenticado, del más nuevo al más viejo.</summary>
    [HttpGet("mios")]
    [ProducesResponseType(typeof(IReadOnlyList<PagoResumenResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Mios(
        [FromQuery] EstadoPago? estado,
        [FromQuery(Name = "tipo_trabajo")] TipoServicio? tipoTrabajo)
    {
        return Ok(await _pagos.ListarMiosAsync(User.GetUsuarioId(), estado, tipoTrabajo));
    }

    /// <summary>Detalle de un pago con su libro de movimientos. 404 si no existe o no participás.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PagoDetalleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Detalle(int id)
    {
        return Ok(await _pagos.ObtenerDetalleAsync(User.GetUsuarioId(), id));
    }

    /// <summary>Libro de movimientos de un pago, en orden cronológico.</summary>
    [HttpGet("{id:int}/movimientos")]
    [ProducesResponseType(typeof(IReadOnlyList<MovimientoPagoResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Movimientos(int id)
    {
        return Ok(await _pagos.ListarMovimientosAsync(User.GetUsuarioId(), id));
    }
}
