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

    public async Task<PagoResponse> ObtenerPorTrabajoAsync(int usuarioId, int idTrabajo)
    {
        // Validamos participacion mirando el trabajo (existe siempre, aunque no haya pago).
        var trabajo = await _db.Trabajos.AsNoTracking()
            .Where(t => t.Id == idTrabajo)
            .Select(t => new { t.EstudianteId, t.ClienteId })
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"No existe el trabajo {idTrabajo}.");

        if (trabajo.EstudianteId != usuarioId && trabajo.ClienteId != usuarioId)
            throw new ForbiddenException("No participás en este trabajo.");

        return await _db.Pagos.AsNoTracking()
            .Where(p => p.TrabajoId == idTrabajo)
            .Select(Proyeccion)
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"El trabajo {idTrabajo} todavía no tiene un pago asociado.");
    }

    public async Task<MisPagosResponse> ListarMiosAsync(int estudianteId)
    {
        var pagos = await _db.Pagos.AsNoTracking()
            .Where(p => p.Trabajo.EstudianteId == estudianteId)
            .OrderByDescending(p => p.FechaCreacion)
            .Select(Proyeccion)
            .ToListAsync();

        return new MisPagosResponse
        {
            TotalCobrado = pagos.Where(p => p.Estado == EstadoPago.Liberado).Sum(p => p.MontoEstudiante),
            TotalRetenido = pagos.Where(p => p.Estado == EstadoPago.Retenido).Sum(p => p.MontoEstudiante),
            Pagos = pagos
        };
    }

    public async Task<IngresosLexResponse> ObtenerIngresosLexAsync()
    {
        // Traemos las comisiones por estado; el agregado se hace en C# (decimal).
        var pagos = await _db.Pagos.AsNoTracking()
            .Select(p => new { p.Estado, Comision = p.MontoComisionCalculada })
            .ToListAsync();

        var liberados = pagos.Where(p => p.Estado == EstadoPago.Liberado).ToList();
        var retenidos = pagos.Where(p => p.Estado == EstadoPago.Retenido).ToList();
        var reembolsados = pagos.Where(p => p.Estado == EstadoPago.Reembolsado).ToList();

        var comisionLiberada = liberados.Sum(p => p.Comision);
        var comisionRetenida = retenidos.Sum(p => p.Comision);

        return new IngresosLexResponse
        {
            ComisionLiberada = comisionLiberada,
            ComisionRetenida = comisionRetenida,
            ComisionTotal = comisionLiberada + comisionRetenida, // las reembolsadas no cuentan
            CantidadTrabajosConPago = pagos.Count,
            CantidadPagosLiberados = liberados.Count,
            CantidadPagosRetenidos = retenidos.Count,
            CantidadPagosReembolsados = reembolsados.Count
        };
    }

    private static readonly System.Linq.Expressions.Expression<Func<Lex.Api.Domain.Entities.Pago, PagoResponse>> Proyeccion =
        p => new PagoResponse
        {
            Id = p.Id,
            TrabajoId = p.TrabajoId,
            MontoTotal = p.MontoTotal,
            PorcentajeComision = p.PorcentajeComisionLex,
            ComisionLex = p.MontoComisionCalculada,
            MontoEstudiante = p.MontoAEstudiante,
            Estado = p.Estado,
            FechaRetencion = p.FechaCreacion,
            FechaLiberacion = p.FechaLiberacion
        };
}
