namespace Lex.Api.Features.Trabajos.ProyectoCerrado;

public interface ITrabajoProyectoCerradoService
{
    Task<TrabajoProyectoCerradoResponse> ContratarAsync(int clienteId, ContratarTrabajoProyectoCerradoRequest request);
    Task<TrabajoProyectoCerradoResponse> ObtenerAsync(int usuarioId, int idTrabajo);
}
