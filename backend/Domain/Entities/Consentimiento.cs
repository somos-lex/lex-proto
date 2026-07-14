using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Lex.Api.Domain.Entities;

// Consentimiento informado del turno clinico (area Salud). Cuelga del trabajo.
[Table("consentimiento")]
public class Consentimiento
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("trabajo_id")]
    public int TrabajoId { get; set; }

    [Column("paciente_id")]
    public int? PacienteId { get; set; }

    [Column("texto_consentimiento")]
    public string? TextoConsentimiento { get; set; }

    [Column("aceptado")]
    public bool Aceptado { get; set; }

    [Column("fecha_aceptacion")]
    public DateTime? FechaAceptacion { get; set; }

    [Column("supervisor_responsable")]
    public string? SupervisorResponsable { get; set; } // profesional matriculado a cargo

    // Navegacion
    public Trabajo Trabajo { get; set; } = null!;
    public Paciente? Paciente { get; set; }
}
