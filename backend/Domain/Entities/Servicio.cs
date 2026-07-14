using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Lex.Api.Domain.Entities;

// Raiz de la jerarquia TPT de servicios. La vertical (ProyectoCerrado / Clase /
// Salud) queda determinada por la subclase concreta: ya no hay FK a tipo_servicio.
// El mapeo TPT y las tablas hijas se configuran en AppDbContext.
[Table("servicio")]
public abstract class Servicio
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("estudiante_id")]
    public int EstudianteId { get; set; }

    [Column("titulo")]
    public string Titulo { get; set; } = null!;

    [Column("descripcion")]
    public string Descripcion { get; set; } = null!;

    // URL externa de la imagen de portada (sin subida de archivos por ahora).
    [Column("imagen_url")]
    public string? ImagenUrl { get; set; }

    [Column("precio")]
    public decimal Precio { get; set; }

    [Column("activo")]
    public bool Activo { get; set; } = true;

    [Column("fecha_publicacion")]
    public DateTime FechaPublicacion { get; set; }

    // Navegacion
    public PerfilEstudiante Estudiante { get; set; } = null!;
    public ICollection<Trabajo> Trabajos { get; set; } = new List<Trabajo>();
}
