using Lex.Api.Extensions;
using Lex.Api.Features.Pagos;
using Lex.Api.Features.Trabajos.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IPagoService _pagos;
    private readonly ITrabajoService _trabajos;

    public AdminController(IPagoService pagos, ITrabajoService trabajos)
    {
        _pagos = pagos;
        _trabajos = trabajos;
    }

    /// <summary>Panel del modelo de ingresos de LEX: comisión liberada (efectiva) vs retenida (potencial), con breakdown por vertical.</summary>
    [HttpGet("ingresos")]
    [ProducesResponseType(typeof(IngresosAdminResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Ingresos()
    {
        return Ok(await _pagos.ObtenerIngresosLexAsync());
    }

    /// <summary>Resuelve una disputa abierta: a favor del cliente reembolsa el remanente retenido, a favor del estudiante libera el remanente.</summary>
    [HttpPost("trabajos/{id:int}/resolver-disputa")]
    [ProducesResponseType(typeof(TrabajoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResolverDisputa(int id, [FromBody] ResolverDisputaRequest request)
    {
        var favorCliente = request.FavorA == FavorDisputa.Cliente;
        return Ok(await _trabajos.ResolverDisputaAsync(User.GetUsuarioId(), id, favorCliente, request.Motivo));
    }
}
