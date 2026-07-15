using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Trabajos.Shared;

// Helpers compartidos por las 3 verticales para derivar el tipo de un trabajo y
// para llenar los campos base de cualquier Response. Evita duplicar el mapeo comun.
public static class TrabajoMapping
{
    public static TipoServicio TipoDe(Trabajo t) => t switch
    {
        TrabajoProyectoCerrado => TipoServicio.ProyectoCerrado,
        TrabajoClase => TipoServicio.Clase,
        TrabajoSalud => TipoServicio.Salud,
        _ => throw new InvalidOperationException($"Subclase de Trabajo no contemplada: {t.GetType().Name}.")
    };

    // Copia los campos comunes al Response destino. Requiere Cliente.Usuario y
    // Estudiante.Usuario cargados (Include) para los nombres.
    public static T LlenarBase<T>(this T dst, Trabajo t) where T : TrabajoResponse
    {
        dst.Id = t.Id;
        dst.ServicioId = t.ServicioId;
        dst.ClienteId = t.ClienteId;
        dst.ClienteNombre = t.Cliente.Usuario.NombreCompleto;
        dst.EstudianteId = t.EstudianteId;
        dst.EstudianteNombre = t.Estudiante.Usuario.NombreCompleto;
        dst.TituloSnapshot = t.TituloSnapshot;
        dst.DescripcionSnapshot = t.DescripcionSnapshot;
        dst.PrecioAcordado = t.PrecioAcordado;
        dst.Estado = t.Estado;
        dst.Tipo = TipoDe(t);
        dst.FechaCreacion = t.FechaCreacion;
        dst.FechaInicio = t.FechaInicio;
        dst.FechaFin = t.FechaFin;
        return dst;
    }
}
