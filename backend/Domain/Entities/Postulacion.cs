using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

[Table("postulacion")]
public class Postulacion
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("solicitud_id")]
    public int SolicitudId { get; set; }

    [Column("estudiante_id")]
    public int EstudianteId { get; set; }

    [Column("mensaje")]
    public string? Mensaje { get; set; }

    [Column("monto_propuesto")]
    public decimal? MontoPropuesto { get; set; }

    [Column("estado")]
    public EstadoPostulacion Estado { get; set; } = EstadoPostulacion.Enviada;

    [Column("fecha_postulacion")]
    public DateTime FechaPostulacion { get; set; }

    // Navegacion
    public Solicitud Solicitud { get; set; } = null!;
    public PerfilEstudiante Estudiante { get; set; } = null!;
    public ICollection<Trabajo> Trabajos { get; set; } = new List<Trabajo>();
}
