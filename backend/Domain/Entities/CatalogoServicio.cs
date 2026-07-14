using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Catalogo CERRADO de servicios que LEX habilita. Solo aplica a las verticales
// ProyectoCerrado y Salud: Clase es de catalogo libre y no tiene entradas aca.
[Table("catalogo_servicio")]
public class CatalogoServicio
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("nombre")]
    public string Nombre { get; set; } = null!;

    [Column("descripcion")]
    public string Descripcion { get; set; } = null!;

    [Column("tipo_servicio")]
    public TipoServicio TipoServicio { get; set; }

    [Column("requiere_supervisor")]
    public bool RequiereSupervisor { get; set; }

    [Column("activo")]
    public bool Activo { get; set; } = true;

    [Column("observaciones")]
    public string? Observaciones { get; set; }

    [Column("fecha_creacion")]
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navegacion: carreras habilitadas (con su año minimo).
    public ICollection<CatalogoServicioCarrera> Carreras { get; set; } = new List<CatalogoServicioCarrera>();
}
