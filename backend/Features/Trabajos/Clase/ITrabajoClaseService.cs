namespace Lex.Api.Features.Trabajos.Clase;

public interface ITrabajoClaseService
{
    Task<TrabajoClaseResponse> ContratarAsync(int clienteId, ContratarTrabajoClaseRequest request);
    Task<TrabajoClaseResponse> ObtenerAsync(int usuarioId, int idTrabajo);
}
