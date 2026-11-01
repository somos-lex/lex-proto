using System.Net;
using Lex.Api.Domain.Enums;
using Lex.Api.Tests.Infra;

namespace Lex.Api.Tests.Admin;

// Bug: no existía forma de arbitrar una disputa; dependía de que las partes cooperaran
// disparando completar/cancelar. Ahora un Admin puede resolverla explícitamente.
[Collection(ApiCollection.Nombre)]
public class ResolverDisputaTests
{
    private readonly ApiCliente _api;

    public ResolverDisputaTests(LexApiFactory factory)
    {
        _api = new ApiCliente(factory);
    }

    private async Task<(Actor Estudiante, Actor Cliente, int TrabajoId, int PagoId, decimal Precio)> ClaseEnDisputaAsync()
    {
        var carreraId = await _api.CarreraVerificableAsync();
        var estudiante = await _api.EstudianteVerificadoAsync(carreraId, anioCursado: 3);
        var cliente = await _api.RegistrarClienteAsync();

        const decimal precio = 10_000m;
        var servicio = await _api.CrearServicioClaseOkAsync(estudiante, precio, esPaquete: true, cantidadSesionesPaquete: 4);
        await _api.CrearDisponibilidadAsync(estudiante, DiaSemana.Jueves, new TimeOnly(14, 0), new TimeOnly(18, 0));

        var desde = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var slots = await _api.ListarSlotsDisponiblesAsync(estudiante.UsuarioId, desde, desde.AddDays(60), duracionMinutos: 60);
        var elegidos = slots.Take(4).Select(s => s.FechaHoraInicio).ToList();

        var trabajo = await _api.ContratarClaseOkAsync(cliente, servicio.Id, elegidos);
        await ApiCliente.AssertStatusAsync(await _api.AceptarTrabajoAsync(estudiante, trabajo.Id), HttpStatusCode.OK);

        var sesiones = await _api.ListarSesionesAsync(estudiante, trabajo.Id);
        var primera = sesiones.OrderBy(s => s.NumeroSesion).First();
        await ApiCliente.AssertStatusAsync(
            await _api.MarcarSesionRealizadaAsync(estudiante, primera.Id), HttpStatusCode.OK);

        var pago = await _api.ObtenerPagoDelTrabajoAsync(cliente, trabajo.Id);
        Assert.Equal("ParcialmenteLiberado", pago.Estado);

        await ApiCliente.AssertStatusAsync(
            await _api.DisputarTrabajoAsync(cliente, trabajo.Id, "El estudiante no está cumpliendo"), HttpStatusCode.OK);

        return (estudiante, cliente, trabajo.Id, pago.Id, precio);
    }

    [Fact]
    public async Task Resolver_a_favor_del_cliente_reembolsa_el_remanente_y_cancela()
    {
        var (_, cliente, trabajoId, pagoId, _) = await ClaseEnDisputaAsync();
        var admin = await _api.AdminAsync();

        await ApiCliente.AssertStatusAsync(
            await _api.ResolverDisputaAsync(admin, trabajoId, "Cliente", "El estudiante no cumplió lo acordado"),
            HttpStatusCode.OK);

        var trabajo = await _api.ObtenerTrabajoAsync(cliente, trabajoId);
        Assert.Equal(EstadoTrabajo.Cancelado, trabajo.Estado);

        var detalle = await _api.ObtenerDetallePagoAsync(cliente, pagoId);
        Assert.Equal("Reembolsado", detalle.Estado);

        // 10.000 con comisión 10%: 9.000 al estudiante + 1.000 de comisión. 1 de 4 sesiones
        // ya liberada (2.250 + 250): el remanente retenido es 7.500, no el total.
        var reembolso = Assert.Single(detalle.Movimientos, m => m.Tipo == "Reembolso");
        Assert.Equal(7_500m, reembolso.Monto);
        Assert.Contains(detalle.Movimientos, m => m.Tipo == "LiberacionEstudiante" && m.Monto == 2_250m);
    }

    [Fact]
    public async Task Resolver_a_favor_del_estudiante_libera_el_remanente_y_completa()
    {
        var (estudiante, cliente, trabajoId, pagoId, _) = await ClaseEnDisputaAsync();
        var admin = await _api.AdminAsync();

        await ApiCliente.AssertStatusAsync(
            await _api.ResolverDisputaAsync(admin, trabajoId, "Estudiante", "El trabajo se hizo como correspondía"),
            HttpStatusCode.OK);

        var trabajo = await _api.ObtenerTrabajoAsync(cliente, trabajoId);
        Assert.Equal(EstadoTrabajo.Completado, trabajo.Estado);

        var detalle = await _api.ObtenerDetallePagoAsync(cliente, pagoId);
        Assert.Equal("Liberado", detalle.Estado);
        Assert.DoesNotContain(detalle.Movimientos, m => m.Tipo == "Reembolso");

        // La disputa se abrió con 1 de 4 sesiones dadas: las 3 restantes quedaban Pendiente
        // con sus turnos agendados. Completar por esta vía no puede dejarlas colgando.
        var sesiones = await _api.ListarSesionesAsync(cliente, trabajoId);
        Assert.All(sesiones.Where(s => s.NumeroSesion > 1), s => Assert.Equal("Cancelada", s.Estado));

        var turnos = await _api.ListarTurnosMiosAsync(estudiante);
        var pendientesOriginales = sesiones.Where(s => s.NumeroSesion > 1).Select(s => s.FechaHoraInicio).ToList();
        Assert.All(turnos.Where(t => pendientesOriginales.Contains(t.FechaHoraInicio)), t => Assert.Equal("Cancelado", t.Estado));
    }

    [Fact]
    public async Task Resolver_sin_ser_admin_da_403()
    {
        var (_, cliente, trabajoId, _, _) = await ClaseEnDisputaAsync();

        await ApiCliente.AssertStatusAsync(
            await _api.ResolverDisputaAsync(cliente, trabajoId, "Cliente", "Intento sin ser admin"),
            HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Resolver_un_trabajo_que_no_esta_en_disputa_da_400()
    {
        var carreraId = await _api.CarreraVerificableAsync();
        var estudiante = await _api.EstudianteVerificadoAsync(carreraId, anioCursado: 2);
        var cliente = await _api.RegistrarClienteAsync();

        var servicio = await _api.CrearServicioClaseOkAsync(
            estudiante, 3_000m, esPaquete: false, cantidadSesionesPaquete: null);
        await _api.CrearDisponibilidadAsync(estudiante, DiaSemana.Viernes, new TimeOnly(10, 0), new TimeOnly(12, 0));

        var desde = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var slots = await _api.ListarSlotsDisponiblesAsync(estudiante.UsuarioId, desde, desde.AddDays(60), duracionMinutos: 60);
        var trabajo = await _api.ContratarClaseOkAsync(cliente, servicio.Id, new List<DateTime> { slots[0].FechaHoraInicio });

        var admin = await _api.AdminAsync();
        await ApiCliente.AssertStatusAsync(
            await _api.ResolverDisputaAsync(admin, trabajo.Id, "Cliente", "No hay disputa abierta"),
            HttpStatusCode.BadRequest);
    }
}
