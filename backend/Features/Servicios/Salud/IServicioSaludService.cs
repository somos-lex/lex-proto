namespace Lex.Api.Features.Servicios.Salud;

public interface IServicioSaludService
{
    Task<ServicioSaludResponse> CrearAsync(int estudianteId, CrearServicioSaludRequest request);
    Task<ServicioSaludResponse> ActualizarAsync(int estudianteId, int id, ActualizarServicioSaludRequest request);
    Task EliminarAsync(int estudianteId, int id);
    Task<ServicioSaludResponse> ObtenerAsync(int id);
}
