using System.Net;
using System.Text.Json;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Admin;
using Lex.Api.Features.Materias;
using Lex.Api.Features.Perfil;
using Lex.Api.Features.Practicas;
using Lex.Api.Tests.Infra;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Tests.Practicas;

// Camino completo del Banco de Turnos con un estudiante que ARRANCA EN PENDIENTE.
//
// Todos los estudiantes del seed vienen verificados, y ese atajo es justamente el que
// escondia que nadie podia verificar a un estudiante real. Por eso este test no usa
// estudiantes, clientes ni verificaciones del seed: crea a todos por los endpoints que usa
// el frontend. Del seed solo toma carreras, materias y el admin.
//
// Termina con la garantia de la restriccion central del modulo: el recorrido entero no
// escribe ni una fila en las tablas del dinero ni del motor transaccional.
[Collection(ApiCollection.Nombre)]
public class CaminoVerificacionE2ETests
{
    private const string Carrera = "Odontología";
    private const int AnioCursado = 4;
    private const string Comprobante = "https://drive.google.com/file/d/constancia-alumno-regular-e2e/view";

    // Tablas que el modulo NO puede tocar: las cuatro del dinero y del motor transaccional,
    // mas turno (la agenda paga). Consultas literales, sin interpolar el nombre de tabla.
    private static readonly Dictionary<string, string> ConteosDelMarketplace = new()
    {
        ["pago"] = "SELECT count(*) AS \"Value\" FROM pago",
        ["movimiento_pago"] = "SELECT count(*) AS \"Value\" FROM movimiento_pago",
        ["trabajo"] = "SELECT count(*) AS \"Value\" FROM trabajo",
        ["sesion"] = "SELECT count(*) AS \"Value\" FROM sesion",
        ["turno"] = "SELECT count(*) AS \"Value\" FROM turno",
    };

    private readonly LexApiFactory _factory;
    private readonly ApiCliente _api;

    public CaminoVerificacionE2ETests(LexApiFactory factory)
    {
        _factory = factory;
        _api = new ApiCliente(factory);
    }

    [Fact]
    public async Task Estudiante_pendiente_se_verifica_publica_recibe_paciente_y_emite_constancia_sin_tocar_dinero()
    {
        var filasAntes = await ContarFilasDelMarketplaceAsync();

        var materias = await ApiCliente.LeerAsync<List<MateriaResponse>>(await _api.GetAsync("/api/materias"));
        var deLaCarrera = materias.Where(m => m.CarreraNombre == Carrera).ToList();
        var carreraId = deLaCarrera.Select(m => m.CarreraId).Distinct().Single();
        var periodoncia = deLaCarrera.Single(m => m.Nombre == "Periodoncia");

        // --- 1. Estudiante nuevo: el vinculo con la carrera nace Pendiente --------------
        var sufijo = Guid.NewGuid().ToString("N")[..8];
        var nombreEstudiante = $"Estudiante E2E {sufijo}";
        var emailEstudiante = $"e2e-{sufijo}@tests.lex";
        const string password = "Tests1234";

        await ApiCliente.AssertStatusAsync(await _api.PostAsync("/api/auth/register", body: new
        {
            email = emailEstudiante,
            password,
            nombreCompleto = nombreEstudiante,
            tipoRegistro = "ClienteParticular"
        }), HttpStatusCode.Created);
        var comoCliente = await _api.LoginAsync(emailEstudiante, password);
        await ApiCliente.AssertStatusAsync(await _api.PostAsync("/api/perfil/activar-estudiante", comoCliente.Token, new
        {
            carreraId,
            bio = "Estudiante del test end-to-end",
            anioCursado = AnioCursado,
            documentoComprobante = Comprobante
        }), HttpStatusCode.OK);
        // El rol Estudiante entra recien en un token nuevo (igual que refrescarSesion en el front).
        var estudiante = await _api.LoginAsync(emailEstudiante, password);

        var identidad = await ApiCliente.LeerAsync<IdentidadResponse>(await _api.GetAsync("/api/perfil/yo", estudiante.Token));
        var vinculo = Assert.Single(identidad.Carreras);
        Assert.Equal(carreraId, vinculo.CarreraId);
        Assert.Equal(EstadoVerificacion.Pendiente, vinculo.EstadoVerificacion);

        // --- 2. Sin verificar no publica: 400, nunca 500 -------------------------------
        Assert.Empty(await ApiCliente.LeerAsync<List<MateriaResponse>>(
            await _api.GetAsync("/api/materias/habilitadas", estudiante.Token)));
        await ApiCliente.AssertStatusAsync(
            await _api.PublicarAsync(estudiante, periodoncia.Id, TipoPaciente.Humano), HttpStatusCode.BadRequest);

        // --- 3. El admin lo ve en la bandeja, con su comprobante -----------------------
        var admin = await _api.AdminAsync();
        var pendientes = await ApiCliente.LeerAsync<List<VerificacionPendienteResponse>>(
            await _api.GetAsync("/api/admin/verificaciones/pendientes", admin.Token));
        var pendiente = Assert.Single(pendientes, p => p.EstudianteId == estudiante.UsuarioId);
        Assert.Equal(carreraId, pendiente.CarreraId);
        Assert.Equal(Comprobante, pendiente.DocumentoComprobante);
        Assert.Equal(nombreEstudiante, pendiente.EstudianteNombre);
        Assert.Equal(AnioCursado, pendiente.AnioCursado);

        // --- 4. Aprobar deja registrado quien y cuando ---------------------------------
        var antesDeAprobar = DateTime.UtcNow.AddSeconds(-5);
        var resuelta = await ApiCliente.LeerAsync<VerificacionResueltaResponse>(await _api.PostAsync(
            $"/api/admin/verificaciones/{estudiante.UsuarioId}/{carreraId}/aprobar", admin.Token,
            new { observaciones = "Constancia de alumno regular verificada (test E2E)." }));
        Assert.Equal(EstadoVerificacion.Verificado, resuelta.EstadoVerificacion);
        Assert.Equal(admin.UsuarioId, resuelta.VerificadoPorUsuarioId);
        Assert.InRange(resuelta.FechaVerificacion, antesDeAprobar, DateTime.UtcNow.AddSeconds(5));

        await _factory.ConDbAsync(async db =>
        {
            var fila = await db.EstudianteCarreras.AsNoTracking()
                .SingleAsync(ec => ec.EstudianteId == estudiante.UsuarioId && ec.CarreraId == carreraId);
            Assert.Equal(EstadoVerificacion.Verificado, fila.EstadoVerificacion);
            Assert.Equal(admin.UsuarioId, fila.VerificadoPorUsuarioId);
            Assert.NotNull(fila.FechaVerificacion);
        });
        var pendientesDespues = await ApiCliente.LeerAsync<List<VerificacionPendienteResponse>>(
            await _api.GetAsync("/api/admin/verificaciones/pendientes", admin.Token));
        Assert.DoesNotContain(pendientesDespues, p => p.EstudianteId == estudiante.UsuarioId);

        // --- 5. Materias habilitadas: las de su carrera hasta su año, ninguna otra -----
        var esperadas = deLaCarrera.Where(m => m.AnioMinimo <= AnioCursado).Select(m => m.Id).OrderBy(id => id).ToList();
        // Si la carrera no tuviera materias de años superiores, el filtro por año no se probaria.
        Assert.Contains(deLaCarrera, m => m.AnioMinimo > AnioCursado);
        Assert.NotEmpty(esperadas);

        var habilitadas = await ApiCliente.LeerAsync<List<MateriaResponse>>(
            await _api.GetAsync("/api/materias/habilitadas", estudiante.Token));
        Assert.Equal(esperadas, habilitadas.Select(m => m.Id).OrderBy(id => id).ToList());
        Assert.All(habilitadas, m => Assert.Equal(carreraId, m.CarreraId));

        // --- 6. Publica: queda Publicada ------------------------------------------------
        var practicaA = await ApiCliente.LeerAsync<PracticaDetalleResponse>(await _api.PublicarAsync(
            estudiante, periodoncia.Id, TipoPaciente.Humano, inicio: DateTime.UtcNow.AddDays(7)), HttpStatusCode.Created);
        Assert.Equal(EstadoPracticaClinica.Publicada, practicaA.Practica.Estado);
        // Otras dos para los pasos 10b, 11, 12 y 16 (dias distintos: no se solapan).
        var practicaB = await ApiCliente.LeerAsync<PracticaDetalleResponse>(await _api.PublicarAsync(
            estudiante, periodoncia.Id, TipoPaciente.Humano, inicio: DateTime.UtcNow.AddDays(8)), HttpStatusCode.Created);
        var practicaC = await ApiCliente.LeerAsync<PracticaDetalleResponse>(await _api.PublicarAsync(
            estudiante, periodoncia.Id, TipoPaciente.Humano, inicio: DateTime.UtcNow.AddDays(9)), HttpStatusCode.Created);

        // --- 7. Clientes nuevos con pacientes del tipo requerido -------------------------
        var cliente1 = await _api.RegistrarClienteAsync("Cliente E2E Uno");
        var paciente1 = await _api.CrearPacienteAsync(cliente1, TipoPaciente.Humano, $"Paciente Reservado {sufijo}");
        var cliente2 = await _api.RegistrarClienteAsync("Cliente E2E Dos");
        var paciente2 = await _api.CrearPacienteAsync(cliente2, TipoPaciente.Humano);

        // --- 8. La practica aparece en disponibles (sin sesion) -------------------------
        var disponibles = await ApiCliente.LeerAsync<List<PracticaPublicaResponse>>(
            await _api.GetAsync($"/api/practicas/disponibles?carreraId={carreraId}&tipoPaciente=Humano"));
        Assert.Contains(disponibles, p => p.Id == practicaA.Practica.Id && p.Estado == EstadoPracticaClinica.Publicada);

        // --- 9. Inscripcion: la practica pasa a Cubierta --------------------------------
        var inscripcionA = await ApiCliente.LeerAsync<InscripcionResponse>(
            await _api.InscribirAsync(cliente1, practicaA.Practica.Id, paciente1.Id), HttpStatusCode.Created);
        Assert.Equal(EstadoPracticaClinica.Cubierta, inscripcionA.Practica.Estado);

        // --- 10. Segundo cliente: 400 por cupo ------------------------------------------
        await ApiCliente.AssertStatusAsync(
            await _api.InscribirAsync(cliente2, practicaA.Practica.Id, paciente2.Id), HttpStatusCode.BadRequest);

        // --- 10b. El mismo rechazo cuando lo decide el indice unico (23505) -------------
        // En el paso 10 el 400 lo da el chequeo de estado del service: la practica ya dice
        // Cubierta. El indice parcial solo decide cuando dos inscripciones leen Publicada a
        // la vez, y una carrera real no se puede provocar de forma deterministica. Se arma
        // el estado de esa ventana por la base: otra transaccion ya inserto su inscripcion
        // vigente, pero la practica todavia dice Publicada. La request pasa el chequeo, choca
        // contra el indice, y tiene que salir 400 y no 500.
        await _factory.ConDbAsync(async db =>
        {
            db.InscripcionesPractica.Add(new InscripcionPractica
            {
                PracticaClinicaId = practicaC.Practica.Id,
                ClienteId = cliente2.UsuarioId,
                PacienteId = paciente2.Id,
                Estado = EstadoInscripcionPractica.Inscripta,
                RequisitosAceptados = true,
                FechaAceptacionRequisitos = DateTime.UtcNow,
                FechaInscripcion = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });
        await ApiCliente.AssertStatusAsync(
            await _api.InscribirAsync(cliente1, practicaC.Practica.Id, paciente1.Id), HttpStatusCode.BadRequest);
        await _factory.ConDbAsync(async db =>
            Assert.Equal(1, await db.InscripcionesPractica.CountAsync(i =>
                i.PracticaClinicaId == practicaC.Practica.Id && i.Estado != EstadoInscripcionPractica.Cancelada)));

        // --- 11. Paciente del tipo equivocado: rechazado ---------------------------------
        var perro = await _api.CrearPacienteAsync(cliente1, TipoPaciente.Animal, "Firulais");
        await ApiCliente.AssertStatusAsync(
            await _api.InscribirAsync(cliente1, practicaB.Practica.Id, perro.Id), HttpStatusCode.BadRequest);

        // --- 12. El propio estudiante en su practica: rechazado --------------------------
        var pacienteDelEstudiante = await _api.CrearPacienteAsync(estudiante, TipoPaciente.Humano);
        await ApiCliente.AssertStatusAsync(
            await _api.InscribirAsync(estudiante, practicaB.Practica.Id, pacienteDelEstudiante.Id), HttpStatusCode.BadRequest);

        // --- 13. Asistencia antes del inicio: rechazada (D5) -----------------------------
        await ApiCliente.AssertStatusAsync(
            await _api.RegistrarAsistenciaAsync(estudiante, practicaA.Practica.Id, asistio: true), HttpStatusCode.BadRequest);
        await ApiCliente.AssertStatusAsync(
            await _api.GetAsync($"/api/practicas/{practicaA.Practica.Id}/constancia", estudiante.Token), HttpStatusCode.NotFound);

        // --- 14. Asistio sobre una practica que ya empezo --------------------------------
        // Esta practica NO pasa por POST /api/practicas: el endpoint exige fecha futura (y la
        // inscripcion tambien), y la asistencia exige que la practica ya haya empezado. Para
        // tener ese caso sin esperar ni mover el reloj, se inserta directo por el DbContext,
        // ya Cubierta y con su inscripcion, como habria quedado si se hubiera publicado e
        // inscripto dias atras.
        var inicioPasado = DateTime.UtcNow.AddMinutes(-30);
        var practicaDId = 0;
        await _factory.ConDbAsync(async db =>
        {
            var practica = new PracticaClinica
            {
                EstudianteId = estudiante.UsuarioId,
                MateriaId = periodoncia.Id,
                FechaHoraInicio = inicioPasado,
                DuracionMinutos = 60,
                Lugar = "Clínica de la FOUNNE, box 7",
                TipoPacienteRequerido = TipoPaciente.Humano,
                RequisitosPrevios = "Traer estudios previos si los tiene.",
                Estado = EstadoPracticaClinica.Cubierta,
                FechaCreacion = inicioPasado.AddDays(-5)
            };
            practica.Inscripciones.Add(new InscripcionPractica
            {
                ClienteId = cliente1.UsuarioId,
                PacienteId = paciente1.Id,
                Estado = EstadoInscripcionPractica.Inscripta,
                RequisitosAceptados = true,
                FechaAceptacionRequisitos = inicioPasado.AddDays(-3),
                FechaInscripcion = inicioPasado.AddDays(-3)
            });
            db.PracticasClinicas.Add(practica);
            await db.SaveChangesAsync();
            practicaDId = practica.Id;
        });

        var constancia = await ApiCliente.LeerAsync<ConstanciaResponse>(
            await _api.RegistrarAsistenciaAsync(estudiante, practicaDId, asistio: true));
        Assert.True(constancia.AsistenciaRegistrada);
        var practicaD = await ApiCliente.LeerAsync<PracticaDetalleResponse>(
            await _api.GetAsync($"/api/practicas/{practicaDId}", estudiante.Token));
        Assert.Equal(EstadoPracticaClinica.Realizada, practicaD.Practica.Estado);
        Assert.Equal(EstadoInscripcionPractica.Asistio, practicaD.Inscripcion!.Estado);
        Assert.Equal(constancia.Codigo, practicaD.CodigoConstancia);

        // --- 15. Verificacion publica: snapshots y ningun dato del paciente ---------------
        var publica = await _api.GetAsync($"/api/constancias/{constancia.Codigo}");
        var cuerpoPublico = await publica.Content.ReadAsStringAsync();
        var verificada = await ApiCliente.LeerAsync<ConstanciaPublicaResponse>(publica);
        Assert.Equal(constancia.Codigo, verificada.Codigo);
        Assert.Equal(nombreEstudiante, verificada.NombreEstudiante);
        Assert.Equal("Periodoncia", verificada.NombreMateria);
        Assert.Equal(Carrera, verificada.NombreCarrera);
        Assert.Equal(periodoncia.InstitucionNombre, verificada.NombreInstitucion);
        Assert.Equal(inicioPasado, verificada.FechaPractica, TimeSpan.FromMilliseconds(1));
        Assert.True(verificada.AsistenciaRegistrada);
        Assert.DoesNotContain(paciente1.NombreCompleto, cuerpoPublico);
        using (var json = JsonDocument.Parse(cuerpoPublico))
            Assert.DoesNotContain(json.RootElement.EnumerateObject(),
                p => p.Name.Contains("paciente", StringComparison.OrdinalIgnoreCase));

        // --- 16. Cancelar la inscripcion de otra Cubierta: vuelve a Publicada -------------
        var inscripcionB = await ApiCliente.LeerAsync<InscripcionResponse>(
            await _api.InscribirAsync(cliente1, practicaB.Practica.Id, paciente1.Id), HttpStatusCode.Created);
        Assert.Equal(EstadoPracticaClinica.Cubierta, inscripcionB.Practica.Estado);
        var canceladaB = await ApiCliente.LeerAsync<InscripcionResponse>(await _api.PostAsync(
            $"/api/inscripciones/{inscripcionB.Id}/cancelar", cliente1.Token, new { motivo = "No puedo ir (test E2E)." }));
        Assert.Equal(EstadoInscripcionPractica.Cancelada, canceladaB.Estado);
        Assert.Equal(EstadoPracticaClinica.Publicada, canceladaB.Practica.Estado);

        // --- Final: ni una fila en las tablas del dinero ni del motor transaccional --------
        // Restriccion central del modulo, comprobada contra la base y no contra el modelo.
        // Se compara contra el conteo del arranque porque la coleccion comparte la base con
        // los demas tests, que corren en serie: lo que cuenta es lo que agrego este recorrido.
        Assert.Equal(filasAntes, await ContarFilasDelMarketplaceAsync());
    }

    private async Task<Dictionary<string, long>> ContarFilasDelMarketplaceAsync()
    {
        var conteos = new Dictionary<string, long>();
        await _factory.ConDbAsync(async db =>
        {
            foreach (var (tabla, sql) in ConteosDelMarketplace)
                conteos[tabla] = await db.Database.SqlQueryRaw<long>(sql).SingleAsync();
        });
        return conteos;
    }
}
