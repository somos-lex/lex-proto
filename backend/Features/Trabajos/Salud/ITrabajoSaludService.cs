namespace Lex.Api.Features.Trabajos.Salud;

public interface ITrabajoSaludService
{
    Task<TrabajoSaludResponse> ContratarAsync(int clienteId, ContratarTrabajoSaludRequest request);
    Task<TrabajoSaludResponse> FirmarConsentimientoAsync(int usuarioId, int idTrabajo, string? ip);
    Task<TrabajoSaludResponse> ObtenerAsync(int usuarioId, int idTrabajo);
}
