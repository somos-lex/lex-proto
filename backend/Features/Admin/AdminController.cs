using Lex.Api.Features.Pagos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IPagoService _pagos;

    public AdminController(IPagoService pagos)
    {
        _pagos = pagos;
    }

    /// <summary>Panel del modelo de ingresos de LEX: comisión liberada (efectiva) vs retenida (potencial), con breakdown por vertical.</summary>
    [HttpGet("ingresos")]
    [ProducesResponseType(typeof(IngresosAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Ingresos()
    {
        return Ok(await _pagos.ObtenerIngresosLexAsync());
    }
}
