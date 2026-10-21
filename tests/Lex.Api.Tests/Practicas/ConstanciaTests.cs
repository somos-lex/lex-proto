using System.Net;
using System.Text.Json;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Practicas;
using Lex.Api.Tests.Infra;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Tests.Practicas;

// Marcar asistencia emite la constancia en los DOS caminos (asistio / no asistio) y pasa la
// practica a Realizada. Solo a partir de FechaHoraInicio: una constancia previa a la
// practica no sirve como evidencia ante la catedra.
[Collection(ApiCollection.Nombre)]
public class ConstanciaTests
{
    private const string NombrePaciente = "Paciente Confidencial Pérez";

    private readonly LexApiFactory _factory;
    private readonly ApiCliente _api;

    public ConstanciaTests(LexApiFactory factory)
    {
        _factory = factory;
        _api = new ApiCliente(factory);
    }

    // Una practica Cubierta. Con yaEmpezo, su inicio se lleva al pasado directo en la base:
    // la API no deja publicar en el pasado, y esperar no es opcion.
    private async Task<(Actor Estudiante, Actor Cliente, int PracticaId)> PracticaCubiertaAsync(bool yaEmpezo)
    {
        var materia = await _api.MateriaAsync("Odontología", "Clínica Integral Adulto");
        var estudiante = await _api.EstudianteVerificadoAsync(materia.CarreraId, anioCursado: 5);
        var practica = await _api.PublicarOkAsync(estudiante, materia.Id, TipoPaciente.Humano);
        var cliente = await _api.RegistrarClienteAsync();
        var paciente = await _api.CrearPacienteAsync(cliente, TipoPaciente.Humano, NombrePaciente);
        await ApiCliente.AssertStatusAsync(
            await _api.InscribirAsync(cliente, practica.Practica.Id, paciente.Id), HttpStatusCode.Created);

        if (yaEmpezo)
        {
            var id = practica.Practica.Id;
            await _factory.ConDbAsync(db => db.PracticasClinicas
                .Where(p => p.Id == id)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.FechaHoraInicio, DateTime.UtcNow.AddMinutes(-10))));
        }

        return (estudiante, cliente, practica.Practica.Id);
    }

    [Theory]
    [InlineData(true, EstadoInscripcionPractica.Asistio)]
    [InlineData(false, EstadoInscripcionPractica.NoAsistio)]
    public async Task Registrar_asistencia_emite_constancia_y_realiza_la_practica(
        bool asistio, EstadoInscripcionPractica estadoInscripcionEsperado)
    {
        var (estudiante, cliente, practicaId) = await PracticaCubiertaAsync(yaEmpezo: true);

        var constancia = await ApiCliente.LeerAsync<ConstanciaResponse>(
            await _api.RegistrarAsistenciaAsync(estudiante, practicaId, asistio));

        Assert.Equal(asistio, constancia.AsistenciaRegistrada);
        Assert.Matches("^LEX-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$", constancia.Codigo);
        Assert.Equal("Clínica Integral Adulto", constancia.NombreMateria);
        Assert.Equal("Odontología", constancia.NombreCarrera);
        Assert.Equal(NombrePaciente, constancia.NombrePaciente);

        var detalle = await ApiCliente.LeerAsync<PracticaDetalleResponse>(
            await _api.GetAsync($"/api/practicas/{practicaId}", estudiante.Token));
        Assert.Equal(EstadoPracticaClinica.Realizada, detalle.Practica.Estado);
        Assert.Equal(estadoInscripcionEsperado, detalle.Inscripcion!.Estado);
        Assert.Equal(constancia.Codigo, detalle.CodigoConstancia);

        // El cliente de la inscripcion tambien ve la constancia completa.
        var delCliente = await ApiCliente.LeerAsync<ConstanciaResponse>(
            await _api.GetAsync($"/api/practicas/{practicaId}/constancia", cliente.Token));
        Assert.Equal(constancia.Codigo, delCliente.Codigo);
    }

    [Fact]
    public async Task Registrar_asistencia_antes_del_inicio_da_400_y_no_emite_constancia()
    {
        var (estudiante, _, practicaId) = await PracticaCubiertaAsync(yaEmpezo: false);

        var respuesta = await _api.RegistrarAsistenciaAsync(estudiante, practicaId, asistio: true);

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.BadRequest);
        await ApiCliente.AssertStatusAsync(
            await _api.GetAsync($"/api/practicas/{practicaId}/constancia", estudiante.Token), HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Registrar_asistencia_dos_veces_da_400()
    {
        var (estudiante, _, practicaId) = await PracticaCubiertaAsync(yaEmpezo: true);

        await ApiCliente.AssertStatusAsync(
            await _api.RegistrarAsistenciaAsync(estudiante, practicaId, asistio: true), HttpStatusCode.OK);
        var segunda = await _api.RegistrarAsistenciaAsync(estudiante, practicaId, asistio: false);

        await ApiCliente.AssertStatusAsync(segunda, HttpStatusCode.BadRequest);
    }

    // Un body sin 'asistio' no puede emitir en silencio una constancia de inasistencia.
    [Fact]
    public async Task Registrar_asistencia_sin_indicar_si_asistio_da_400()
    {
        var (estudiante, _, practicaId) = await PracticaCubiertaAsync(yaEmpezo: true);

        var respuesta = await _api.PostAsync($"/api/practicas/{practicaId}/asistencia", estudiante.Token,
            new { observaciones = "Sin el campo asistio." });

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Solo_el_estudiante_de_la_practica_registra_asistencia()
    {
        var (_, cliente, practicaId) = await PracticaCubiertaAsync(yaEmpezo: true);
        var materia = await _api.MateriaAsync("Odontología", "Clínica Integral Adulto");
        var otroEstudiante = await _api.EstudianteVerificadoAsync(materia.CarreraId, anioCursado: 5);

        await ApiCliente.AssertStatusAsync(
            await _api.RegistrarAsistenciaAsync(otroEstudiante, practicaId, asistio: true), HttpStatusCode.NotFound);
        // El cliente ni siquiera tiene el rol: el endpoint es de Estudiante.
        await ApiCliente.AssertStatusAsync(
            await _api.RegistrarAsistenciaAsync(cliente, practicaId, asistio: true), HttpStatusCode.Forbidden);
    }

    // La catedra verifica por codigo, sin login, y sin ver NINGUN dato del paciente.
    [Fact]
    public async Task Verificacion_publica_por_codigo_no_expone_datos_del_paciente()
    {
        var (estudiante, _, practicaId) = await PracticaCubiertaAsync(yaEmpezo: true);
        var constancia = await ApiCliente.LeerAsync<ConstanciaResponse>(
            await _api.RegistrarAsistenciaAsync(estudiante, practicaId, asistio: false));

        // En minusculas: el codigo se normaliza al buscar.
        var respuesta = await _api.GetAsync($"/api/constancias/{constancia.Codigo.ToLowerInvariant()}");
        var cuerpo = await respuesta.Content.ReadAsStringAsync();
        var publica = await ApiCliente.LeerAsync<ConstanciaPublicaResponse>(respuesta);

        Assert.Equal(constancia.Codigo, publica.Codigo);
        Assert.False(publica.AsistenciaRegistrada);
        Assert.DoesNotContain(NombrePaciente, cuerpo);
        using var json = JsonDocument.Parse(cuerpo);
        Assert.DoesNotContain(json.RootElement.EnumerateObject(),
            p => p.Name.Contains("paciente", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Codigo_inexistente_da_404()
    {
        await ApiCliente.AssertStatusAsync(
            await _api.GetAsync("/api/constancias/LEX-0000-0000"), HttpStatusCode.NotFound);
    }
}
