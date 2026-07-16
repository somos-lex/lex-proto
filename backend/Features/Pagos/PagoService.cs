using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Lex.Api.Features.Pagos;

public class PagoService : IPagoService
{
    private readonly AppDbContext _db;
    private readonly LexOptions _opciones;

    // Estados desde los que el escrow todavia puede resolverse: la plata sigue en LEX.
    // EnDisputa entra porque la maquina de estados habilita Disputa -> Completado y
    // Disputa -> Cancelado, y esas transiciones tienen que poder liberar o reembolsar.
    private static readonly EstadoPago[] EstadosResolubles = { EstadoPago.Retenido, EstadoPago.EnDisputa };

    public PagoService(AppDbContext db, IOptions<LexOptions> opciones)
    {
        _db = db;
        _opciones = opciones.Value;
    }

    // --- Negocio del escrow -------------------------------------------------

    // Crea el escrow con los snapshots contractuales (monto y % de comision vigentes al
    // contratar) y su primer asiento. El trabajo se referencia por navegacion y no por
    // TrabajoId porque puede venir sin Id todavia: al contratar, el trabajo y el pago se
    // insertan en el mismo SaveChanges y EF resuelve la FK.
    public Pago CrearPagoParaTrabajo(Trabajo trabajo)
    {
        var porcentaje = _opciones.PorcentajeComision;
        var comision = Math.Round(trabajo.PrecioAcordado * porcentaje / 100m, 2, MidpointRounding.AwayFromZero);
        var ahora = DateTime.UtcNow;

        var pago = new Pago
        {
            Trabajo = trabajo,
            MontoTotal = trabajo.PrecioAcordado,
            PorcentajeComisionLex = porcentaje,
            MontoComisionCalculada = comision,
            MontoAEstudiante = trabajo.PrecioAcordado - comision,
            Estado = EstadoPago.Retenido,
            FechaCreacion = ahora
        };
        pago.Movimientos.Add(new MovimientoPago
        {
            Tipo = TipoMovimientoPago.Retencion,
            Monto = trabajo.PrecioAcordado,
            Descripcion = "Retención del pago en escrow al contratar el trabajo.",
            FechaMovimiento = ahora
        });

        _db.Pagos.Add(pago);
        return pago;
    }

    // Cierre feliz: el estudiante cobra su parte y LEX toma la comision. Exige escrow:
    // liberar plata que nunca se retuvo es una inconsistencia y tiene que explotar.
    public async Task LiberarPagoTotalAsync(int idTrabajo)
    {
        var pago = await _db.Pagos.FirstOrDefaultAsync(p => p.TrabajoId == idTrabajo)
            ?? throw new InvalidOperationException(
                $"El trabajo {idTrabajo} no tiene un pago asociado: no se puede liberar el escrow.");

        if (!EstadosResolubles.Contains(pago.Estado))
            throw new InvalidOperationException($"No se puede liberar un pago en estado {pago.Estado}.");

        var ahora = DateTime.UtcNow;
        _db.MovimientosPago.Add(new MovimientoPago
        {
            PagoId = pago.Id,
            Tipo = TipoMovimientoPago.LiberacionEstudiante,
            Monto = pago.MontoAEstudiante,
            Descripcion = "Liberación al estudiante por trabajo completado.",
            FechaMovimiento = ahora
        });
        _db.MovimientosPago.Add(new MovimientoPago
        {
            PagoId = pago.Id,
            Tipo = TipoMovimientoPago.ComisionLex,
            Monto = pago.MontoComisionCalculada,
            Descripcion = $"Comisión LEX {pago.PorcentajeComisionLex:0.##}% sobre el trabajo completado.",
            FechaMovimiento = ahora
        });

        pago.Estado = EstadoPago.Liberado;
        pago.FechaLiberacion = ahora;
    }

    // Devuelve el total al cliente. A diferencia de liberar, tolera que no haya escrow:
    // un trabajo anterior a esta integracion se tiene que poder cancelar igual.
    public async Task ReembolsarPagoAsync(int idTrabajo, string motivo)
    {
        var pago = await _db.Pagos.FirstOrDefaultAsync(p => p.TrabajoId == idTrabajo);
        if (pago is null)
            return;

        if (!EstadosResolubles.Contains(pago.Estado))
            throw new InvalidOperationException($"No se puede reembolsar un pago en estado {pago.Estado}.");

        _db.MovimientosPago.Add(new MovimientoPago
        {
            PagoId = pago.Id,
            Tipo = TipoMovimientoPago.Reembolso,
            Monto = pago.MontoTotal,
            Descripcion = $"Reembolso al cliente por cancelación del trabajo: {motivo}",
            FechaMovimiento = DateTime.UtcNow
        });

        pago.Estado = EstadoPago.Reembolsado;
    }

    // Congela el escrow mientras dura el conflicto. No genera asiento: la plata no se
    // mueve, solo deja de poder resolverse hasta que la disputa se cierre.
    public async Task MarcarEnDisputaAsync(int idTrabajo)
    {
        var pago = await _db.Pagos.FirstOrDefaultAsync(p => p.TrabajoId == idTrabajo);
        if (pago is null)
            return;

        if (pago.Estado != EstadoPago.Retenido)
            throw new InvalidOperationException($"No se puede poner en disputa un pago en estado {pago.Estado}.");

        pago.Estado = EstadoPago.EnDisputa;
    }

    // --- Consultas ----------------------------------------------------------

    public async Task<IReadOnlyList<PagoResumenResponse>> ListarMiosAsync(int usuarioId, EstadoPago? estado, TipoServicio? tipoTrabajo)
    {
        // Participa el que puso la plata o el que la va a cobrar.
        var query = _db.Pagos.AsNoTracking()
            .Include(p => p.Trabajo)
            .Where(p => p.Trabajo.ClienteId == usuarioId || p.Trabajo.EstudianteId == usuarioId);

        if (estado is EstadoPago e)
            query = query.Where(p => p.Estado == e);

        query = tipoTrabajo switch
        {
            TipoServicio.ProyectoCerrado => query.Where(p => p.Trabajo is TrabajoProyectoCerrado),
            TipoServicio.Clase => query.Where(p => p.Trabajo is TrabajoClase),
            TipoServicio.Salud => query.Where(p => p.Trabajo is TrabajoSalud),
            _ => query
        };

        var pagos = await query.OrderByDescending(p => p.FechaCreacion).ToListAsync();

        return pagos.Select(p => new PagoResumenResponse(
            p.Id,
            p.TrabajoId,
            p.Trabajo.TituloSnapshot,
            TipoDe(p.Trabajo),
            RolDe(usuarioId, p.Trabajo),
            p.MontoTotal,
            p.MontoAEstudiante,
            p.MontoComisionCalculada,
            p.Estado.ToString(),
            p.FechaCreacion,
            p.FechaLiberacion)).ToList();
    }

    public async Task<PagoDetalleResponse> ObtenerDetalleAsync(int usuarioId, int idPago)
    {
        var pago = await BuscarParticipandoAsync(usuarioId, idPago);

        var movimientos = await MovimientosDeAsync(idPago);

        return new PagoDetalleResponse(
            pago.Id,
            pago.TrabajoId,
            pago.Trabajo.TituloSnapshot,
            TipoDe(pago.Trabajo),
            pago.MontoTotal,
            pago.PorcentajeComisionLex,
            pago.MontoComisionCalculada,
            pago.MontoAEstudiante,
            pago.Estado.ToString(),
            pago.FechaCreacion,
            pago.FechaLiberacion,
            movimientos);
    }

    public async Task<IReadOnlyList<MovimientoPagoResponse>> ListarMovimientosAsync(int usuarioId, int idPago)
    {
        await BuscarParticipandoAsync(usuarioId, idPago);
        return await MovimientosDeAsync(idPago);
    }

    // Un pago al que no participás se responde igual que uno inexistente: 404 en los dos
    // casos, para no filtrar por diferencia de status que el pago existe.
    private async Task<Pago> BuscarParticipandoAsync(int usuarioId, int idPago)
    {
        var pago = await _db.Pagos.AsNoTracking()
            .Include(p => p.Trabajo)
            .FirstOrDefaultAsync(p => p.Id == idPago);

        if (pago is null || (pago.Trabajo.ClienteId != usuarioId && pago.Trabajo.EstudianteId != usuarioId))
            throw new NotFoundException($"No existe el pago {idPago}.");

        return pago;
    }

    // El libro se lee en orden cronologico: primero la retencion, despues su resolucion.
    private async Task<List<MovimientoPagoResponse>> MovimientosDeAsync(int idPago) =>
        await _db.MovimientosPago.AsNoTracking()
            .Where(m => m.PagoId == idPago)
            .OrderBy(m => m.FechaMovimiento).ThenBy(m => m.Id)
            .Select(m => new MovimientoPagoResponse(
                m.Id, m.Tipo.ToString(), m.Monto, m.Descripcion, m.FechaMovimiento))
            .ToListAsync();

    public async Task<IngresosAdminResponse> ObtenerIngresosLexAsync()
    {
        // El tipo de trabajo sale de la subclase TPT que materializa EF, asi que traemos
        // los pagos con su trabajo y agregamos en C# (tambien evita sumar decimals en SQL).
        var pagos = await _db.Pagos.AsNoTracking()
            .Include(p => p.Trabajo)
            .Select(p => new { p.Estado, Comision = p.MontoComisionCalculada, p.Trabajo })
            .ToListAsync();

        var liberados = pagos.Where(p => p.Estado == EstadoPago.Liberado).ToList();
        var retenidos = pagos.Where(p => p.Estado == EstadoPago.Retenido).ToList();
        var reembolsados = pagos.Where(p => p.Estado == EstadoPago.Reembolsado).ToList();

        var comisionLiberada = liberados.Sum(p => p.Comision);
        var comisionRetenida = retenidos.Sum(p => p.Comision);

        // Las 3 verticales aparecen siempre, aunque no tengan pagos todavia.
        var breakdown = Enum.GetValues<TipoServicio>().ToDictionary(
            tipo => tipo.ToString(),
            tipo =>
            {
                var delTipo = pagos.Where(p => TipoDe(p.Trabajo) == tipo.ToString()).ToList();
                return new IngresosPorVertical(
                    delTipo.Count,
                    delTipo.Where(p => p.Estado == EstadoPago.Liberado).Sum(p => p.Comision),
                    delTipo.Where(p => p.Estado == EstadoPago.Retenido).Sum(p => p.Comision));
            });

        return new IngresosAdminResponse(
            comisionLiberada,
            comisionRetenida,
            comisionLiberada + comisionRetenida, // las reembolsadas no cuentan
            pagos.Count,
            liberados.Count,
            retenidos.Count,
            reembolsados.Count,
            liberados.Count == 0 ? 0m : Math.Round(comisionLiberada / liberados.Count, 2, MidpointRounding.AwayFromZero),
            breakdown);
    }

    // La vertical la define la subclase concreta que materializo EF (TPT).
    private static string TipoDe(Trabajo trabajo) => trabajo switch
    {
        TrabajoProyectoCerrado => nameof(TipoServicio.ProyectoCerrado),
        TrabajoClase => nameof(TipoServicio.Clase),
        TrabajoSalud => nameof(TipoServicio.Salud),
        _ => throw new InvalidOperationException($"Vertical desconocida para el trabajo {trabajo.Id}.")
    };

    private static string RolDe(int usuarioId, Trabajo trabajo) =>
        trabajo.EstudianteId == usuarioId ? "Estudiante" : "Cliente";
}
