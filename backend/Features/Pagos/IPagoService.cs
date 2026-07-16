using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Pagos;

public interface IPagoService
{
    // --- Consultas ---
    Task<IReadOnlyList<PagoResumenResponse>> ListarMiosAsync(int usuarioId, EstadoPago? estado, TipoServicio? tipoTrabajo);
    Task<PagoDetalleResponse> ObtenerDetalleAsync(int usuarioId, int idPago);
    Task<IReadOnlyList<MovimientoPagoResponse>> ListarMovimientosAsync(int usuarioId, int idPago);
    Task<IngresosAdminResponse> ObtenerIngresosLexAsync();

    // --- Negocio del escrow ---
    // Ninguno de estos llama a SaveChanges: solo dejan los cambios en el DbContext para
    // que el llamador cierre la unidad de trabajo. Asi el trabajo y su pago se commitean
    // en la misma transaccion implicita de SaveChanges, sin transaccion explicita.
    Pago CrearPagoParaTrabajo(Trabajo trabajo);
    Task LiberarPagoTotalAsync(int idTrabajo);
    Task ReembolsarPagoAsync(int idTrabajo, string motivo);
    Task MarcarEnDisputaAsync(int idTrabajo);
}
