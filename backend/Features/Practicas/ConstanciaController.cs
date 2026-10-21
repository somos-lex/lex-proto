using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Practicas;

// Verificacion publica de constancias: la catedra valida el codigo que le muestra el
// estudiante. Devuelve solo estudiante, materia, carrera, institucion, fecha y asistencia;
// ningun dato del paciente.
[ApiController]
[Route("api/constancias")]
[AllowAnonymous]
public class ConstanciaController : ControllerBase
{
    private readonly IPracticaService _practicas;

    public ConstanciaController(IPracticaService practicas)
    {
        _practicas = practicas;
    }

    [HttpGet("{codigo}")]
    [ProducesResponseType(typeof(ConstanciaPublicaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Verificar(string codigo) =>
        Ok(await _practicas.VerificarConstanciaAsync(codigo));
}
