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

    // Credencial y tarjeta del catalogo (D5): lo que la tarjeta necesita mostrar sin
    // pedir el detalle de cada servicio. Todo es aditivo y nullable. Va anidado porque
    // las respuestas por vertical (ServicioClaseResponse, ServicioSaludResponse, ...)
    // heredan de esta clase y ya usan nombres como Materia, Modalidad o SupervisorNombre.
    // Lo completan el listado, el detalle y el portafolio; la alta y la edicion por
    // vertical lo dejan en null.

    // Carrera VERIFICADA del estudiante. Null si hoy no tiene ninguna verificada.
    public CredencialEstudianteResponse? Credencial { get; set; }

    // Profesional que supervisa. Solo en Salud.
    public SupervisorResumenResponse? Supervisor { get; set; }

    // Nombre de la entrada del catalogo (Proyecto cerrado y Salud) o la materia (Clase).
    public string? Tema { get; set; }

    // Duracion, modalidad, plazo y paquete: la unidad del precio depende de esto.
    public CondicionesServicioResponse? Condiciones { get; set; }
}

public class CredencialEstudianteResponse
{
    public string Carrera { get; set; } = null!;
    // Nombre completo, ej. "Universidad Nacional del Nordeste (UNNE)".
    public string Institucion { get; set; } = null!;
    public int? AnioCursado { get; set; }
}

public class SupervisorResumenResponse
{
    public string Nombre { get; set; } = null!;
    public string Matricula { get; set; } = null!;
}

public class CondicionesServicioResponse
{
    // Clase y Salud.
    public int? DuracionMinutosSesion { get; set; }
    // Clase: Online, Presencial o Ambas. Salud: Domicilio, Consultorio o Ambas.
    public string? Modalidad { get; set; }
    // Proyecto cerrado.
    public int? PlazoEntregaDias { get; set; }
    // Clase: si es paquete, el precio es del paquete entero.
    public bool? EsPaquete { get; set; }
    public int? CantidadSesionesPaquete { get; set; }
}

// Detalle unificado (GET /api/servicios/{id}): los campos comunes mas un bloque
// 'detalle' polimorfico con los campos propios de la vertical.
public class ServicioDetalleResponse : ServicioResponse
{
    public object? Detalle { get; set; }
}

// Envoltorio de paginacion generico. El listado publico lo usa para no traer todo el
// catalogo de una: el cliente pide una pagina y recibe ademas cuantas hay en total.
public class PaginacionResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
