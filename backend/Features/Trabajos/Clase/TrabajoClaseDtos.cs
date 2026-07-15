using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Trabajos.Shared;

namespace Lex.Api.Features.Trabajos.Clase;

public class ContratarTrabajoClaseRequest
{
    [Required]
    public int ServicioId { get; set; }

    // Si el servicio es paquete, debe coincidir con la cantidad del paquete.
    // Si no es paquete: 1 (default) o mayor si el cliente reserva varias sesiones sueltas.
    public int? CantidadSesiones { get; set; }
}

public class TrabajoClaseDetalle
{
    public string MateriaSnapshot { get; set; } = null!;
    public NivelClase NivelSnapshot { get; set; }
    public ModalidadClase ModalidadSnapshot { get; set; }
    public int DuracionMinutosSesionSnapshot { get; set; }
    public bool EsPaqueteSnapshot { get; set; }
    public int CantidadSesionesTotales { get; set; }
    public int SesionesCompletadas { get; set; }
}

public class TrabajoClaseResponse : TrabajoResponse
{
    public string MateriaSnapshot { get; set; } = null!;
    public NivelClase NivelSnapshot { get; set; }
    public ModalidadClase ModalidadSnapshot { get; set; }
    public int DuracionMinutosSesionSnapshot { get; set; }
    public bool EsPaqueteSnapshot { get; set; }
    public int CantidadSesionesTotales { get; set; }
    public int SesionesCompletadas { get; set; }
}
