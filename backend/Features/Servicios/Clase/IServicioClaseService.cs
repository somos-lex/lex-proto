namespace Lex.Api.Features.Servicios.Clase;

public interface IServicioClaseService
{
    Task<ServicioClaseResponse> CrearAsync(int estudianteId, CrearServicioClaseRequest request);
    Task<ServicioClaseResponse> ActualizarAsync(int estudianteId, int id, ActualizarServicioClaseRequest request);
    Task EliminarAsync(int estudianteId, int id);
    Task<ServicioClaseResponse> ObtenerAsync(int id);
}
