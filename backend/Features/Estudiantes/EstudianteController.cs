using Lex.Api.Features.Perfil;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lex.Api.Features.Estudiantes;

[ApiController]
[Route("api/estudiantes")]
public class EstudianteController : ControllerBase
{
    private readonly IPerfilService _perfil;

    public EstudianteController(IPerfilService perfil)
    {
        _perfil = perfil;
    }

    /// <summary>
    /// Portafolio público de un estudiante (su "carta de presentación"): perfil,
    /// verificación institucional, servicios activos y reseñas, en una sola llamada.
    /// </summary>
    [HttpGet("{id:int}/portafolio")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PortafolioResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Portafolio(int id)
    {
        return Ok(await _perfil.ObtenerPortafolioAsync(id));
    }
}
