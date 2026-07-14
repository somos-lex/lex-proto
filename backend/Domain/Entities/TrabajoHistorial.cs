using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Trazabilidad de cambios de estado de cada trabajo.
[Table("trabajo_historial")]
public class TrabajoHistorial
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("trabajo_id")]
    public int TrabajoId { get; set; }

    [Column("estado_anterior")]
    public EstadoTrabajo? EstadoAnterior { get; set; }

    [Column("estado_nuevo")]
    public EstadoTrabajo EstadoNuevo { get; set; }

    [Column("fecha")]
    public DateTime Fecha { get; set; }

    [Column("usuario_id")]
    public int? UsuarioId { get; set; } // quien provoco el cambio

    // Navegacion
    public Trabajo Trabajo { get; set; } = null!;
    public Usuario? Usuario { get; set; }
}
