using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Trabajos.Shared;

namespace Lex.Api.Features.Trabajos.Salud;

public class ContratarTrabajoSaludRequest
{
    [Required]
    public int ServicioId { get; set; }

    [Required]
    public int PacienteId { get; set; }
}

// El consentimiento como evidencia. La existencia del registro implica aceptacion.
public class ConsentimientoResponse
{
    public int Id { get; set; }
    public string TextoCompleto { get; set; } = null!;
    public int AceptadoPorUsuarioId { get; set; }
    public DateTime FechaAceptacion { get; set; }
    public string? IpAceptacion { get; set; }
}

public class TrabajoSaludDetalle
{
    public int CatalogoServicioIdSnapshot { get; set; }
    public string CatalogoServicioNombreSnapshot { get; set; } = null!;
    public int CatalogoServicioAnioMinimoSnapshot { get; set; }
    public int SupervisorIdSnapshot { get; set; }
    public string SupervisorNombreSnapshot { get; set; } = null!;
    public string SupervisorMatriculaSnapshot { get; set; } = null!;
    public int PacienteId { get; set; }
    public string PacienteNombre { get; set; } = null!;
    public ModalidadSalud ModalidadSaludSnapshot { get; set; }
    public int DuracionMinutosSesionSnapshot { get; set; }
    public int? ConsentimientoId { get; set; }
    public bool ConsentimientoFirmado { get; set; }
    public ConsentimientoResponse? Consentimiento { get; set; }
}

public class TrabajoSaludResponse : TrabajoResponse
{
    public int CatalogoServicioIdSnapshot { get; set; }
    public string CatalogoServicioNombreSnapshot { get; set; } = null!;
    public int CatalogoServicioAnioMinimoSnapshot { get; set; }
    public int SupervisorIdSnapshot { get; set; }
    public string SupervisorNombreSnapshot { get; set; } = null!;
    public string SupervisorMatriculaSnapshot { get; set; } = null!;
    public int PacienteId { get; set; }
    public string PacienteNombre { get; set; } = null!;
    public ModalidadSalud ModalidadSaludSnapshot { get; set; }
    public int DuracionMinutosSesionSnapshot { get; set; }
    public int? ConsentimientoId { get; set; }
    public bool ConsentimientoFirmado { get; set; }
    public ConsentimientoResponse? Consentimiento { get; set; }
}
