using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Enums;
using Lex.Api.Tests.Infra;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Lex.Api.Tests.Pagos;

// Bug: Pago y Trabajo no tenían control de concurrencia optimista, así que dos escrituras
// concurrentes sobre la misma fila (ej. cliente y estudiante resolviendo el mismo trabajo
// a la vez) se pisaban en silencio: la segunda en guardar ganaba sin aviso.
[Collection(ApiCollection.Nombre)]
public class ConcurrenciaTests
{
    private readonly ApiCliente _api;
    private readonly LexApiFactory _factory;

    public ConcurrenciaTests(LexApiFactory factory)
    {
        _api = new ApiCliente(factory);
        _factory = factory;
    }

    // Clase suelta contratada por HTTP real: la forma mas simple de tener un Trabajo+Pago
    // válidos para después cargarlos por fuera, con dos AppDbContext independientes.
    private async Task<(int TrabajoId, int PagoId)> TrabajoConPagoDePruebaAsync()
    {
        var carreraId = await _api.CarreraVerificableAsync();
        var estudiante = await _api.EstudianteVerificadoAsync(carreraId, anioCursado: 2);
        var cliente = await _api.RegistrarClienteAsync();

        var servicio = await _api.CrearServicioClaseOkAsync(estudiante, 3_000m, esPaquete: false, cantidadSesionesPaquete: null);
        await _api.CrearDisponibilidadAsync(estudiante, DiaSemana.Miercoles, new TimeOnly(9, 0), new TimeOnly(11, 0));

        var desde = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var slots = await _api.ListarSlotsDisponiblesAsync(estudiante.UsuarioId, desde, desde.AddDays(60), duracionMinutos: 60);
        var trabajo = await _api.ContratarClaseOkAsync(cliente, servicio.Id, new List<DateTime> { slots[0].FechaHoraInicio });

        var pago = await _api.ObtenerPagoDelTrabajoAsync(cliente, trabajo.Id);
        return (trabajo.Id, pago.Id);
    }

    [Fact]
    public async Task Dos_escrituras_concurrentes_sobre_el_mismo_pago_chocan_con_ConflictException()
    {
        var (_, pagoId) = await TrabajoConPagoDePruebaAsync();

        using var scopeA = _factory.Services.CreateScope();
        using var scopeB = _factory.Services.CreateScope();
        var dbA = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();
        var dbB = scopeB.ServiceProvider.GetRequiredService<AppDbContext>();

        // Dos contextos cargan la misma fila por separado, como dos requests concurrentes.
        var pagoDesdeA = await dbA.Pagos.FirstAsync(p => p.Id == pagoId);
        var pagoDesdeB = await dbB.Pagos.FirstAsync(p => p.Id == pagoId);

        pagoDesdeA.Estado = EstadoPago.EnDisputa;
        await dbA.SaveChangesAsync(); // gana la carrera: el xmin de la fila avanza.

        pagoDesdeB.Estado = EstadoPago.Reembolsado;
        var ex = await Assert.ThrowsAsync<ConflictException>(() => dbB.SaveChangesAsync());
        Assert.Contains("reintentá", ex.Message);
    }

    [Fact]
    public async Task Dos_escrituras_concurrentes_sobre_el_mismo_trabajo_chocan_con_ConflictException()
    {
        var (trabajoId, _) = await TrabajoConPagoDePruebaAsync();

        using var scopeA = _factory.Services.CreateScope();
        using var scopeB = _factory.Services.CreateScope();
        var dbA = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();
        var dbB = scopeB.ServiceProvider.GetRequiredService<AppDbContext>();

        var trabajoDesdeA = await dbA.Trabajos.FirstAsync(t => t.Id == trabajoId);
        var trabajoDesdeB = await dbB.Trabajos.FirstAsync(t => t.Id == trabajoId);

        trabajoDesdeA.Estado = EstadoTrabajo.Aceptado;
        await dbA.SaveChangesAsync();

        trabajoDesdeB.Estado = EstadoTrabajo.Cancelado;
        await Assert.ThrowsAsync<ConflictException>(() => dbB.SaveChangesAsync());
    }
}
