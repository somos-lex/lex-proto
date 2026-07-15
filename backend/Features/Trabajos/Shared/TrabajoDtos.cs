using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Trabajos.Shared;

// Campos comunes a las tres verticales: es lo que devuelve el listado unificado
// (GET /api/trabajos) y la base de cada Response por vertical.
public class TrabajoResponse
{
    public int Id { get; set; }

    public int ServicioId { get; set; }

    public int ClienteId { get; set; }
    public string ClienteNombre { get; set; } = null!;

    public int EstudianteId { get; set; }
    public string EstudianteNombre { get; set; } = null!;

    // Snapshots congelados al contratar.
    public string TituloSnapshot { get; set; } = null!;
    public string DescripcionSnapshot { get; set; } = null!;
    public decimal PrecioAcordado { get; set; }

    public EstadoTrabajo Estado { get; set; }

    // Vertical concreta del trabajo (se deriva de la subclase TPT).
    public TipoServicio Tipo { get; set; }

    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
}

// Detalle unificado (GET /api/trabajos/{id}): los campos comunes mas un bloque
// 'detalle' polimorfico con los campos propios de la vertical.
public class TrabajoDetalleResponse : TrabajoResponse
{
    public object? Detalle { get; set; }
}

public class TrabajoHistorialResponse
{
    public int Id { get; set; }
    public EstadoTrabajo? EstadoAnterior { get; set; }
    public EstadoTrabajo EstadoNuevo { get; set; }
    public DateTime Fecha { get; set; }
    public int? UsuarioId { get; set; }
}

// Body de POST /api/trabajos/{id}/cancelar (motivo opcional).
public class CancelarTrabajoRequest
{
    [MaxLength(500)]
    public string? Motivo { get; set; }
}

// Body de POST /api/trabajos/{id}/disputar (motivo obligatorio).
public class DisputarTrabajoRequest
{
    [Required, MaxLength(500)]
    public string Motivo { get; set; } = null!;
}
