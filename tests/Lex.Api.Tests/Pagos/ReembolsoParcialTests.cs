using System.Net;
using Lex.Api.Domain.Enums;
using Lex.Api.Tests.Infra;

namespace Lex.Api.Tests.Pagos;

// Bug: reembolsar un pago ParcialmenteLiberado devolvía MontoTotal en vez del remanente
// retenido, duplicando lo que ya se había liberado al estudiante en sesiones previas.
[Collection(ApiCollection.Nombre)]
public class ReembolsoParcialTests
{
    private readonly ApiCliente _api;

    public ReembolsoParcialTests(LexApiFactory factory)
    {
        _api = new ApiCliente(factory);
    }

    // Arma un trabajo de Clase en paquete de 4, con el estudiante y cliente ya contratados
    // y el primer turno agendado a una semana vista (evita que el filtro de hora ya pasada
    // descarte slots por corrernos de huso horario en CI).
    private async Task<(Actor Estudiante, Actor Cliente, int TrabajoId, decimal Precio)> ClaseConPaqueteDeCuatroAsync()
    {
        var carreraId = await _api.CarreraVerificableAsync();
        var estudiante = await _api.EstudianteVerificadoAsync(carreraId, anioCursado: 3);
        var cliente = await _api.RegistrarClienteAsync();

        const decimal precio = 10_000m;
        var servicio = await _api.CrearServicioClaseOkAsync(estudiante, precio, esPaquete: true, cantidadSesionesPaquete: 4);
        await _api.CrearDisponibilidadAsync(estudiante, DiaSemana.Lunes, new TimeOnly(14, 0), new TimeOnly(18, 0));

        var desde = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var slots = await _api.ListarSlotsDisponiblesAsync(estudiante.UsuarioId, desde, desde.AddDays(60), duracionMinutos: 60);
        var elegidos = slots.Take(4).Select(s => s.FechaHoraInicio).ToList();

        var trabajo = await _api.ContratarClaseOkAsync(cliente, servicio.Id, elegidos);
        await ApiCliente.AssertStatusAsync(await _api.AceptarTrabajoAsync(estudiante, trabajo.Id), HttpStatusCode.OK);

        return (estudiante, cliente, trabajo.Id, precio);
    }

    [Fact]
    public async Task Cancelar_con_pago_retenido_reembolsa_el_total()
    {
        var (_, cliente, trabajoId, precio) = await ClaseConPaqueteDeCuatroAsync();

        var pago = await _api.ObtenerPagoDelTrabajoAsync(cliente, trabajoId);
        Assert.Equal("Retenido", pago.Estado);

        await ApiCliente.AssertStatusAsync(
            await _api.CancelarTrabajoAsync(cliente, trabajoId, "No lo necesito más"), HttpStatusCode.OK);

        var detalle = await _api.ObtenerDetallePagoAsync(cliente, pago.Id);
        Assert.Equal("Reembolsado", detalle.Estado);
        var reembolso = Assert.Single(detalle.Movimientos, m => m.Tipo == "Reembolso");
        Assert.Equal(precio, reembolso.Monto);
    }

    [Fact]
    public async Task Cancelar_con_pago_parcialmente_liberado_reembolsa_solo_el_remanente()
    {
        var (estudiante, cliente, trabajoId, precio) = await ClaseConPaqueteDeCuatroAsync();

        var sesiones = await _api.ListarSesionesAsync(estudiante, trabajoId);
        var primera = sesiones.OrderBy(s => s.NumeroSesion).First();
        await ApiCliente.AssertStatusAsync(
            await _api.MarcarSesionRealizadaAsync(estudiante, primera.Id), HttpStatusCode.OK);

        var pago = await _api.ObtenerPagoDelTrabajoAsync(cliente, trabajoId);
        Assert.Equal("ParcialmenteLiberado", pago.Estado);

        // Precio 10.000, comisión 10%: 9.000 al estudiante + 1.000 de comisión. 1 de 4
        // sesiones liberada: 2.250 + 250 ya se pagaron. El remanente retenido es 7.500.
        const decimal remanenteEsperado = 7_500m;

        await ApiCliente.AssertStatusAsync(
            await _api.CancelarTrabajoAsync(cliente, trabajoId, "Ya no sigo con el paquete"), HttpStatusCode.OK);

        var detalle = await _api.ObtenerDetallePagoAsync(cliente, pago.Id);
        Assert.Equal("Reembolsado", detalle.Estado);

        var reembolso = Assert.Single(detalle.Movimientos, m => m.Tipo == "Reembolso");
        Assert.Equal(remanenteEsperado, reembolso.Monto);
        Assert.True(reembolso.Monto < precio, "El reembolso no puede ser el total si ya se liberó una fracción.");

        // Lo ya liberado al estudiante y a LEX sigue en el libro, sin tocarse por el reembolso.
        Assert.Contains(detalle.Movimientos, m => m.Tipo == "LiberacionEstudiante" && m.Monto == 2_250m);
        Assert.Contains(detalle.Movimientos, m => m.Tipo == "ComisionLex" && m.Monto == 250m);
    }
}
