using System.Net;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Trabajos.Shared;
using Lex.Api.Tests.Infra;

namespace Lex.Api.Tests.Trabajos;

// Bug: GET /api/trabajos no filtraba por el usuario autenticado, así que cualquiera podía
// ver (o pedir explícitamente, vía cliente_id/estudiante_id) los trabajos de otro usuario.
[Collection(ApiCollection.Nombre)]
public class ListarTrabajosFiltradoTests
{
    private readonly ApiCliente _api;

    public ListarTrabajosFiltradoTests(LexApiFactory factory)
    {
        _api = new ApiCliente(factory);
    }

    private async Task<(Actor Estudiante, Actor Cliente, int TrabajoId)> ClaseSueltaContratadaAsync()
    {
        var carreraId = await _api.CarreraVerificableAsync();
        var estudiante = await _api.EstudianteVerificadoAsync(carreraId, anioCursado: 2);
        var cliente = await _api.RegistrarClienteAsync();

        var servicio = await _api.CrearServicioClaseOkAsync(
            estudiante, precio: 4_000m, esPaquete: false, cantidadSesionesPaquete: null);
        await _api.CrearDisponibilidadAsync(estudiante, DiaSemana.Martes, new TimeOnly(10, 0), new TimeOnly(12, 0));

        var desde = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var slots = await _api.ListarSlotsDisponiblesAsync(estudiante.UsuarioId, desde, desde.AddDays(60), duracionMinutos: 60);
        var trabajo = await _api.ContratarClaseOkAsync(cliente, servicio.Id, new List<DateTime> { slots[0].FechaHoraInicio });

        return (estudiante, cliente, trabajo.Id);
    }

    [Fact]
    public async Task Un_usuario_comun_solo_ve_sus_propios_trabajos_e_ignora_filtros_de_otro_usuario()
    {
        var (estudianteA, clienteA, trabajoA) = await ClaseSueltaContratadaAsync();
        var (estudianteB, _, trabajoB) = await ClaseSueltaContratadaAsync();

        // Intenta ver los trabajos del otro estudiante pasando su id por query: no debería
        // tener efecto para un usuario que no es Admin.
        var respuesta = await _api.ListarTrabajosAsync(clienteA, estudianteId: estudianteB.UsuarioId);
        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.OK);
        var trabajos = await ApiCliente.LeerAsync<List<TrabajoResponse>>(respuesta);

        Assert.Contains(trabajos, t => t.Id == trabajoA);
        Assert.DoesNotContain(trabajos, t => t.Id == trabajoB);
        Assert.All(trabajos, t => Assert.True(t.ClienteId == clienteA.UsuarioId || t.EstudianteId == clienteA.UsuarioId));

        // El propio estudiante tampoco ve el trabajo del otro estudiante.
        var respuestaEstudiante = await _api.ListarTrabajosAsync(estudianteA);
        var trabajosEstudiante = await ApiCliente.LeerAsync<List<TrabajoResponse>>(respuestaEstudiante);
        Assert.Contains(trabajosEstudiante, t => t.Id == trabajoA);
        Assert.DoesNotContain(trabajosEstudiante, t => t.Id == trabajoB);
    }

    [Fact]
    public async Task Admin_ve_los_trabajos_de_cualquier_usuario()
    {
        var (_, _, trabajoA) = await ClaseSueltaContratadaAsync();
        var (_, _, trabajoB) = await ClaseSueltaContratadaAsync();

        var admin = await _api.AdminAsync();
        var respuesta = await _api.ListarTrabajosAsync(admin);
        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.OK);
        var trabajos = await ApiCliente.LeerAsync<List<TrabajoResponse>>(respuesta);

        Assert.Contains(trabajos, t => t.Id == trabajoA);
        Assert.Contains(trabajos, t => t.Id == trabajoB);
    }
}
