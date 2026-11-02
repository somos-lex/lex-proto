using System.Net;
using Lex.Api.Domain.Enums;
using Lex.Api.Tests.Infra;

namespace Lex.Api.Tests.Trabajos;

// Bug: cancelar un Trabajo directamente (no vía POST /api/turnos/{id}/cancelar) nunca
// tocaba sus Turno/Sesion, así que quedaban Reservado/Confirmado bloqueando la agenda
// del estudiante para un trabajo que ya no existe.
[Collection(ApiCollection.Nombre)]
public class CancelarTrabajoLiberaTurnosTests
{
    private readonly ApiCliente _api;

    public CancelarTrabajoLiberaTurnosTests(LexApiFactory factory)
    {
        _api = new ApiCliente(factory);
    }

    [Fact]
    public async Task Cancelar_el_trabajo_directamente_libera_sus_turnos_pendientes()
    {
        var carreraId = await _api.CarreraVerificableAsync();
        var estudiante = await _api.EstudianteVerificadoAsync(carreraId, anioCursado: 3);
        var cliente = await _api.RegistrarClienteAsync();

        var servicio = await _api.CrearServicioClaseOkAsync(
            estudiante, precio: 6_000m, esPaquete: true, cantidadSesionesPaquete: 2);
        await _api.CrearDisponibilidadAsync(estudiante, DiaSemana.Lunes, new TimeOnly(14, 0), new TimeOnly(18, 0));

        var desde = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var hasta = desde.AddDays(60);
        var slotsAntes = await _api.ListarSlotsDisponiblesAsync(estudiante.UsuarioId, desde, hasta, duracionMinutos: 60);
        var elegidos = slotsAntes.Take(2).Select(s => s.FechaHoraInicio).ToList();

        var trabajo = await _api.ContratarClaseOkAsync(cliente, servicio.Id, elegidos);
        await ApiCliente.AssertStatusAsync(await _api.AceptarTrabajoAsync(estudiante, trabajo.Id), HttpStatusCode.OK);

        // Antes de cancelar, esos horarios ya no figuran como libres: están tomados.
        var slotsOcupados = await _api.ListarSlotsDisponiblesAsync(estudiante.UsuarioId, desde, hasta, duracionMinutos: 60);
        Assert.DoesNotContain(slotsOcupados, s => elegidos.Contains(s.FechaHoraInicio));

        await ApiCliente.AssertStatusAsync(
            await _api.CancelarTrabajoAsync(cliente, trabajo.Id, "Ya no lo necesito"), HttpStatusCode.OK);

        var trabajoCancelado = await _api.ObtenerTrabajoAsync(cliente, trabajo.Id);
        Assert.Equal(EstadoTrabajo.Cancelado, trabajoCancelado.Estado);

        var sesiones = await _api.ListarSesionesAsync(cliente, trabajo.Id);
        Assert.All(sesiones, s => Assert.Equal("Cancelada", s.Estado));

        var turnos = await _api.ListarTurnosMiosAsync(estudiante);
        var turnosDelTrabajo = turnos.Where(t => elegidos.Contains(t.FechaHoraInicio)).ToList();
        Assert.Equal(2, turnosDelTrabajo.Count);
        Assert.All(turnosDelTrabajo, t => Assert.Equal("Cancelado", t.Estado));

        // La agenda vuelve a ofrecer esos horarios: el trabajo muerto ya no la bloquea.
        var slotsDespues = await _api.ListarSlotsDisponiblesAsync(estudiante.UsuarioId, desde, hasta, duracionMinutos: 60);
        Assert.All(elegidos, slot => Assert.Contains(slotsDespues, s => s.FechaHoraInicio == slot));
    }
}
