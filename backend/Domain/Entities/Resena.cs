using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Lex.Api.Domain.Entities;

// Resenas bidireccionales. Una resena por autor por trabajo (unique configurado en AppDbContext).
[Table("resena")]
public class Resena
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("trabajo_id")]
    public int TrabajoId { get; set; }

    [Column("autor_usuario_id")]
    public int AutorUsuarioId { get; set; }

    [Column("receptor_usuario_id")]
    public int ReceptorUsuarioId { get; set; }

    [Column("puntaje")]
    public int Puntaje { get; set; } // 1 a 5

    [Column("comentario")]
    public string? Comentario { get; set; }

    [Column("fecha")]
    public DateTime Fecha { get; set; }

    // Navegacion
    public Trabajo Trabajo { get; set; } = null!;
    public Usuario Autor { get; set; } = null!;
    public Usuario Receptor { get; set; } = null!;
}
