
namespace Lex.Api.Features.Resenas;

public interface IResenaService
{
    Task<ResenaResponse> CrearAsync(int autorId, int idTrabajo, CrearResenaRequest request);
    Task<IReadOnlyList<ResenaResponse>> ListarRecibidasAsync(int usuarioId);
    Task<IReadOnlyList<ResenaResponse>> ListarPorTrabajoAsync(int usuarioId, int idTrabajo);
}
