using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

[Table("solicitud")]
public class Solicitud
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("cliente_id")]
    public int ClienteId { get; set; }

    // Vertical que busca el cliente. Es input directo del usuario (no derivado),
    // por eso se persiste. Se guarda como string (ver AppDbContext).
    [Column("tipo_servicio")]
    public TipoServicio? TipoServicio { get; set; }

    [Column("titulo")]
    public string Titulo { get; set; } = null!;

    [Column("descripcion")]
    public string? Descripcion { get; set; }

    [Column("presupuesto_estimado")]
    public decimal? PresupuestoEstimado { get; set; }

    [Column("estado")]
    public EstadoSolicitud Estado { get; set; } = EstadoSolicitud.Abierta;

    [Column("fecha_creacion")]
    public DateTime FechaCreacion { get; set; }

    [Column("fecha_cierre")]
    public DateTime? FechaCierre { get; set; }

    // Navegacion
    public PerfilCliente Cliente { get; set; } = null!;
    public ICollection<Postulacion> Postulaciones { get; set; } = new List<Postulacion>();
}
