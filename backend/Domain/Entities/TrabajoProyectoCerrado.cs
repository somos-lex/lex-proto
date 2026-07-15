using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Vertical ProyectoCerrado del motor transaccional. Congela plazo, revisiones y
// formato de entrega al momento de contratar. Lleva el contador de revisiones usadas.
[Table("trabajo_proyecto_cerrado")]
public class TrabajoProyectoCerrado : Trabajo
{
    // Calculado al contratar: fecha_creacion + plazo_entrega_dias del servicio.
    [Column("plazo_entrega_fecha")]
    public DateTime PlazoEntregaFecha { get; set; }

    [Column("revisiones_maximas")]
    public int RevisionesMaximas { get; set; }

    [Column("revisiones_usadas")]
    public int RevisionesUsadas { get; set; }

    [Column("formato_entrega_snapshot")]
    public FormatoEntrega FormatoEntregaSnapshot { get; set; }
}
