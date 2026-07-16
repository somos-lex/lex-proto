using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Libro de movimientos (contable) de un pago: cada entrada/salida del escrow queda
// registrada como un asiento inmutable. El monto es siempre positivo; el signo lo
// deriva el Tipo (retención = entrada, liberación/comisión/reembolso = salida).
[Table("movimiento_pago")]
public class MovimientoPago
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("pago_id")]
    public int PagoId { get; set; }

    [Column("tipo")]
    public TipoMovimientoPago Tipo { get; set; }

    [Column("monto", TypeName = "numeric(12,2)")]
    public decimal Monto { get; set; } // Siempre positivo, signo derivado del Tipo

    [Column("descripcion")]
    public string Descripcion { get; set; } = null!;

    [Column("fecha_movimiento")]
    public DateTime FechaMovimiento { get; set; }

    [Column("referencia_externa")]
    public string? ReferenciaExterna { get; set; } // Reservado para MP payment_id futuro

    [Column("trabajo_historial_id")]
    public int? TrabajoHistorialId { get; set; } // Traza opcional

    // Navegación
    public Pago Pago { get; set; } = null!;
}
