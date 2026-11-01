using System.Net;
using Lex.Api.Domain.Enums;
using Lex.Api.Tests.Infra;

namespace Lex.Api.Tests.Trabajos;

// Bug: POST /api/trabajos/{id}/cancelar sobre una Clase con el pago ParcialmenteLiberado
// devolvía 500. Causa raíz: ReembolsarPagoAsync rechazaba ese estado con
// InvalidOperationException, y ExceptionHandlingMiddleware no sabe traducir esa excepción
// (cae al default genérico de 500). El fix fue el mismo que el de reembolso parcial
// (PagoService.ReembolsarPagoAsync), así que este test no trae su propio commit `fix:` —
// solo reproduce el camino HTTP completo que antes rompía.
[Collection(ApiCollection.Nombre)]
public class CancelarClaseConPagoParcialTests
{
    private readonly ApiCliente _api;

    public CancelarClaseConPagoParcialTests(LexApiFactory factory)
    {
        _api = new ApiCliente(factory);
    }

    [Fact]
    public async Task Cancelar_una_clase_con_pago_parcialmente_liberado_responde_200_no_500()
    {
        var carreraId = await _api.CarreraVerificableAsync();
        var estudiante = await _api.EstudianteVerificadoAsync(carreraId, anioCursado: 3);
        var cliente = await _api.RegistrarClienteAsync();

        var servicio = await _api.CrearServicioClaseOkAsync(
            estudiante, precio: 5_000m, esPaquete: true, cantidadSesionesPaquete: 3);
        await _api.CrearDisponibilidadAsync(estudiante, DiaSemana.Lunes, new TimeOnly(14, 0), new TimeOnly(17, 0));

        var desde = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var slots = await _api.ListarSlotsDisponiblesAsync(estudiante.UsuarioId, desde, desde.AddDays(60), duracionMinutos: 60);
        var elegidos = slots.Take(3).Select(s => s.FechaHoraInicio).ToList();

        var trabajo = await _api.ContratarClaseOkAsync(cliente, servicio.Id, elegidos);
        await ApiCliente.AssertStatusAsync(await _api.AceptarTrabajoAsync(estudiante, trabajo.Id), HttpStatusCode.OK);

        var sesiones = await _api.ListarSesionesAsync(estudiante, trabajo.Id);
        var primera = sesiones.OrderBy(s => s.NumeroSesion).First();
        await ApiCliente.AssertStatusAsync(
            await _api.MarcarSesionRealizadaAsync(estudiante, primera.Id), HttpStatusCode.OK);

        var pago = await _api.ObtenerPagoDelTrabajoAsync(cliente, trabajo.Id);
        Assert.Equal("ParcialmenteLiberado", pago.Estado);

        var respuesta = await _api.CancelarTrabajoAsync(cliente, trabajo.Id, "Cambié de planes");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode); // antes: 500 Internal Server Error
        var body = await ApiCliente.LeerAsync<Lex.Api.Features.Trabajos.Shared.TrabajoResponse>(respuesta);
        Assert.Equal(EstadoTrabajo.Cancelado, body.Estado);
    }
}
