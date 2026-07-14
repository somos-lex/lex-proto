using System.ComponentModel.DataAnnotations;

namespace Lex.Api.Features.Resenas;

public class CrearResenaRequest
{
    [Required, Range(1, 5)]
    public int? Puntaje { get; set; }

    [MaxLength(1000)]
    public string? Comentario { get; set; }
}

public class ResenaResponse
{
    public int Id { get; set; }
    public int TrabajoId { get; set; }

    public int AutorUsuarioId { get; set; }
    public string AutorNombre { get; set; } = null!;

    public int ReceptorUsuarioId { get; set; }

    public int Puntaje { get; set; }
    public string? Comentario { get; set; }
    public DateTime Fecha { get; set; }
}
