using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Lex.Api.Features.Auth;
using Lex.Api.Features.Disponibilidad;
using Lex.Api.Features.Materias;
using Lex.Api.Features.Pacientes;
using Lex.Api.Features.Pagos;
using Lex.Api.Features.Practicas;
using Lex.Api.Features.Servicios.Clase;
using Lex.Api.Features.Sesiones;
using Lex.Api.Features.Trabajos.Clase;
using Lex.Api.Features.Trabajos.Shared;
using Lex.Api.Features.Turnos;
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

    public const string ComprobantePorDefecto = "https://drive.google.com/file/d/constancia-alumno-regular-tests/view";

    // Cliente Particular que activa su perfil de estudiante. El vinculo con la carrera nace
    // Pendiente. Vuelve a loguear porque el rol Estudiante recien entra en un token nuevo.
    //
    // Por defecto carga un comprobante, como en el camino normal: aprobar exige comprobante u
    // observaciones. Pasar comprobante: null para el estudiante que se activa sin link.
    public async Task<(Actor Estudiante, string Email)> RegistrarEstudianteAsync(
        int carreraId, int anioCursado, string? comprobante = ComprobantePorDefecto)
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
            anioCursado,
            documentoComprobante = comprobante
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

    // --- Servicios ----------------------------------------------------------------

    public static async Task<JsonElement> LeerJsonAsync(HttpResponseMessage response, HttpStatusCode esperado = HttpStatusCode.OK)
    {
        var cuerpo = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == esperado,
            $"Se esperaba {(int)esperado} y vino {(int)response.StatusCode}: {cuerpo}");
        return JsonDocument.Parse(cuerpo).RootElement.Clone();
    }

    public async Task<JsonElement> PublicarProyectoCerradoAsync(
        Actor estudiante, int catalogoServicioId, int plazoEntregaDias = 15) =>
        await LeerJsonAsync(await PostAsync("/api/servicios/proyecto-cerrado", estudiante.Token, new
        {
            titulo = "Proyecto de prueba",
            descripcion = "Servicio de proyecto cerrado creado desde los tests.",
            precio = 50000m,
            catalogoServicioId,
            plazoEntregaDias,
            revisionesIncluidas = 2,
            formatoEntrega = "Archivos"
        }), HttpStatusCode.Created);

    public async Task<JsonElement> PublicarClaseAsync(
        Actor estudiante, string materia = "Álgebra", string modalidad = "Online",
        int duracionMinutosSesion = 60, bool esPaquete = false, int? cantidadSesionesPaquete = null) =>
        await LeerJsonAsync(await PostAsync("/api/servicios/clase", estudiante.Token, new
        {
            titulo = "Clase de prueba",
            descripcion = "Clase creada desde los tests.",
            precio = 8000m,
            materia,
            nivel = "Universitario",
            modalidad,
            duracionMinutosSesion,
            esPaquete,
            cantidadSesionesPaquete
        }), HttpStatusCode.Created);

    public async Task<JsonElement> PublicarSaludAsync(
        Actor estudiante, int catalogoServicioId, int supervisorId,
        string modalidad = "Consultorio", int duracionMinutosSesion = 45) =>
        await LeerJsonAsync(await PostAsync("/api/servicios/salud", estudiante.Token, new
        {
            titulo = "Servicio de salud de prueba",
            descripcion = "Servicio de salud creado desde los tests.",
            precio = 12000m,
            catalogoServicioId,
            supervisorId,
            modalidad,
            duracionMinutosSesion
        }), HttpStatusCode.Created);

    // --- Clase: publicacion, disponibilidad, contratacion y sesiones ---------------

    // Cualquier carrera verificada sirve para activar un estudiante: Clase no usa catalogo
    // cerrado. Se resuelve desde una materia semilla en vez de hardcodear un id, porque los
    // ids de carrera son identity y no estan fijos entre corridas.
    public async Task<int> CarreraVerificableAsync() =>
        (await MateriaAsync("Odontología", "Práctica Clínica Preventiva")).CarreraId;

    public Task<HttpResponseMessage> CrearServicioClaseAsync(
        Actor estudiante, string titulo, decimal precio, bool esPaquete, int? cantidadSesionesPaquete,
        int duracionMinutosSesion = 60) =>
        PostAsync("/api/servicios/clase", estudiante.Token, new
        {
            titulo,
            descripcion = "Servicio de prueba creado por los tests de integración.",
            precio,
            materia = "Álgebra",
            nivel = "Universitario",
            modalidad = "Online",
            duracionMinutosSesion,
            esPaquete,
            cantidadSesionesPaquete
        });

    public async Task<ServicioClaseResponse> CrearServicioClaseOkAsync(
        Actor estudiante, decimal precio, bool esPaquete, int? cantidadSesionesPaquete,
        int duracionMinutosSesion = 60, string titulo = "Clases de prueba") =>
        await LeerAsync<ServicioClaseResponse>(
            await CrearServicioClaseAsync(estudiante, titulo, precio, esPaquete, cantidadSesionesPaquete, duracionMinutosSesion),
            HttpStatusCode.Created);

    public async Task<BloqueDisponibilidadResponse> CrearDisponibilidadAsync(
        Actor estudiante, DiaSemana dia, TimeOnly inicio, TimeOnly fin) =>
        await LeerAsync<BloqueDisponibilidadResponse>(
            await PostAsync("/api/disponibilidad", estudiante.Token, new CrearBloqueDisponibilidadRequest(dia, inicio, fin)),
            HttpStatusCode.Created);

    public async Task<List<SlotDisponibleResponse>> ListarSlotsDisponiblesAsync(
        int estudianteId, DateOnly desde, DateOnly hasta, int duracionMinutos) =>
        await LeerAsync<List<SlotDisponibleResponse>>(await GetAsync(
            $"/api/turnos/disponibles/estudiante/{estudianteId}?desde={desde:yyyy-MM-dd}&hasta={hasta:yyyy-MM-dd}&duracion_minutos={duracionMinutos}"));

    public Task<HttpResponseMessage> ContratarClaseAsync(Actor cliente, int servicioId, List<DateTime> slotsElegidos) =>
        PostAsync("/api/trabajos/clase", cliente.Token, new { servicioId, slotsElegidos });

    public async Task<TrabajoClaseResponse> ContratarClaseOkAsync(Actor cliente, int servicioId, List<DateTime> slotsElegidos) =>
        await LeerAsync<TrabajoClaseResponse>(
            await ContratarClaseAsync(cliente, servicioId, slotsElegidos), HttpStatusCode.Created);

    public Task<HttpResponseMessage> AceptarTrabajoAsync(Actor estudiante, int idTrabajo) =>
        PostAsync($"/api/trabajos/{idTrabajo}/aceptar", estudiante.Token);

    public async Task<List<SesionResponse>> ListarSesionesAsync(Actor actor, int idTrabajo) =>
        await LeerAsync<List<SesionResponse>>(
            await GetAsync($"/api/trabajos/{idTrabajo}/sesiones", actor.Token));

    public Task<HttpResponseMessage> MarcarSesionRealizadaAsync(Actor estudiante, int idSesion) =>
        PostAsync($"/api/sesiones/{idSesion}/realizar", estudiante.Token, new { });

    // --- Trabajos: transiciones y consultas -----------------------------------------

    public Task<HttpResponseMessage> CancelarTrabajoAsync(Actor actor, int idTrabajo, string? motivo = null) =>
        PostAsync($"/api/trabajos/{idTrabajo}/cancelar", actor.Token, new { motivo });

    public Task<HttpResponseMessage> DisputarTrabajoAsync(Actor actor, int idTrabajo, string motivo) =>
        PostAsync($"/api/trabajos/{idTrabajo}/disputar", actor.Token, new { motivo });

    public Task<HttpResponseMessage> ListarTrabajosAsync(
        Actor actor, int? clienteId = null, int? estudianteId = null) =>
        GetAsync("/api/trabajos" + ArmarQuery(
            ("cliente_id", clienteId?.ToString()), ("estudiante_id", estudianteId?.ToString())), actor.Token);

    public async Task<TrabajoDetalleResponse> ObtenerTrabajoAsync(Actor actor, int idTrabajo) =>
        await LeerAsync<TrabajoDetalleResponse>(await GetAsync($"/api/trabajos/{idTrabajo}", actor.Token));

    private static string ArmarQuery(params (string Nombre, string? Valor)[] parametros)
    {
        var presentes = parametros.Where(p => p.Valor is not null).Select(p => $"{p.Nombre}={p.Valor}").ToList();
        return presentes.Count == 0 ? "" : "?" + string.Join("&", presentes);
    }

    // --- Turnos ----------------------------------------------------------------------

    public Task<HttpResponseMessage> CancelarTurnoAsync(Actor actor, int idTurno, string? motivo = null) =>
        PostAsync($"/api/turnos/{idTurno}/cancelar", actor.Token, new { motivo });

    public async Task<List<TurnoResponse>> ListarTurnosMiosAsync(Actor actor, EstadoTurno? estado = null) =>
        await LeerAsync<List<TurnoResponse>>(
            await GetAsync("/api/turnos/mios" + (estado is null ? "" : $"?estado={estado}"), actor.Token));

    // --- Pagos -------------------------------------------------------------------------

    public async Task<PagoResumenResponse> ObtenerPagoDelTrabajoAsync(Actor actor, int idTrabajo)
    {
        var pagos = await LeerAsync<List<PagoResumenResponse>>(await GetAsync("/api/pagos/mios", actor.Token));
        return pagos.Single(p => p.TrabajoId == idTrabajo);
    }

    public async Task<PagoDetalleResponse> ObtenerDetallePagoAsync(Actor actor, int idPago) =>
        await LeerAsync<PagoDetalleResponse>(await GetAsync($"/api/pagos/{idPago}", actor.Token));

    // --- Admin ---------------------------------------------------------------------

    public Task<HttpResponseMessage> ResolverDisputaAsync(Actor admin, int idTrabajo, string favorA, string motivo) =>
        PostAsync($"/api/admin/trabajos/{idTrabajo}/resolver-disputa", admin.Token, new { favorA, motivo });
}
