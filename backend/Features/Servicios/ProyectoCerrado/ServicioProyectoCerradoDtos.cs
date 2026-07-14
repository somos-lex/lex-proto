using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Servicios.Shared;

namespace Lex.Api.Features.Servicios.ProyectoCerrado;

public class CrearServicioProyectoCerradoRequest
{
    [Required, MaxLength(150)]
    public string Titulo { get; set; } = null!;

    [Required, MaxLength(1000)]
    public string Descripcion { get; set; } = null!;

    [Required]
    public decimal Precio { get; set; }

    // Debe ser una entrada activa del catalogo cerrado, de tipo ProyectoCerrado,
    // habilitada para la carrera del estudiante y con año minimo alcanzado.
    [Required]
    public int CatalogoServicioId { get; set; }

    [Required]
    public int PlazoEntregaDias { get; set; }

    public int RevisionesIncluidas { get; set; } = 2;

    public FormatoEntrega FormatoEntrega { get; set; }

    [MaxLength(500)]
    public string? ImagenUrl { get; set; }
}

// Mismos campos editables que en la creacion.
public class ActualizarServicioProyectoCerradoRequest
{
    [Required, MaxLength(150)]
    public string Titulo { get; set; } = null!;

    [Required, MaxLength(1000)]
    public string Descripcion { get; set; } = null!;

    [Required]
    public decimal Precio { get; set; }

    [Required]
    public int CatalogoServicioId { get; set; }

    [Required]
    public int PlazoEntregaDias { get; set; }

    public int RevisionesIncluidas { get; set; } = 2;

    public FormatoEntrega FormatoEntrega { get; set; }

    [MaxLength(500)]
    public string? ImagenUrl { get; set; }
}

// Campos propios de la vertical. Se usa suelto como bloque 'detalle' del
// endpoint unificado GET /api/servicios/{id}.
public class ServicioProyectoCerradoDetalle
{
    public int CatalogoServicioId { get; set; }
    public string CatalogoServicioNombre { get; set; } = null!;
    public int PlazoEntregaDias { get; set; }
    public int RevisionesIncluidas { get; set; }
    public FormatoEntrega FormatoEntrega { get; set; }
}

// Respuesta completa de la vertical: campos comunes + campos propios.
public class ServicioProyectoCerradoResponse : ServicioResponse
{
    public int CatalogoServicioId { get; set; }
    public string CatalogoServicioNombre { get; set; } = null!;
    public int PlazoEntregaDias { get; set; }
    public int RevisionesIncluidas { get; set; }
    public FormatoEntrega FormatoEntrega { get; set; }
}
