using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Servicios.Shared;

// Campos comunes a las tres verticales: es lo que devuelve el listado unificado
// del catalogo publico (GET /api/servicios).
public class ServicioResponse
{
    public int Id { get; set; }
    public string Titulo { get; set; } = null!;
    public string Descripcion { get; set; } = null!;
    public string? ImagenUrl { get; set; }
    public decimal Precio { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaPublicacion { get; set; }

    // Vertical concreta del servicio (se deriva de la subclase TPT).
    public TipoServicio Tipo { get; set; }

    public int EstudianteId { get; set; }
    public string EstudianteNombre { get; set; } = null!;
    public decimal EstudianteCalificacion { get; set; }
}

// Detalle unificado (GET /api/servicios/{id}): los campos comunes mas un bloque
// 'detalle' polimorfico con los campos propios de la vertical.
public class ServicioDetalleResponse : ServicioResponse
{
    public object? Detalle { get; set; }
}
