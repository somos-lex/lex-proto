using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Practicas;

// Lado del estudiante, consultas publicas y verificacion de constancias.
public interface IPracticaService
{
    Task<PracticaDetalleResponse> PublicarAsync(int estudianteId, PublicarPracticaRequest request);
    Task<IReadOnlyList<PracticaDetalleResponse>> ListarMiasAsync(int estudianteId, EstadoPracticaClinica? estado);
    Task<PracticaDetalleResponse> CancelarAsync(int estudianteId, int idPractica, string? motivo);
    Task<ConstanciaResponse> RegistrarAsistenciaAsync(int estudianteId, int idPractica, bool asistio, string? observaciones);
    Task<ConstanciaResponse> ObtenerConstanciaAsync(int usuarioId, int idPractica);

    Task<IReadOnlyList<PracticaPublicaResponse>> ListarDisponiblesAsync(
        int? carreraId, TipoPaciente? tipoPaciente, DateOnly? desde, DateOnly? hasta);

    /// <summary>Partes: detalle completo. Resto (o anonimo): solo si esta Publicada y es futura; si no, 404.</summary>
    Task<PracticaDetalleResponse> ObtenerAsync(int? usuarioId, int idPractica);

    Task<IReadOnlyList<PracticaPorRecordarResponse>> ListarPorRecordarAsync(int horas);
    Task<ConstanciaPublicaResponse> VerificarConstanciaAsync(string codigo);
}

// Lado del cliente que inscribe un paciente.
public interface IInscripcionService
{
    Task<InscripcionResponse> InscribirAsync(int clienteId, int idPractica, InscribirPracticaRequest request);
    Task<IReadOnlyList<InscripcionResponse>> ListarMiasAsync(int clienteId);
    Task<InscripcionResponse> CancelarAsync(int usuarioId, int idInscripcion, string? motivo);
}
