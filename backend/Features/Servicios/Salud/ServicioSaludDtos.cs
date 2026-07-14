using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Servicios.Shared;

namespace Lex.Api.Features.Servicios.Salud;

// Catalogo cerrado + supervisor matriculado obligatorio.
public class CrearServicioSaludRequest
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
    public int SupervisorId { get; set; }

    public ModalidadSalud Modalidad { get; set; }

    public int DuracionMinutosSesion { get; set; } = 45;

    [MaxLength(500)]
    public string? ImagenUrl { get; set; }
}

// Mismos campos editables que en la creacion.
public class ActualizarServicioSaludRequest
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
    public int SupervisorId { get; set; }

    public ModalidadSalud Modalidad { get; set; }

    public int DuracionMinutosSesion { get; set; } = 45;

    [MaxLength(500)]
    public string? ImagenUrl { get; set; }
}

public class ServicioSaludDetalle
{
    public int CatalogoServicioId { get; set; }
    public string CatalogoServicioNombre { get; set; } = null!;
    public int SupervisorId { get; set; }
    public string SupervisorNombre { get; set; } = null!;
    public string SupervisorMatricula { get; set; } = null!;
    public ModalidadSalud Modalidad { get; set; }
    public int DuracionMinutosSesion { get; set; }
}

public class ServicioSaludResponse : ServicioResponse
{
    public int CatalogoServicioId { get; set; }
    public string CatalogoServicioNombre { get; set; } = null!;
    public int SupervisorId { get; set; }
    public string SupervisorNombre { get; set; } = null!;
    public string SupervisorMatricula { get; set; } = null!;
    public ModalidadSalud Modalidad { get; set; }
    public int DuracionMinutosSesion { get; set; }
}
