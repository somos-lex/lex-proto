using System.ComponentModel.DataAnnotations;

namespace Lex.Api.Features.Admin;

// A quien favorece la resolucion de una disputa: Cliente reembolsa el remanente retenido,
// Estudiante libera el remanente. Se persiste como string en el JSON (igual que el resto
// de los enums de la API), nunca en DB.
public enum FavorDisputa
{
    Cliente,
    Estudiante
}

// Body de POST /api/admin/trabajos/{id}/resolver-disputa.
public class ResolverDisputaRequest
{
    [Required]
    public FavorDisputa FavorA { get; set; }

    [Required, MaxLength(500)]
    public string Motivo { get; set; } = null!;
}
