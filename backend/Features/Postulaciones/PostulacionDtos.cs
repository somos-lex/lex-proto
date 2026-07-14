using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Postulaciones;

public class CrearPostulacionRequest
{
    [MaxLength(1000)]
    public string? Mensaje { get; set; }

    [Required]
    public decimal MontoPropuesto { get; set; }
}

// Vista del estudiante (sus postulaciones) y respuesta al postularse.
public class PostulacionResponse
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public string SolicitudTitulo { get; set; } = null!;
    public int EstudianteId { get; set; }
    public string? Mensaje { get; set; }
    public decimal? MontoPropuesto { get; set; }
    public EstadoPostulacion Estado { get; set; }
    public DateTime FechaPostulacion { get; set; }
}

// Vista del cliente dueño: incluye datos del estudiante postulante.
public class PostulacionRecibidaResponse
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public int EstudianteId { get; set; }
    public string EstudianteNombre { get; set; } = null!;
    public decimal EstudianteCalificacion { get; set; }
    public string? Mensaje { get; set; }
    public decimal? MontoPropuesto { get; set; }
    public EstadoPostulacion Estado { get; set; }
    public DateTime FechaPostulacion { get; set; }
}
