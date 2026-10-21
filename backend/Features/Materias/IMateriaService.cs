namespace Lex.Api.Features.Materias;

public interface IMateriaService
{
    Task<IReadOnlyList<MateriaResponse>> ListarAsync(int? carreraId, bool incluirInactivas);
    Task<IReadOnlyList<MateriaResponse>> ListarHabilitadasAsync(int estudianteId);
    Task<MateriaResponse> CrearAsync(CrearMateriaRequest request);
    Task<MateriaResponse> ActualizarAsync(int id, ActualizarMateriaRequest request);
    Task<MateriaResponse> CambiarActivaAsync(int id, bool activa);
}
