using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Servicios.Shared;

namespace Lex.Api.Features.Servicios.Clase;

// Vertical de catalogo LIBRE: no hay CatalogoServicioId, el estudiante escribe
// materia y nivel sin restriccion de carrera.
public class CrearServicioClaseRequest
{
    [Required, MaxLength(150)]
    public string Titulo { get; set; } = null!;

    [Required, MaxLength(1000)]
    public string Descripcion { get; set; } = null!;

    [Required]
    public decimal Precio { get; set; }

    [Required, MaxLength(100)]
    public string Materia { get; set; } = null!;

    public NivelClase Nivel { get; set; }

    public ModalidadClase Modalidad { get; set; }

    public int DuracionMinutosSesion { get; set; } = 60;

    public bool EsPaquete { get; set; }

    // Requerido (> 0) solo si EsPaquete = true.
    public int? CantidadSesionesPaquete { get; set; }

    [MaxLength(500)]
    public string? ImagenUrl { get; set; }
}

// Mismos campos editables que en la creacion.
public class ActualizarServicioClaseRequest
{
    [Required, MaxLength(150)]
    public string Titulo { get; set; } = null!;

    [Required, MaxLength(1000)]
    public string Descripcion { get; set; } = null!;

    [Required]
    public decimal Precio { get; set; }

    [Required, MaxLength(100)]
    public string Materia { get; set; } = null!;

    public NivelClase Nivel { get; set; }

    public ModalidadClase Modalidad { get; set; }

    public int DuracionMinutosSesion { get; set; } = 60;

    public bool EsPaquete { get; set; }

    public int? CantidadSesionesPaquete { get; set; }

    [MaxLength(500)]
    public string? ImagenUrl { get; set; }
}

public class ServicioClaseDetalle
{
    public string Materia { get; set; } = null!;
    public NivelClase Nivel { get; set; }
    public ModalidadClase Modalidad { get; set; }
    public int DuracionMinutosSesion { get; set; }
    public bool EsPaquete { get; set; }
    public int? CantidadSesionesPaquete { get; set; }
}

public class ServicioClaseResponse : ServicioResponse
{
    public string Materia { get; set; } = null!;
    public NivelClase Nivel { get; set; }
    public ModalidadClase Modalidad { get; set; }
    public int DuracionMinutosSesion { get; set; }
    public bool EsPaquete { get; set; }
    public int? CantidadSesionesPaquete { get; set; }
}
