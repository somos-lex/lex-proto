using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Catalogo;

// Entrada del catalogo cerrado habilitada para una carrera/año concretos.
public class CatalogoServicioPermitidoResponse
{
    public int Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Descripcion { get; set; } = null!;
    public TipoServicio TipoServicio { get; set; }
    public bool RequiereSupervisor { get; set; }
    public string? Observaciones { get; set; }

    // Año minimo exigido para la carrera por la que se consulto.
    public int AnioMinimo { get; set; }
}

// Detalle de una entrada del catalogo: incluye el año minimo de CADA carrera habilitada.
public class CatalogoServicioDetalleResponse
{
    public int Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Descripcion { get; set; } = null!;
    public TipoServicio TipoServicio { get; set; }
    public bool RequiereSupervisor { get; set; }
    public bool Activo { get; set; }
    public string? Observaciones { get; set; }
    public List<CatalogoCarreraResponse> Carreras { get; set; } = new();
}

public class CatalogoCarreraResponse
{
    public int CarreraId { get; set; }
    public string Carrera { get; set; } = null!;
    public string Institucion { get; set; } = null!;
    public int AnioMinimo { get; set; }
}

public class SupervisorResponse
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = null!;
    public string Matricula { get; set; } = null!;
    public string Especialidad { get; set; } = null!;
    public int? InstitucionId { get; set; }
    public string? Institucion { get; set; }
}
