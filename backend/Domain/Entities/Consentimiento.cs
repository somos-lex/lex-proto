using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Lex.Api.Domain.Entities;

// Consentimiento informado de un trabajo de Salud. La sola existencia del registro
// implica aceptacion (ya no hay bool 'aceptado'): se crea cuando el cliente firma.
// Relacion 1-1 con TrabajoSalud (UNIQUE en trabajo_salud_id).
[Table("consentimiento")]
public class Consentimiento
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    // Un consentimiento por trabajo de salud (indice unico en AppDbContext).
    [Column("trabajo_salud_id")]
    public int TrabajoSaludId { get; set; }

    // Texto que se le mostro al cliente para aceptar (generado por ConsentimientoTemplate).
    [Column("texto_completo", TypeName = "text")]
    public string TextoCompleto { get; set; } = null!;

    // Usuario que hizo el click de aceptacion.
    [Column("aceptado_por_usuario_id")]
    public int AceptadoPorUsuarioId { get; set; }

    [Column("fecha_aceptacion")]
    public DateTime FechaAceptacion { get; set; }

    // Evidencia tecnica: IP desde la que se acepto.
    [Column("ip_aceptacion")]
    public string? IpAceptacion { get; set; }

    // Navegacion
    public Usuario AceptadoPor { get; set; } = null!;
}
