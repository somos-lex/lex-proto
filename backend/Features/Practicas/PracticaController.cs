using System.Security.Claims;
using Lex.Api.Domain.Enums;
using Lex.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Practicas;

// Banco de Turnos: practicas clinicas sin dinero. Las rutas por id llevan {id:int} para no
// chocar con las literales (mias, disponibles, por-recordar).
[ApiController]
[Route("api/practicas")]
public class PracticaController : ControllerBase
{
    private readonly IPracticaService _practicas;
    private readonly IInscripcionService _inscripciones;

    public PracticaController(IPracticaService practicas, IInscripcionService inscripciones)
    {
        _practicas = practicas;
        _inscripciones = inscripciones;
    }

    // --- Estudiante -----------------------------------------------------------

    /// <summary>Publica la necesidad de un paciente para una materia de una carrera verificada.</summary>
    [HttpPost]
    [Authorize(Roles = "Estudiante")]
    [ProducesResponseType(typeof(PracticaDetalleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Publicar([FromBody] PublicarPracticaRequest request)
    {
        var practica = await _practicas.PublicarAsync(User.GetUsuarioId(), request);
        return CreatedAtAction(nameof(Obtener), new { id = practica.Practica.Id }, practica);
    }

    /// <summary>Practicas del estudiante autenticado. ?estado= filtra por estado efectivo (incluye Vencida).</summary>
    [HttpGet("mias")]
    [Authorize(Roles = "Estudiante")]
    [ProducesResponseType(typeof(IEnumerable<PracticaDetalleResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Mias([FromQuery] EstadoPracticaClinica? estado) =>
        Ok(await _practicas.ListarMiasAsync(User.GetUsuarioId(), estado));

    /// <summary>Cancela una practica futura propia. Arrastra la inscripcion vigente.</summary>
    [HttpPost("{id:int}/cancelar")]
    [Authorize(Roles = "Estudiante")]
    [ProducesResponseType(typeof(PracticaDetalleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancelar(int id, [FromBody] CancelarPracticaRequest? request) =>
        Ok(await _practicas.CancelarAsync(User.GetUsuarioId(), id, request?.Motivo));

    /// <summary>Registra la comparecencia (desde el horario de inicio) y emite la constancia.</summary>
    [HttpPost("{id:int}/asistencia")]
    [Authorize(Roles = "Estudiante")]
    [ProducesResponseType(typeof(ConstanciaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Asistencia(int id, [FromBody] RegistrarAsistenciaRequest request) =>
        Ok(await _practicas.RegistrarAsistenciaAsync(User.GetUsuarioId(), id, request.Asistio!.Value, request.Observaciones));

    /// <summary>Constancia completa de la practica. Solo para el estudiante y el cliente inscripto.</summary>
    [HttpGet("{id:int}/constancia")]
    [Authorize]
    [ProducesResponseType(typeof(ConstanciaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Constancia(int id) =>
        Ok(await _practicas.ObtenerConstanciaAsync(User.GetUsuarioId(), id));

    // --- Publico / paciente ---------------------------------------------------

    /// <summary>Practicas abiertas a inscripcion. desde/hasta son fechas locales AR (YYYY-MM-DD), inclusive.</summary>
    [HttpGet("disponibles")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<PracticaPublicaResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Disponibles(
        [FromQuery] int? carreraId,
        [FromQuery] TipoPaciente? tipoPaciente,
        [FromQuery] DateOnly? desde,
        [FromQuery] DateOnly? hasta) =>
        Ok(await _practicas.ListarDisponiblesAsync(carreraId, tipoPaciente, desde, hasta));

    /// <summary>Detalle. Las partes ven todo; el resto solo una practica publicada y futura (si no, 404).</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PracticaDetalleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(int id) =>
        Ok(await _practicas.ObtenerAsync(UsuarioIdOpcional(), id));

    /// <summary>Inscribe sin costo a un paciente propio. Exige aceptar los requisitos previos.</summary>
    [HttpPost("{id:int}/inscripcion")]
    [Authorize]
    [ProducesResponseType(typeof(InscripcionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Inscribir(int id, [FromBody] InscribirPracticaRequest request)
    {
        var inscripcion = await _inscripciones.InscribirAsync(User.GetUsuarioId(), id, request);
        return CreatedAtAction(nameof(Obtener), new { id }, inscripcion);
    }

    // --- Admin ------------------------------------------------------------------

    /// <summary>Practicas Cubiertas que empiezan dentro de las proximas N horas. Gancho para un scheduler; no envia nada.</summary>
    [HttpGet("por-recordar")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<PracticaPorRecordarResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PorRecordar([FromQuery] int horas = 24) =>
        Ok(await _practicas.ListarPorRecordarAsync(horas));

    // En un endpoint anonimo el JWT igual se valida si viene: UseAuthentication corre antes.
    private int? UsuarioIdOpcional() =>
        int.TryParse(User.FindFirstValue("usuario_id"), out var id) ? id : null;
}
