using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Lex.Api.Domain.Entities;

// Profesional matriculado que respalda los servicios de Salud. Es un registro
// administrativo de LEX: no tiene cuenta de usuario ni inicia sesion.
[Table("profesional_supervisor")]
public class ProfesionalSupervisor
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("nombre_completo")]
    public string NombreCompleto { get; set; } = null!;

    [Column("matricula")]
    public string Matricula { get; set; } = null!;

    [Column("especialidad")]
    public string Especialidad { get; set; } = null!;

    [Column("institucion_id")]
    public int? InstitucionId { get; set; }

    [Column("activo")]
    public bool Activo { get; set; } = true;

    [Column("fecha_alta")]
    public DateTime FechaAlta { get; set; } = DateTime.UtcNow;

    [Column("observaciones")]
    public string? Observaciones { get; set; }

    // Navegacion
    public Institucion? Institucion { get; set; }
    public ICollection<ServicioSalud> ServiciosSalud { get; set; } = new List<ServicioSalud>();
}
