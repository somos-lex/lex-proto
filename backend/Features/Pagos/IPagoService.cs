
namespace Lex.Api.Features.Pagos;

public interface IPagoService
{
    Task<PagoResponse> ObtenerPorTrabajoAsync(int usuarioId, int idTrabajo);
    Task<MisPagosResponse> ListarMiosAsync(int estudianteId);
    Task<IngresosLexResponse> ObtenerIngresosLexAsync();
}
