using Lex.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Servicios.Shared;

// Catalogo publico: lectura unificada de las tres verticales. La escritura vive
// en el controller de cada vertical (/api/servicios/proyecto-cerrado, /clase, /salud).
[ApiController]
[Route("api/servicios")]
public class ServicioController : ControllerBase
{
    private readonly IServicioService _servicios;

    public ServicioController(IServicioService servicios)
    {
        _servicios = servicios;
    }

    /// <summary>Listado publico unificado de servicios, con filtros opcionales y paginacion.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PaginacionResponse<ServicioResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] TipoServicio? tipo,
        [FromQuery(Name = "carrera_id")] int? carreraId,
        [FromQuery(Name = "estudiante_id")] int? estudianteId,
        [FromQuery] bool? activo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        return Ok(await _servicios.ListarAsync(tipo, carreraId, estudianteId, activo, page, pageSize, ct));
    }

    /// <summary>Detalle publico unificado: campos comunes + bloque 'detalle' segun la vertical.</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ServicioDetalleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(int id)
    {
        return Ok(await _servicios.ObtenerAsync(id));
    }
}
