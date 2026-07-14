
namespace Lex.Api.Features.Servicios;

public interface IServicioService
{
    Task<ServicioResponse> CrearAsync(int estudianteId, CrearServicioRequest request);
    Task<ServicioResponse> ActualizarAsync(int estudianteId, int idServicio, ActualizarServicioRequest request);
    Task EliminarAsync(int estudianteId, int idServicio);
    Task<IReadOnlyList<ServicioResponse>> ListarAsync(int? tipoServicioId, string? texto);
    Task<IReadOnlyList<ServicioResponse>> ListarPorEstudianteAsync(int estudianteId);
    Task<ServicioResponse> ObtenerAsync(int idServicio);
}
