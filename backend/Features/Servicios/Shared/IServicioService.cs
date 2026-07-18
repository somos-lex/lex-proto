using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Servicios.Shared;

// Reglas de publicacion compartidas por las tres verticales.
public interface IServicioPublicacionValidator
{
    Task<EstudianteHabilitado> ValidarEstudianteAsync(int estudianteId);
    Task<CatalogoServicio> ValidarCatalogoAsync(int catalogoServicioId, TipoServicio tipoEsperado, EstudianteHabilitado estudiante);
}

// Queries agnosticas al tipo: alimentan el catalogo publico.
public interface IServicioService
{
    Task<PaginacionResponse<ServicioResponse>> ListarAsync(
        TipoServicio? tipo, int? carreraId, int? estudianteId, bool? activo,
        int page, int pageSize, CancellationToken ct = default);
    Task<ServicioDetalleResponse> ObtenerAsync(int id);
    Task<IReadOnlyList<ServicioResponse>> ListarPorEstudianteAsync(int estudianteId);
}
