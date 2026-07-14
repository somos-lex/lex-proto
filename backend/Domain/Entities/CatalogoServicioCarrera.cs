using System.ComponentModel.DataAnnotations.Schema;

namespace Lex.Api.Domain.Entities;

// Habilitacion de una entrada del catalogo para una carrera, con el año minimo
// desde el cual el estudiante puede ofrecerla.
// Clave primaria compuesta (catalogo_servicio_id, carrera_id) — configurada en AppDbContext.
[Table("catalogo_servicio_carrera")]
public class CatalogoServicioCarrera
{
    [Column("catalogo_servicio_id")]
    public int CatalogoServicioId { get; set; }

    [Column("carrera_id")]
    public int CarreraId { get; set; }

    [Column("anio_minimo")]
    public int AnioMinimo { get; set; }

    // Navegacion
    public CatalogoServicio CatalogoServicio { get; set; } = null!;
    public Carrera Carrera { get; set; } = null!;
}
