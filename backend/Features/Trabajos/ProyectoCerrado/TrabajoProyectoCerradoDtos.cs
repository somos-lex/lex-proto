using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Trabajos.Shared;

namespace Lex.Api.Features.Trabajos.ProyectoCerrado;

public class ContratarTrabajoProyectoCerradoRequest
{
    [Required]
    public int ServicioId { get; set; }
}

// Campos propios de la vertical. Se usa suelto como bloque 'detalle' del endpoint
// unificado GET /api/trabajos/{id}.
public class TrabajoProyectoCerradoDetalle
{
    public DateTime PlazoEntregaFecha { get; set; }
    public int RevisionesMaximas { get; set; }
    public int RevisionesUsadas { get; set; }
    public FormatoEntrega FormatoEntregaSnapshot { get; set; }
}

// Respuesta completa de la vertical: campos comunes + campos propios.
public class TrabajoProyectoCerradoResponse : TrabajoResponse
{
    public DateTime PlazoEntregaFecha { get; set; }
    public int RevisionesMaximas { get; set; }
    public int RevisionesUsadas { get; set; }
    public FormatoEntrega FormatoEntregaSnapshot { get; set; }
}
