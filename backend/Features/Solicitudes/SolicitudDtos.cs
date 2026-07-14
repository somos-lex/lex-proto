using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Solicitudes;

public class CrearSolicitudRequest
{
    [Required, MaxLength(150)]
    public string Titulo { get; set; } = null!;

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    public decimal? PresupuestoEstimado { get; set; }

    // Vertical que busca el cliente. Ya no es un id contra tipo_servicio: es el enum.
    public TipoServicio? TipoServicio { get; set; }
}

public class SolicitudResponse
{
    public int Id { get; set; }

    public int ClienteId { get; set; }
    public string ClienteNombre { get; set; } = null!;

    public TipoServicio? TipoServicio { get; set; }

    public string Titulo { get; set; } = null!;
    public string? Descripcion { get; set; }
    public decimal? PresupuestoEstimado { get; set; }

    public EstadoSolicitud Estado { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaCierre { get; set; }
}

// Vista del dueño: agrega cuántas postulaciones recibió.
public class SolicitudMiaResponse : SolicitudResponse
{
    public int CantidadPostulaciones { get; set; }
}
