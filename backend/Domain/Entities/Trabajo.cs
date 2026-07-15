using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Raiz de la jerarquia TPT del motor transaccional. Cada trabajo nace de un
// Servicio (una de las 3 verticales) y su tipo queda determinado por la subclase
// concreta: TrabajoProyectoCerrado / TrabajoClase / TrabajoSalud. El mapeo TPT y
// las tablas hijas se configuran en AppDbContext.
//
// Los campos *Snapshot congelan los valores del servicio al momento de contratar:
// aunque el estudiante luego edite o de de baja el servicio, el trabajo conserva
// las condiciones acordadas.
[Table("trabajo")]
public abstract class Trabajo
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("servicio_id")]
    public int ServicioId { get; set; }

    [Column("cliente_id")]
    public int ClienteId { get; set; }

    [Column("estudiante_id")]
    public int EstudianteId { get; set; }

    [Column("titulo_snapshot")]
    public string TituloSnapshot { get; set; } = null!;

    [Column("descripcion_snapshot")]
    public string DescripcionSnapshot { get; set; } = null!;

    [Column("precio_acordado")]
    public decimal PrecioAcordado { get; set; }

    [Column("estado")]
    public EstadoTrabajo Estado { get; set; } = EstadoTrabajo.Pendiente;

    [Column("fecha_creacion")]
    public DateTime FechaCreacion { get; set; }

    [Column("fecha_inicio")]
    public DateTime? FechaInicio { get; set; }

    [Column("fecha_fin")]
    public DateTime? FechaFin { get; set; }

    // Navegacion
    public Servicio Servicio { get; set; } = null!;
    public PerfilCliente Cliente { get; set; } = null!;
    public PerfilEstudiante Estudiante { get; set; } = null!;
    public ICollection<TrabajoHistorial> Historiales { get; set; } = new List<TrabajoHistorial>();
    public Pago? Pago { get; set; }                 // 1->1: a lo sumo un pago (Sub-hito 1.3)
    public ICollection<Resena> Resenas { get; set; } = new List<Resena>();
}
