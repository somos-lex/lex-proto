using Lex.Api.Domain.Enums;
using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Trabajos.Shared;

// Endpoints compartidos por las 3 verticales: transiciones de estado (maquina de
// estados) y consultas unificadas. La contratacion vive en el controller de cada
// vertical (/api/trabajos/proyecto-cerrado, /clase, /salud).
[ApiController]
[Route("api/trabajos")]
[Authorize]
public class TrabajoController : ControllerBase
{
    private readonly ITrabajoService _trabajos;

    public TrabajoController(ITrabajoService trabajos)
    {
        _trabajos = trabajos;
    }

    // --- Transiciones de estado ---------------------------------------------

    /// <summary>El estudiante acepta el trabajo (Pendiente → Aceptado).</summary>
    [HttpPost("{id:int}/aceptar")]
    [ProducesResponseType(typeof(TrabajoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Aceptar(int id) =>
        Ok(await _trabajos.AceptarAsync(User.GetUsuarioId(), id));

    /// <summary>El estudiante inicia el trabajo (Aceptado → EnCurso). Salud exige consentimiento firmado.</summary>
    [HttpPost("{id:int}/iniciar")]
    [ProducesResponseType(typeof(TrabajoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Iniciar(int id) =>
        Ok(await _trabajos.IniciarAsync(User.GetUsuarioId(), id));

    /// <summary>El estudiante marca el trabajo como entregado (EnCurso → Entregado).</summary>
    [HttpPost("{id:int}/entregar")]
    [ProducesResponseType(typeof(TrabajoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Entregar(int id) =>
        Ok(await _trabajos.EntregarAsync(User.GetUsuarioId(), id));

    /// <summary>El cliente confirma y completa el trabajo (Entregado → Completado).</summary>
    [HttpPost("{id:int}/completar")]
    [ProducesResponseType(typeof(TrabajoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Completar(int id) =>
        Ok(await _trabajos.CompletarAsync(User.GetUsuarioId(), id));

    /// <summary>Cliente o estudiante cancela el trabajo (cualquier estado no final → Cancelado).</summary>
    [HttpPost("{id:int}/cancelar")]
    [ProducesResponseType(typeof(TrabajoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Cancelar(int id, [FromBody] CancelarTrabajoRequest? request) =>
        Ok(await _trabajos.CancelarAsync(User.GetUsuarioId(), id, request?.Motivo));

    /// <summary>Cliente o estudiante abre una disputa (requiere motivo).</summary>
    [HttpPost("{id:int}/disputar")]
    [ProducesResponseType(typeof(TrabajoResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Disputar(int id, [FromBody] DisputarTrabajoRequest request) =>
        Ok(await _trabajos.DisputarAsync(User.GetUsuarioId(), id, request.Motivo));

    // --- Consultas unificadas -----------------------------------------------

    /// <summary>Listado unificado de trabajos con filtros. Devuelve el DTO base (sin detalle por vertical).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TrabajoResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] TipoServicio? tipo,
        [FromQuery] EstadoTrabajo? estado,
        [FromQuery(Name = "cliente_id")] int? clienteId,
        [FromQuery(Name = "estudiante_id")] int? estudianteId)
    {
        return Ok(await _trabajos.ListarAsync(tipo, estado, clienteId, estudianteId));
    }

    /// <summary>Trabajos donde participa el usuario autenticado (como estudiante o cliente).</summary>
    [HttpGet("mios")]
    [ProducesResponseType(typeof(IEnumerable<TrabajoResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Mios() =>
        Ok(await _trabajos.ListarMiosAsync(User.GetUsuarioId()));

    /// <summary>Detalle unificado: campos base + bloque 'detalle' polimorfico segun la vertical.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TrabajoDetalleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(int id) =>
        Ok(await _trabajos.ObtenerDetalleAsync(User.GetUsuarioId(), id));

    /// <summary>Historial de cambios de estado del trabajo (solo para sus partes).</summary>
    [HttpGet("{id:int}/historial")]
    [ProducesResponseType(typeof(IEnumerable<TrabajoHistorialResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Historial(int id) =>
        Ok(await _trabajos.ListarHistorialAsync(User.GetUsuarioId(), id));
}
