using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Lex.Api.Features.Auth;
using Lex.Api.Features.Materias;
using Lex.Api.Features.Pacientes;
using Lex.Api.Features.Practicas;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Tests.Infra;

// Actores de un escenario: el token y el id con el que la API los conoce.
public record Actor(int UsuarioId, string Token);

// Atajos HTTP sobre la API real. Los escenarios se arman por los mismos endpoints que usa
// el frontend (registro, activacion de estudiante, verificacion del admin), no escribiendo
// en la base: asi un test de habilitacion ejercita tambien la bandeja de verificacion.
public class ApiCliente
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly HttpClient _http;

    public ApiCliente(LexApiFactory factory)
    {
        _http = factory.CreateClient();
    }

    // --- HTTP crudo ---------------------------------------------------------------

    public async Task<HttpResponseMessage> EnviarAsync(HttpMethod metodo, string url, string? token = null, object? body = null)
    {
        using var request = new HttpRequestMessage(metodo, url);
        if (token is not null)
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (body is not null)
            request.Content = JsonContent.Create(body, options: Json);
        return await _http.SendAsync(request);
    }

    public Task<HttpResponseMessage> PostAsync(string url, string? token = null, object? body = null) =>
        EnviarAsync(HttpMethod.Post, url, token, body);

    public Task<HttpResponseMessage> GetAsync(string url, string? token = null) =>
        EnviarAsync(HttpMethod.Get, url, token);

    public static async Task<T> LeerAsync<T>(HttpResponseMessage response, HttpStatusCode esperado = HttpStatusCode.OK)
    {
        var cuerpo = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == esperado,
            $"Se esperaba {(int)esperado} y vino {(int)response.StatusCode}: {cuerpo}");
        return JsonSerializer.Deserialize<T>(cuerpo, Json)!;
    }

    public static async Task AssertStatusAsync(HttpResponseMessage response, HttpStatusCode esperado)
    {
        var cuerpo = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == esperado,
            $"Se esperaba {(int)esperado} y vino {(int)response.StatusCode}: {cuerpo}");
    }

    // --- Identidad ----------------------------------------------------------------

    public async Task<Actor> LoginAsync(string email, string password)
    {
        var auth = await LeerAsync<AuthResponse>(
            await PostAsync("/api/auth/login", body: new { email, password }));
        return new Actor(auth.Usuario.UsuarioId, auth.Token);
    }

    public Task<Actor> AdminAsync() => LoginAsync(LexApiFactory.AdminEmail, LexApiFactory.AdminPassword);

    public async Task<Actor> RegistrarClienteAsync(string nombre = "Cliente de Prueba")
    {
        var email = $"{Guid.NewGuid():N}@tests.lex";
        const string password = "Tests1234";

        var registro = await PostAsync("/api/auth/register", body: new
        {
            email,
            password,
            nombreCompleto = nombre,
            tipoRegistro = "ClienteParticular"
        });
        await AssertStatusAsync(registro, HttpStatusCode.Created);

        return await LoginAsync(email, password);
    }

    // Cliente Particular que activa su perfil de estudiante. El vinculo con la carrera nace
    // Pendiente. Vuelve a loguear porque el rol Estudiante recien entra en un token nuevo.
    public async Task<(Actor Estudiante, string Email)> RegistrarEstudianteAsync(int carreraId, int anioCursado)
    {
        var email = $"{Guid.NewGuid():N}@tests.lex";
        const string password = "Tests1234";

        await AssertStatusAsync(await PostAsync("/api/auth/register", body: new
        {
            email,
            password,
            nombreCompleto = "Estudiante de Prueba",
            tipoRegistro = "ClienteParticular"
        }), HttpStatusCode.Created);

        var cliente = await LoginAsync(email, password);
        await AssertStatusAsync(await PostAsync("/api/perfil/activar-estudiante", cliente.Token, new
        {
            carreraId,
            bio = "Estudiante de tests",
            anioCursado
        }), HttpStatusCode.OK);

        return (await LoginAsync(email, password), email);
    }

    public async Task AprobarAsync(int estudianteId, int carreraId)
    {
        var admin = await AdminAsync();
        await AssertStatusAsync(
            await PostAsync($"/api/admin/verificaciones/{estudianteId}/{carreraId}/aprobar", admin.Token, new { }),
            HttpStatusCode.OK);
    }

    public async Task<Actor> EstudianteVerificadoAsync(int carreraId, int anioCursado)
    {
        var (estudiante, _) = await RegistrarEstudianteAsync(carreraId, anioCursado);
        await AprobarAsync(estudiante.UsuarioId, carreraId);
        return estudiante;
    }

    // --- Catalogo -----------------------------------------------------------------

    public async Task<MateriaResponse> MateriaAsync(string carrera, string materia)
    {
        var materias = await LeerAsync<List<MateriaResponse>>(await GetAsync("/api/materias"));
        return materias.Single(m => m.CarreraNombre == carrera && m.Nombre == materia);
    }

    // --- Pacientes ----------------------------------------------------------------

    public async Task<PacienteResponse> CrearPacienteAsync(Actor cliente, TipoPaciente tipo, string nombre = "Paciente de Prueba")
    {
        var body = tipo == TipoPaciente.Animal
            ? (object)new { tipo = "Animal", nombreCompleto = nombre, esTitular = false, especie = "Perro" }
            : new { tipo = "Humano", nombreCompleto = nombre, esTitular = true };

        return await LeerAsync<PacienteResponse>(
            await PostAsync("/api/pacientes", cliente.Token, body), HttpStatusCode.Created);
    }

    // --- Practicas ----------------------------------------------------------------

    public Task<HttpResponseMessage> PublicarAsync(
        Actor estudiante, int materiaId, TipoPaciente tipo, DateTime? inicio = null, int duracionMinutos = 90) =>
        PostAsync("/api/practicas", estudiante.Token, new
        {
            materiaId,
            fechaHoraInicio = inicio ?? DateTime.UtcNow.AddDays(7),
            duracionMinutos,
            lugar = "Clínica de la Facultad, box 3",
            tipoPacienteRequerido = tipo.ToString(),
            requisitosPrevios = "Traer estudios previos si los tiene."
        });

    public async Task<PracticaDetalleResponse> PublicarOkAsync(Actor estudiante, int materiaId, TipoPaciente tipo) =>
        await LeerAsync<PracticaDetalleResponse>(await PublicarAsync(estudiante, materiaId, tipo), HttpStatusCode.Created);

    public Task<HttpResponseMessage> InscribirAsync(Actor cliente, int practicaId, int pacienteId, bool requisitosAceptados = true) =>
        PostAsync($"/api/practicas/{practicaId}/inscripcion", cliente.Token, new { pacienteId, requisitosAceptados });

    public Task<HttpResponseMessage> RegistrarAsistenciaAsync(Actor estudiante, int practicaId, bool asistio) =>
        PostAsync($"/api/practicas/{practicaId}/asistencia", estudiante.Token,
            new { asistio, observaciones = "Registrado desde los tests." });
}
