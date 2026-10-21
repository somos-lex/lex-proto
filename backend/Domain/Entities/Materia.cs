using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Lex.Api.Domain.Entities;

// Materia de una carrera con practica clinica obligatoria. Es el eje academico del Banco
// de Turnos: un estudiante publica una practica PARA una materia, y solo puede hacerlo si
// tiene verificada la carrera a la que pertenece y cursa al menos su año minimo.
// UNIQUE (carrera_id, nombre) — configurado en AppDbContext.
[Table("materia")]
public class Materia
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("nombre")]
    public string Nombre { get; set; } = null!;

    [Column("carrera_id")]
    public int CarreraId { get; set; }

    // Año del plan de estudios en que se cursa. Mismo criterio que
    // CatalogoServicioCarrera.AnioMinimo: el estudiante tiene que cursar este año o uno superior.
    [Column("anio_minimo")]
    public int AnioMinimo { get; set; }

    // Baja logica: las practicas ya publicadas la siguen referenciando.
    [Column("activa")]
    public bool Activa { get; set; } = true;

    // Navegacion
    public Carrera Carrera { get; set; } = null!;
    public ICollection<PracticaClinica> Practicas { get; set; } = new List<PracticaClinica>();
}
