namespace Lex.Api.Features.Servicios.ProyectoCerrado;

public interface IServicioProyectoCerradoService
{
    Task<ServicioProyectoCerradoResponse> CrearAsync(int estudianteId, CrearServicioProyectoCerradoRequest request);
    Task<ServicioProyectoCerradoResponse> ActualizarAsync(int estudianteId, int id, ActualizarServicioProyectoCerradoRequest request);
    Task EliminarAsync(int estudianteId, int id);
    Task<ServicioProyectoCerradoResponse> ObtenerAsync(int id);
}
