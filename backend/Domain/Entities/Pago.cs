using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Escrow de un trabajo. Guarda snapshots contractuales (monto y % de comisión al
// momento de contratar) y el estado del escrow. El detalle contable de entradas y
// salidas vive en el libro de movimientos (MovimientoPago). Relacion 1-1 con Trabajo
// (indice UNIQUE en trabajo_id: un pago por trabajo).
// La logica de liberacion/reembolso se integra en Sub-hito 1.3 Parte 2.
[Table("pago")]
public class Pago
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("trabajo_id")]
    public int TrabajoId { get; set; }

    // Snapshot del precio del trabajo (evidencia contractual).
    [Column("monto_total", TypeName = "numeric(12,2)")]
    public decimal MontoTotal { get; set; }

    // Snapshot del % de comisión aplicado (ej. 10.00 = 10%).
    [Column("porcentaje_comision_lex", TypeName = "numeric(5,2)")]
    public decimal PorcentajeComisionLex { get; set; }

    // MontoTotal * PorcentajeComisionLex / 100.
    [Column("monto_comision_calculada", TypeName = "numeric(12,2)")]
    public decimal MontoComisionCalculada { get; set; }

    // MontoTotal - MontoComisionCalculada.
    [Column("monto_a_estudiante", TypeName = "numeric(12,2)")]
    public decimal MontoAEstudiante { get; set; }

    [Column("estado")]
    public EstadoPago Estado { get; set; } = EstadoPago.Retenido;

    [Column("fecha_creacion")]
    public DateTime FechaCreacion { get; set; }

    [Column("fecha_liberacion")]
    public DateTime? FechaLiberacion { get; set; }

    // Navegacion
    public Trabajo Trabajo { get; set; } = null!;
    public ICollection<MovimientoPago> Movimientos { get; set; } = new List<MovimientoPago>();
}
