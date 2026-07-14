using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Solicitudes;

public interface ISolicitudService
{
    Task<SolicitudResponse> CrearAsync(int clienteId, CrearSolicitudRequest request);
    Task<IReadOnlyList<SolicitudResponse>> ListarAbiertasAsync(TipoServicio? tipo, string? texto);
    Task<SolicitudResponse> ObtenerAsync(int idSolicitud);
    Task<IReadOnlyList<SolicitudMiaResponse>> ListarMiasAsync(int clienteId);
    Task CerrarAsync(int clienteId, int idSolicitud);
}
