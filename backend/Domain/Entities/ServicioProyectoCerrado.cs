using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Vertical de catalogo cerrado: el estudiante solo puede publicar un servicio
// que exista en CatalogoServicio y este habilitado para su carrera y año.
[Table("servicio_proyecto_cerrado")]
public class ServicioProyectoCerrado : Servicio
{
    [Column("catalogo_servicio_id")]
    public int CatalogoServicioId { get; set; }

    [Column("plazo_entrega_dias")]
    public int PlazoEntregaDias { get; set; }

    [Column("revisiones_incluidas")]
    public int RevisionesIncluidas { get; set; } = 2;

    [Column("formato_entrega")]
    public FormatoEntrega FormatoEntrega { get; set; }

    // Navegacion
    public CatalogoServicio CatalogoServicio { get; set; } = null!;
}
