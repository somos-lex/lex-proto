namespace Lex.Api.Features.Admin;

public interface IVerificacionService
{
    Task<IReadOnlyList<VerificacionPendienteResponse>> ListarPendientesAsync();
    Task<VerificacionResueltaResponse> AprobarAsync(int adminId, int estudianteId, int carreraId, string? observaciones);
    Task<VerificacionResueltaResponse> RechazarAsync(int adminId, int estudianteId, int carreraId, string motivo);
}
