using System.Net;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Sesiones;
using Lex.Api.Tests.Infra;

namespace Lex.Api.Tests.Turnos;

// Fija la política documentada (README_TURNOS.md "Cancelación de turnos" y "Cancelar las
// sesiones que faltaban"): cancelar una sesión de un paquete vivo no reembolsa nada — el
// precio es del paquete, no de la sesión suelta — y solo hay movimiento de plata cuando la
// cancelación termina resolviendo el trabajo entero (cancelado o completado). No es un bug
// distinto del de reembolso parcial (ver tests/Lex.Api.Tests/Pagos): el único camino de
// reembolso real pasaba por el método que ese bug arreglaba.
[Collection(ApiCollection.Nombre)]
public class CancelacionTurnoTests
{
    private readonly ApiCliente _api;

    public CancelacionTurnoTests(LexApiFactory factory)
    {
        _api = new ApiCliente(factory);
    }

    private async Task<(Actor Estudiante, Actor Cliente, int TrabajoId, List<SesionResponse> Sesiones, decimal Precio)>
        ContratarClaseAsync(int cantidadSesiones)
    {
        var carreraId = await _api.CarreraVerificableAsync();
        var estudiante = await _api.EstudianteVerificadoAsync(carreraId, anioCursado: 3);
        var cliente = await _api.RegistrarClienteAsync();

        const decimal precio = 8_000m;
        var esPaquete = cantidadSesiones > 1;
        var servicio = await _api.CrearServicioClaseOkAsync(
            estudiante, precio, esPaquete, esPaquete ? cantidadSesiones : null);
        await _api.CrearDisponibilidadAsync(estudiante, DiaSemana.Lunes, new TimeOnly(14, 0), new TimeOnly(20, 0));

        var desde = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var slots = await _api.ListarSlotsDisponiblesAsync(estudiante.UsuarioId, desde, desde.AddDays(60), duracionMinutos: 60);
        var elegidos = slots.Take(cantidadSesiones).Select(s => s.FechaHoraInicio).ToList();

        var trabajo = await _api.ContratarClaseOkAsync(cliente, servicio.Id, elegidos);
        await ApiCliente.AssertStatusAsync(await _api.AceptarTrabajoAsync(estudiante, trabajo.Id), HttpStatusCode.OK);

        var sesiones = await _api.ListarSesionesAsync(estudiante, trabajo.Id);
        return (estudiante, cliente, trabajo.Id, sesiones, precio);
    }

    private async Task<int> TurnoIdDeAsync(Actor estudiante, SesionResponse sesion)
    {
        var turnos = await _api.ListarTurnosMiosAsync(estudiante);
        return turnos.Single(t => t.FechaHoraInicio == sesion.FechaHoraInicio).Id;
    }

    [Fact]
    public async Task Cancelar_una_sesion_de_un_paquete_vivo_no_mueve_el_pago()
    {
        var (estudiante, cliente, trabajoId, sesiones, _) = await ContratarClaseAsync(4);

        var segunda = sesiones.OrderBy(s => s.NumeroSesion).Skip(1).First();
        var turnoId = await TurnoIdDeAsync(estudiante, segunda);

        await ApiCliente.AssertStatusAsync(await _api.CancelarTurnoAsync(estudiante, turnoId), HttpStatusCode.OK);

        var trabajo = await _api.ObtenerTrabajoAsync(cliente, trabajoId);
        Assert.Equal(EstadoTrabajo.Aceptado, trabajo.Estado);

        var pago = await _api.ObtenerPagoDelTrabajoAsync(cliente, trabajoId);
        Assert.Equal("Retenido", pago.Estado);

        var detalle = await _api.ObtenerDetallePagoAsync(cliente, pago.Id);
        Assert.Single(detalle.Movimientos); // solo la Retención inicial: nada se reembolsó ni liberó.
    }

    [Fact]
    public async Task Cancelar_el_unico_turno_de_una_clase_suelta_cancela_el_trabajo_y_reembolsa_el_total()
    {
        var (estudiante, cliente, trabajoId, sesiones, precio) = await ContratarClaseAsync(1);
        var pago = await _api.ObtenerPagoDelTrabajoAsync(cliente, trabajoId);
        var turnoId = await TurnoIdDeAsync(estudiante, sesiones.Single());

        await ApiCliente.AssertStatusAsync(
            await _api.CancelarTurnoAsync(cliente, turnoId, "Cambio de planes"), HttpStatusCode.OK);

        var trabajo = await _api.ObtenerTrabajoAsync(cliente, trabajoId);
        Assert.Equal(EstadoTrabajo.Cancelado, trabajo.Estado);

        var detalle = await _api.ObtenerDetallePagoAsync(cliente, pago.Id);
        Assert.Equal("Reembolsado", detalle.Estado);
        var reembolso = Assert.Single(detalle.Movimientos, m => m.Tipo == "Reembolso");
        Assert.Equal(precio, reembolso.Monto);
    }

    [Fact]
    public async Task Cancelar_las_pendientes_de_un_paquete_ya_cumplido_completa_el_trabajo_sin_reembolso()
    {
        var (estudiante, cliente, trabajoId, sesiones, _) = await ContratarClaseAsync(4);
        var ordenadas = sesiones.OrderBy(s => s.NumeroSesion).ToList();

        await ApiCliente.AssertStatusAsync(
            await _api.MarcarSesionRealizadaAsync(estudiante, ordenadas[0].Id), HttpStatusCode.OK);
        await ApiCliente.AssertStatusAsync(
            await _api.MarcarSesionRealizadaAsync(estudiante, ordenadas[1].Id), HttpStatusCode.OK);

        var pago = await _api.ObtenerPagoDelTrabajoAsync(cliente, trabajoId);
        Assert.Equal("ParcialmenteLiberado", pago.Estado);

        var turno3 = await TurnoIdDeAsync(estudiante, ordenadas[2]);
        var turno4 = await TurnoIdDeAsync(estudiante, ordenadas[3]);

        // 4 -> 3 sesiones totales, 2 completadas: todavía no alcanza (2 < 3).
        await ApiCliente.AssertStatusAsync(await _api.CancelarTurnoAsync(estudiante, turno3), HttpStatusCode.OK);
        // 3 -> 2 sesiones totales, 2 completadas: el paquete se da por cumplido.
        await ApiCliente.AssertStatusAsync(await _api.CancelarTurnoAsync(estudiante, turno4), HttpStatusCode.OK);

        var trabajo = await _api.ObtenerTrabajoAsync(cliente, trabajoId);
        Assert.Equal(EstadoTrabajo.Completado, trabajo.Estado);

        var detalle = await _api.ObtenerDetallePagoAsync(cliente, pago.Id);
        Assert.Equal("Liberado", detalle.Estado);
        Assert.DoesNotContain(detalle.Movimientos, m => m.Tipo == "Reembolso");
    }
}
