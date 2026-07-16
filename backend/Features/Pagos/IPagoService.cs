using Lex.Api.Domain.Entities;

namespace Lex.Api.Features.Pagos;

public interface IPagoService
{
    // --- Consultas ---
    Task<PagoResponse> ObtenerPorTrabajoAsync(int usuarioId, int idTrabajo);
    Task<MisPagosResponse> ListarMiosAsync(int estudianteId);
    Task<IngresosLexResponse> ObtenerIngresosLexAsync();

    // --- Negocio del escrow ---
    // Ninguno de estos llama a SaveChanges: solo dejan los cambios en el DbContext para
    // que el llamador cierre la unidad de trabajo. Asi el trabajo y su pago se commitean
    // en la misma transaccion implicita de SaveChanges, sin transaccion explicita.
    Pago CrearPagoParaTrabajo(Trabajo trabajo);
    Task LiberarPagoTotalAsync(int idTrabajo);
    Task ReembolsarPagoAsync(int idTrabajo, string motivo);
    Task MarcarEnDisputaAsync(int idTrabajo);
}
