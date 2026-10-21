using System.Net;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Practicas;
using Lex.Api.Tests.Infra;

namespace Lex.Api.Tests.Practicas;

// Cupo unico por practica y coincidencia del paciente con lo que pide la practica.
[Collection(ApiCollection.Nombre)]
public class InscripcionTests
{
    private readonly ApiCliente _api;

    public InscripcionTests(LexApiFactory factory)
    {
        _api = new ApiCliente(factory);
    }

    private async Task<(Actor Estudiante, PracticaDetalleResponse Practica)> PracticaPublicadaAsync(TipoPaciente tipo)
    {
        var materia = tipo == TipoPaciente.Animal
            ? await _api.MateriaAsync("Veterinaria", "Semiología")
            : await _api.MateriaAsync("Odontología", "Periodoncia");
        var estudiante = await _api.EstudianteVerificadoAsync(materia.CarreraId, anioCursado: 5);
        return (estudiante, await _api.PublicarOkAsync(estudiante, materia.Id, tipo));
    }

    // --- Cupo unico ---------------------------------------------------------------

    [Fact]
    public async Task Segunda_inscripcion_da_400_y_la_practica_sigue_cubierta_por_la_primera()
    {
        var (estudiante, practica) = await PracticaPublicadaAsync(TipoPaciente.Humano);
        var primero = await _api.RegistrarClienteAsync();
        var segundo = await _api.RegistrarClienteAsync();
        var pacientePrimero = await _api.CrearPacienteAsync(primero, TipoPaciente.Humano);
        var pacienteSegundo = await _api.CrearPacienteAsync(segundo, TipoPaciente.Humano);

        await ApiCliente.AssertStatusAsync(
            await _api.InscribirAsync(primero, practica.Practica.Id, pacientePrimero.Id), HttpStatusCode.Created);
        var segunda = await _api.InscribirAsync(segundo, practica.Practica.Id, pacienteSegundo.Id);

        await ApiCliente.AssertStatusAsync(segunda, HttpStatusCode.BadRequest);
        var mias = await ApiCliente.LeerAsync<List<PracticaDetalleResponse>>(
            await _api.GetAsync("/api/practicas/mias", estudiante.Token));
        var actual = mias.Single(p => p.Practica.Id == practica.Practica.Id);
        Assert.Equal(EstadoPracticaClinica.Cubierta, actual.Practica.Estado);
        Assert.Equal(pacientePrimero.Id, actual.Inscripcion!.Paciente.Id);
    }

    // La garantia del cupo es el indice unico parcial, no el chequeo del service: con
    // inscripciones simultaneas las dos leen Publicada y la base deja pasar una sola.
    [Fact]
    public async Task Inscripciones_simultaneas_dejan_pasar_exactamente_una()
    {
        var (_, practica) = await PracticaPublicadaAsync(TipoPaciente.Humano);
        var clientes = new List<(Actor Cliente, int PacienteId)>();
        for (var i = 0; i < 5; i++)
        {
            var cliente = await _api.RegistrarClienteAsync();
            clientes.Add((cliente, (await _api.CrearPacienteAsync(cliente, TipoPaciente.Humano)).Id));
        }

        var respuestas = await Task.WhenAll(
            clientes.Select(c => _api.InscribirAsync(c.Cliente, practica.Practica.Id, c.PacienteId)));

        Assert.Equal(1, respuestas.Count(r => r.StatusCode == HttpStatusCode.Created));
        Assert.All(respuestas.Where(r => r.StatusCode != HttpStatusCode.Created),
            r => Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode));
    }

    [Fact]
    public async Task Cancelar_la_inscripcion_devuelve_la_practica_a_publicada_y_libera_el_cupo()
    {
        var (_, practica) = await PracticaPublicadaAsync(TipoPaciente.Humano);
        var primero = await _api.RegistrarClienteAsync();
        var segundo = await _api.RegistrarClienteAsync();
        var pacientePrimero = await _api.CrearPacienteAsync(primero, TipoPaciente.Humano);
        var pacienteSegundo = await _api.CrearPacienteAsync(segundo, TipoPaciente.Humano);

        var inscripcion = await ApiCliente.LeerAsync<InscripcionResponse>(
            await _api.InscribirAsync(primero, practica.Practica.Id, pacientePrimero.Id), HttpStatusCode.Created);
        var cancelada = await ApiCliente.LeerAsync<InscripcionResponse>(
            await _api.PostAsync($"/api/inscripciones/{inscripcion.Id}/cancelar", primero.Token, new { motivo = "No llego." }));

        Assert.Equal(EstadoInscripcionPractica.Cancelada, cancelada.Estado);
        Assert.Equal(EstadoPracticaClinica.Publicada, cancelada.Practica.Estado);
        await ApiCliente.AssertStatusAsync(
            await _api.InscribirAsync(segundo, practica.Practica.Id, pacienteSegundo.Id), HttpStatusCode.Created);
    }

    // El estudiante "rechaza" un paciente que no sirve cancelando su inscripcion.
    [Fact]
    public async Task El_estudiante_puede_cancelar_la_inscripcion_de_su_practica()
    {
        var (estudiante, practica) = await PracticaPublicadaAsync(TipoPaciente.Humano);
        var cliente = await _api.RegistrarClienteAsync();
        var paciente = await _api.CrearPacienteAsync(cliente, TipoPaciente.Humano);
        var inscripcion = await ApiCliente.LeerAsync<InscripcionResponse>(
            await _api.InscribirAsync(cliente, practica.Practica.Id, paciente.Id), HttpStatusCode.Created);

        var cancelada = await ApiCliente.LeerAsync<InscripcionResponse>(
            await _api.PostAsync($"/api/inscripciones/{inscripcion.Id}/cancelar", estudiante.Token, new { }));

        Assert.Equal(EstadoPracticaClinica.Publicada, cancelada.Practica.Estado);
    }

    // --- Tipo de paciente y pertenencia --------------------------------------------

    [Fact]
    public async Task Paciente_animal_en_practica_que_requiere_humano_da_400()
    {
        var (_, practica) = await PracticaPublicadaAsync(TipoPaciente.Humano);
        var cliente = await _api.RegistrarClienteAsync();
        var perro = await _api.CrearPacienteAsync(cliente, TipoPaciente.Animal, "Firulais");

        var respuesta = await _api.InscribirAsync(cliente, practica.Practica.Id, perro.Id);

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Paciente_humano_en_practica_que_requiere_animal_da_400()
    {
        var (_, practica) = await PracticaPublicadaAsync(TipoPaciente.Animal);
        var cliente = await _api.RegistrarClienteAsync();
        var persona = await _api.CrearPacienteAsync(cliente, TipoPaciente.Humano);

        var respuesta = await _api.InscribirAsync(cliente, practica.Practica.Id, persona.Id);

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Paciente_animal_en_practica_que_requiere_animal_se_inscribe()
    {
        var (_, practica) = await PracticaPublicadaAsync(TipoPaciente.Animal);
        var cliente = await _api.RegistrarClienteAsync();
        var perro = await _api.CrearPacienteAsync(cliente, TipoPaciente.Animal, "Firulais");

        var inscripcion = await ApiCliente.LeerAsync<InscripcionResponse>(
            await _api.InscribirAsync(cliente, practica.Practica.Id, perro.Id), HttpStatusCode.Created);

        Assert.Equal(EstadoInscripcionPractica.Inscripta, inscripcion.Estado);
        Assert.Equal(EstadoPracticaClinica.Cubierta, inscripcion.Practica.Estado);
        Assert.NotNull(inscripcion.FechaAceptacionRequisitos);
    }

    // Un paciente ajeno se responde igual que uno inexistente.
    [Fact]
    public async Task Paciente_de_otro_cliente_da_404()
    {
        var (_, practica) = await PracticaPublicadaAsync(TipoPaciente.Humano);
        var duenio = await _api.RegistrarClienteAsync();
        var otro = await _api.RegistrarClienteAsync();
        var pacienteAjeno = await _api.CrearPacienteAsync(duenio, TipoPaciente.Humano);

        var respuesta = await _api.InscribirAsync(otro, practica.Practica.Id, pacienteAjeno.Id);

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Inscribirse_sin_aceptar_los_requisitos_da_400()
    {
        var (_, practica) = await PracticaPublicadaAsync(TipoPaciente.Humano);
        var cliente = await _api.RegistrarClienteAsync();
        var paciente = await _api.CrearPacienteAsync(cliente, TipoPaciente.Humano);

        var respuesta = await _api.InscribirAsync(cliente, practica.Practica.Id, paciente.Id, requisitosAceptados: false);

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task El_estudiante_no_puede_inscribirse_en_su_propia_practica()
    {
        var (estudiante, practica) = await PracticaPublicadaAsync(TipoPaciente.Humano);
        // El estudiante tambien es Cliente Particular: tiene perfil de cliente y pacientes.
        var paciente = await _api.CrearPacienteAsync(estudiante, TipoPaciente.Humano);

        var respuesta = await _api.InscribirAsync(estudiante, practica.Practica.Id, paciente.Id);

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.BadRequest);
    }
}
