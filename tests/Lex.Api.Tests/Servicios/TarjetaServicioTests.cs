using System.Net;
using System.Text.Json;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Lex.Api.Tests.Infra;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Tests.Servicios;

// Datos de la tarjeta del catalogo (credencial, supervisor, tema, condiciones) en el listado,
// el detalle y el portafolio. Las carreras, entradas de catalogo y supervisores salen del seed.
// Las aserciones leen el JSON crudo: asi verifican tambien los nombres serializados.
[Collection(ApiCollection.Nombre)]
public class TarjetaServicioTests
{
    private const string Unne = "Universidad Nacional del Nordeste (UNNE)";
    private const string Sistemas = "Licenciatura en Sistemas de Información";
    private const string Diseno = "Diseño Gráfico";
    private const string Odontologia = "Odontología";
    private const string Veterinaria = "Medicina Veterinaria";

    private const string SitioWeb = "Desarrollo de sitio web informativo"; // solo Sistemas, 2° año
    private const string ConsultaOdonto = "Consulta odontológica básica"; // solo Odontología, 3° año
    private const string Vacunas = "Aplicación de vacunas (Veterinaria)"; // solo Veterinaria, 3° año

    private const string MatriculaRamirez = "12345"; // Dr. Juan Ramírez

    private readonly LexApiFactory _factory;
    private readonly ApiCliente _api;

    public TarjetaServicioTests(LexApiFactory factory)
    {
        _factory = factory;
        _api = new ApiCliente(factory);
    }

    // --- Helpers ------------------------------------------------------------------

    private async Task<int> CarreraIdAsync(string nombre)
    {
        var id = 0;
        await _factory.ConDbAsync(async db =>
            id = (await db.Carreras.SingleAsync(c => c.Nombre == nombre && c.Institucion.Nombre == Unne)).CarreraId);
        return id;
    }

    private async Task<int> CatalogoIdAsync(string nombre)
    {
        var id = 0;
        await _factory.ConDbAsync(async db =>
            id = (await db.CatalogoServicios.SingleAsync(c => c.Nombre == nombre)).Id);
        return id;
    }

    private async Task<(int Id, string Nombre)> SupervisorAsync(string matricula)
    {
        var supervisor = (Id: 0, Nombre: "");
        await _factory.ConDbAsync(async db =>
        {
            var s = await db.ProfesionalesSupervisores.SingleAsync(p => p.Matricula == matricula);
            supervisor = (s.Id, s.NombreCompleto);
        });
        return supervisor;
    }

    private async Task<Actor> EstudianteAsync(string carrera, int anio) =>
        await _api.EstudianteVerificadoAsync(await CarreraIdAsync(carrera), anio);

    // Segunda carrera ya verificada: la API solo deja activar con una; la baja directa a la base.
    private Task AgregarCarreraVerificadaAsync(Actor estudiante, int carreraId) =>
        _factory.ConDbAsync(async db =>
        {
            db.EstudianteCarreras.Add(new EstudianteCarrera
            {
                EstudianteId = estudiante.UsuarioId,
                CarreraId = carreraId,
                EstadoVerificacion = EstadoVerificacion.Verificado,
                FechaVerificacion = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });

    private async Task<JsonElement> ListadoDeAsync(Actor estudiante)
    {
        var pagina = await ApiCliente.LeerJsonAsync(
            await _api.GetAsync($"/api/servicios?estudiante_id={estudiante.UsuarioId}&pageSize=50"));
        return pagina.GetProperty("items");
    }

    private async Task<JsonElement> ListadoUnicoAsync(Actor estudiante)
    {
        var items = await ListadoDeAsync(estudiante);
        Assert.Equal(1, items.GetArrayLength());
        return items[0];
    }

    private static void AssertCredencial(JsonElement servicio, string carrera, int anio)
    {
        var credencial = servicio.GetProperty("credencial");
        Assert.Equal(JsonValueKind.Object, credencial.ValueKind);
        Assert.Equal(carrera, credencial.GetProperty("carrera").GetString());
        Assert.Equal(Unne, credencial.GetProperty("institucion").GetString());
        Assert.Equal(anio, credencial.GetProperty("anioCursado").GetInt32());
    }

    private static void AssertCondicionesProyecto(JsonElement servicio, int plazo)
    {
        var c = servicio.GetProperty("condiciones");
        Assert.Equal(plazo, c.GetProperty("plazoEntregaDias").GetInt32());
        Assert.Equal(JsonValueKind.Null, c.GetProperty("duracionMinutosSesion").ValueKind);
        Assert.Equal(JsonValueKind.Null, c.GetProperty("modalidad").ValueKind);
        Assert.Equal(JsonValueKind.Null, c.GetProperty("esPaquete").ValueKind);
        Assert.Equal(JsonValueKind.Null, c.GetProperty("cantidadSesionesPaquete").ValueKind);
    }

    private static void AssertCondicionesClasePaquete(JsonElement servicio)
    {
        var c = servicio.GetProperty("condiciones");
        Assert.Equal(90, c.GetProperty("duracionMinutosSesion").GetInt32());
        Assert.Equal("Presencial", c.GetProperty("modalidad").GetString());
        Assert.True(c.GetProperty("esPaquete").GetBoolean());
        Assert.Equal(4, c.GetProperty("cantidadSesionesPaquete").GetInt32());
        Assert.Equal(JsonValueKind.Null, c.GetProperty("plazoEntregaDias").ValueKind);
    }

    private static void AssertCondicionesSalud(JsonElement servicio)
    {
        var c = servicio.GetProperty("condiciones");
        Assert.Equal(30, c.GetProperty("duracionMinutosSesion").GetInt32());
        Assert.Equal("Domicilio", c.GetProperty("modalidad").GetString());
        Assert.Equal(JsonValueKind.Null, c.GetProperty("plazoEntregaDias").ValueKind);
        Assert.Equal(JsonValueKind.Null, c.GetProperty("esPaquete").ValueKind);
        Assert.Equal(JsonValueKind.Null, c.GetProperty("cantidadSesionesPaquete").ValueKind);
    }

    // --- 1. Listado: un servicio de cada vertical -----------------------------------

    [Fact]
    public async Task Listado_trae_credencial_tema_y_condiciones_de_cada_vertical()
    {
        var sistemas = await EstudianteAsync(Sistemas, anio: 3);
        var odonto = await EstudianteAsync(Odontologia, anio: 4);
        var supervisor = await SupervisorAsync(MatriculaRamirez);

        await _api.PublicarProyectoCerradoAsync(sistemas, await CatalogoIdAsync(SitioWeb), plazoEntregaDias: 21);
        await _api.PublicarClaseAsync(odonto, materia: "Anatomía", modalidad: "Presencial",
            duracionMinutosSesion: 90, esPaquete: true, cantidadSesionesPaquete: 4);
        await _api.PublicarSaludAsync(odonto, await CatalogoIdAsync(ConsultaOdonto), supervisor.Id,
            modalidad: "Domicilio", duracionMinutosSesion: 30);

        // Proyecto cerrado
        var pc = await ListadoUnicoAsync(sistemas);
        Assert.Equal("ProyectoCerrado", pc.GetProperty("tipo").GetString());
        AssertCredencial(pc, Sistemas, 3);
        Assert.Equal(SitioWeb, pc.GetProperty("tema").GetString());
        Assert.Equal(JsonValueKind.Null, pc.GetProperty("supervisor").ValueKind);
        AssertCondicionesProyecto(pc, 21);

        // Clase y Salud del mismo estudiante
        var items = await ListadoDeAsync(odonto);
        Assert.Equal(2, items.GetArrayLength());
        var clase = items.EnumerateArray().Single(i => i.GetProperty("tipo").GetString() == "Clase");
        var salud = items.EnumerateArray().Single(i => i.GetProperty("tipo").GetString() == "Salud");

        AssertCredencial(clase, Odontologia, 4);
        Assert.Equal("Anatomía", clase.GetProperty("tema").GetString());
        Assert.Equal(JsonValueKind.Null, clase.GetProperty("supervisor").ValueKind);
        AssertCondicionesClasePaquete(clase);

        AssertCredencial(salud, Odontologia, 4);
        Assert.Equal(ConsultaOdonto, salud.GetProperty("tema").GetString());
        var sup = salud.GetProperty("supervisor");
        Assert.Equal(supervisor.Nombre, sup.GetProperty("nombre").GetString());
        Assert.Equal(MatriculaRamirez, sup.GetProperty("matricula").GetString());
        AssertCondicionesSalud(salud);
    }

    [Fact]
    public async Task Clase_individual_no_es_paquete_y_no_trae_cantidad()
    {
        var estudiante = await EstudianteAsync(Sistemas, anio: 3);
        await _api.PublicarClaseAsync(estudiante, materia: "Programación", modalidad: "Ambas");

        var clase = await ListadoUnicoAsync(estudiante);

        var c = clase.GetProperty("condiciones");
        Assert.Equal("Ambas", c.GetProperty("modalidad").GetString());
        Assert.False(c.GetProperty("esPaquete").GetBoolean());
        Assert.Equal(JsonValueKind.Null, c.GetProperty("cantidadSesionesPaquete").ValueKind);
        Assert.Equal("Programación", clase.GetProperty("tema").GetString());
    }

    // --- 2. Carrera habilitada para el catalogo con dos carreras verificadas ---------

    [Fact]
    public async Task Proyecto_cerrado_muestra_la_carrera_habilitada_y_no_otra_verificada()
    {
        var disenoId = await CarreraIdAsync(Diseno);
        var sistemasId = await CarreraIdAsync(Sistemas);
        // Si Diseño tiene id menor, un "primera verificada por id" elegiria la equivocada:
        // el test solo discrimina asi.
        Assert.True(disenoId < sistemasId, "El seed ya no deja Diseño antes que Sistemas: revisar el test.");

        // Verificado en Diseño por la API; Sistemas (la habilitada para el sitio web) por la base.
        var estudiante = await _api.EstudianteVerificadoAsync(disenoId, anioCursado: 3);
        await AgregarCarreraVerificadaAsync(estudiante, sistemasId);

        await _api.PublicarProyectoCerradoAsync(estudiante, await CatalogoIdAsync(SitioWeb));

        var pc = await ListadoUnicoAsync(estudiante);
        AssertCredencial(pc, Sistemas, 3);
    }

    [Fact]
    public async Task Salud_muestra_la_carrera_habilitada_y_no_otra_verificada()
    {
        var odontoId = await CarreraIdAsync(Odontologia);
        var vetId = await CarreraIdAsync(Veterinaria);
        Assert.True(odontoId < vetId, "El seed ya no deja Odontología antes que Veterinaria: revisar el test.");

        var estudiante = await _api.EstudianteVerificadoAsync(odontoId, anioCursado: 4);
        await AgregarCarreraVerificadaAsync(estudiante, vetId);
        var supervisor = await SupervisorAsync(MatriculaRamirez);

        // Vacunas solo esta habilitada para Veterinaria.
        await _api.PublicarSaludAsync(estudiante, await CatalogoIdAsync(Vacunas), supervisor.Id);

        var salud = await ListadoUnicoAsync(estudiante);
        AssertCredencial(salud, Veterinaria, 4);
    }

    [Fact]
    public async Task Si_el_catalogo_ya_no_esta_habilitado_para_ninguna_cae_en_otra_verificada()
    {
        var estudiante = await EstudianteAsync(Sistemas, anio: 3);
        var catalogoId = await CatalogoIdAsync(SitioWeb);
        await _api.PublicarProyectoCerradoAsync(estudiante, catalogoId);

        // El catalogo cambia despues de publicar: ya no se habilita para Sistemas.
        var sistemasId = await CarreraIdAsync(Sistemas);
        await _factory.ConDbAsync(async db =>
        {
            var habilitacion = await db.CatalogoServicioCarreras
                .SingleAsync(cc => cc.CatalogoServicioId == catalogoId && cc.CarreraId == sistemasId);
            db.CatalogoServicioCarreras.Remove(habilitacion);
            await db.SaveChangesAsync();
        });

        try
        {
            var pc = await ListadoUnicoAsync(estudiante);
            AssertCredencial(pc, Sistemas, 3);
        }
        finally
        {
            // La coleccion comparte base: se restaura el seed para los demas tests.
            await _factory.ConDbAsync(async db =>
            {
                db.CatalogoServicioCarreras.Add(new CatalogoServicioCarrera
                {
                    CatalogoServicioId = catalogoId,
                    CarreraId = sistemasId,
                    AnioMinimo = 2
                });
                await db.SaveChangesAsync();
            });
        }
    }

    // --- 3. Sin carrera verificada ---------------------------------------------------

    [Theory]
    [InlineData(EstadoVerificacion.Pendiente)]
    [InlineData(EstadoVerificacion.Rechazado)]
    public async Task Sin_carrera_verificada_la_credencial_es_null_y_el_resto_igual(EstadoVerificacion estado)
    {
        var odontoId = await CarreraIdAsync(Odontologia);
        var estudiante = await _api.EstudianteVerificadoAsync(odontoId, anioCursado: 4);
        var supervisor = await SupervisorAsync(MatriculaRamirez);
        await _api.PublicarClaseAsync(estudiante, materia: "Histología");
        await _api.PublicarSaludAsync(estudiante, await CatalogoIdAsync(ConsultaOdonto), supervisor.Id,
            modalidad: "Domicilio", duracionMinutosSesion: 30);

        await _factory.ConDbAsync(async db =>
        {
            var vinculo = await db.EstudianteCarreras
                .SingleAsync(ec => ec.EstudianteId == estudiante.UsuarioId && ec.CarreraId == odontoId);
            vinculo.EstadoVerificacion = estado;
            await db.SaveChangesAsync();
        });

        var items = await ListadoDeAsync(estudiante);
        Assert.Equal(2, items.GetArrayLength());
        var clase = items.EnumerateArray().Single(i => i.GetProperty("tipo").GetString() == "Clase");
        var salud = items.EnumerateArray().Single(i => i.GetProperty("tipo").GetString() == "Salud");

        Assert.Equal(JsonValueKind.Null, clase.GetProperty("credencial").ValueKind);
        Assert.Equal("Histología", clase.GetProperty("tema").GetString());

        Assert.Equal(JsonValueKind.Null, salud.GetProperty("credencial").ValueKind);
        Assert.Equal(ConsultaOdonto, salud.GetProperty("tema").GetString());
        Assert.Equal(MatriculaRamirez, salud.GetProperty("supervisor").GetProperty("matricula").GetString());
        AssertCondicionesSalud(salud);
    }

    // --- 4. Detalle ------------------------------------------------------------------

    [Fact]
    public async Task Detalle_trae_los_mismos_campos_que_el_listado_y_el_bloque_polimorfico_intacto()
    {
        var odonto = await EstudianteAsync(Odontologia, anio: 4);
        var sistemas = await EstudianteAsync(Sistemas, anio: 3);
        var supervisor = await SupervisorAsync(MatriculaRamirez);
        var catalogoSalud = await CatalogoIdAsync(ConsultaOdonto);
        var catalogoPc = await CatalogoIdAsync(SitioWeb);

        var salud = await _api.PublicarSaludAsync(odonto, catalogoSalud, supervisor.Id,
            modalidad: "Domicilio", duracionMinutosSesion: 30);
        var pc = await _api.PublicarProyectoCerradoAsync(sistemas, catalogoPc, plazoEntregaDias: 21);
        var clase = await _api.PublicarClaseAsync(odonto, materia: "Anatomía", modalidad: "Presencial",
            duracionMinutosSesion: 90, esPaquete: true, cantidadSesionesPaquete: 4);

        foreach (var creado in new[] { salud, pc, clase })
        {
            var id = creado.GetProperty("id").GetInt32();
            var estudianteId = creado.GetProperty("estudianteId").GetInt32();
            var detalle = await ApiCliente.LeerJsonAsync(await _api.GetAsync($"/api/servicios/{id}"));
            var enListado = (await ApiCliente.LeerJsonAsync(
                    await _api.GetAsync($"/api/servicios?estudiante_id={estudianteId}&pageSize=50")))
                .GetProperty("items").EnumerateArray().Single(i => i.GetProperty("id").GetInt32() == id);

            foreach (var campo in new[] { "credencial", "supervisor", "tema", "condiciones" })
                Assert.Equal(enListado.GetProperty(campo).GetRawText(), detalle.GetProperty(campo).GetRawText());
        }

        // El bloque 'detalle' sigue con sus campos propios de siempre.
        var detSalud = (await ApiCliente.LeerJsonAsync(
            await _api.GetAsync($"/api/servicios/{salud.GetProperty("id").GetInt32()}"))).GetProperty("detalle");
        Assert.Equal(catalogoSalud, detSalud.GetProperty("catalogoServicioId").GetInt32());
        Assert.Equal(ConsultaOdonto, detSalud.GetProperty("catalogoServicioNombre").GetString());
        Assert.Equal(supervisor.Id, detSalud.GetProperty("supervisorId").GetInt32());
        Assert.Equal(supervisor.Nombre, detSalud.GetProperty("supervisorNombre").GetString());
        Assert.Equal(MatriculaRamirez, detSalud.GetProperty("supervisorMatricula").GetString());
        Assert.Equal("Domicilio", detSalud.GetProperty("modalidad").GetString());
        Assert.Equal(30, detSalud.GetProperty("duracionMinutosSesion").GetInt32());

        var detClase = (await ApiCliente.LeerJsonAsync(
            await _api.GetAsync($"/api/servicios/{clase.GetProperty("id").GetInt32()}"))).GetProperty("detalle");
        Assert.Equal("Anatomía", detClase.GetProperty("materia").GetString());
        Assert.Equal("Presencial", detClase.GetProperty("modalidad").GetString());
        Assert.True(detClase.GetProperty("esPaquete").GetBoolean());
        Assert.Equal(4, detClase.GetProperty("cantidadSesionesPaquete").GetInt32());

        var detPc = (await ApiCliente.LeerJsonAsync(
            await _api.GetAsync($"/api/servicios/{pc.GetProperty("id").GetInt32()}"))).GetProperty("detalle");
        Assert.Equal(catalogoPc, detPc.GetProperty("catalogoServicioId").GetInt32());
        Assert.Equal(SitioWeb, detPc.GetProperty("catalogoServicioNombre").GetString());
        Assert.Equal(21, detPc.GetProperty("plazoEntregaDias").GetInt32());
        Assert.Equal(2, detPc.GetProperty("revisionesIncluidas").GetInt32());
    }

    [Fact]
    public async Task Detalle_de_un_servicio_sin_carrera_verificada_trae_credencial_null()
    {
        var sistemasId = await CarreraIdAsync(Sistemas);
        var estudiante = await _api.EstudianteVerificadoAsync(sistemasId, anioCursado: 3);
        var clase = await _api.PublicarClaseAsync(estudiante);
        await _factory.ConDbAsync(async db =>
        {
            var vinculo = await db.EstudianteCarreras
                .SingleAsync(ec => ec.EstudianteId == estudiante.UsuarioId && ec.CarreraId == sistemasId);
            vinculo.EstadoVerificacion = EstadoVerificacion.Pendiente;
            await db.SaveChangesAsync();
        });

        var detalle = await ApiCliente.LeerJsonAsync(
            await _api.GetAsync($"/api/servicios/{clase.GetProperty("id").GetInt32()}"));

        Assert.Equal(JsonValueKind.Null, detalle.GetProperty("credencial").ValueKind);
        Assert.Equal("Álgebra", detalle.GetProperty("tema").GetString());
    }

    // --- 5. Portafolio ---------------------------------------------------------------

    [Fact]
    public async Task Portafolio_trae_los_campos_nuevos_en_sus_servicios()
    {
        var estudiante = await EstudianteAsync(Odontologia, anio: 4);
        var supervisor = await SupervisorAsync(MatriculaRamirez);
        await _api.PublicarClaseAsync(estudiante, materia: "Anatomía", modalidad: "Presencial",
            duracionMinutosSesion: 90, esPaquete: true, cantidadSesionesPaquete: 4);
        await _api.PublicarSaludAsync(estudiante, await CatalogoIdAsync(ConsultaOdonto), supervisor.Id,
            modalidad: "Domicilio", duracionMinutosSesion: 30);

        var portafolio = await ApiCliente.LeerJsonAsync(
            await _api.GetAsync($"/api/estudiantes/{estudiante.UsuarioId}/portafolio"));

        var servicios = portafolio.GetProperty("servicios");
        Assert.Equal(2, servicios.GetArrayLength());
        var clase = servicios.EnumerateArray().Single(s => s.GetProperty("tipo").GetString() == "Clase");
        var salud = servicios.EnumerateArray().Single(s => s.GetProperty("tipo").GetString() == "Salud");

        AssertCredencial(clase, Odontologia, 4);
        Assert.Equal("Anatomía", clase.GetProperty("tema").GetString());
        AssertCondicionesClasePaquete(clase);

        AssertCredencial(salud, Odontologia, 4);
        Assert.Equal(ConsultaOdonto, salud.GetProperty("tema").GetString());
        Assert.Equal(MatriculaRamirez, salud.GetProperty("supervisor").GetProperty("matricula").GetString());
        AssertCondicionesSalud(salud);
    }

    // --- 6. Compatibilidad de las respuestas de alta ---------------------------------

    [Fact]
    public async Task Las_respuestas_de_alta_siguen_con_sus_campos_propios_y_sin_los_nuevos_completados()
    {
        var odonto = await EstudianteAsync(Odontologia, anio: 4);
        var sistemas = await EstudianteAsync(Sistemas, anio: 3);
        var supervisor = await SupervisorAsync(MatriculaRamirez);
        var catalogoSalud = await CatalogoIdAsync(ConsultaOdonto);
        var catalogoPc = await CatalogoIdAsync(SitioWeb);

        var clase = await _api.PublicarClaseAsync(odonto, materia: "Anatomía", modalidad: "Presencial",
            duracionMinutosSesion: 90, esPaquete: true, cantidadSesionesPaquete: 4);
        Assert.Equal("Anatomía", clase.GetProperty("materia").GetString());
        Assert.Equal("Presencial", clase.GetProperty("modalidad").GetString());
        Assert.Equal("Universitario", clase.GetProperty("nivel").GetString());
        Assert.Equal(90, clase.GetProperty("duracionMinutosSesion").GetInt32());
        Assert.True(clase.GetProperty("esPaquete").GetBoolean());
        Assert.Equal(4, clase.GetProperty("cantidadSesionesPaquete").GetInt32());

        var salud = await _api.PublicarSaludAsync(odonto, catalogoSalud, supervisor.Id,
            modalidad: "Domicilio", duracionMinutosSesion: 30);
        Assert.Equal(supervisor.Nombre, salud.GetProperty("supervisorNombre").GetString());
        Assert.Equal(MatriculaRamirez, salud.GetProperty("supervisorMatricula").GetString());
        Assert.Equal(supervisor.Id, salud.GetProperty("supervisorId").GetInt32());
        Assert.Equal("Domicilio", salud.GetProperty("modalidad").GetString());
        Assert.Equal(catalogoSalud, salud.GetProperty("catalogoServicioId").GetInt32());
        Assert.Equal(ConsultaOdonto, salud.GetProperty("catalogoServicioNombre").GetString());

        var pc = await _api.PublicarProyectoCerradoAsync(sistemas, catalogoPc, plazoEntregaDias: 21);
        Assert.Equal(21, pc.GetProperty("plazoEntregaDias").GetInt32());
        Assert.Equal(catalogoPc, pc.GetProperty("catalogoServicioId").GetInt32());
        Assert.Equal(SitioWeb, pc.GetProperty("catalogoServicioNombre").GetString());

        // Los campos anidados nuevos conviven con los propios sin pisarse, y el alta no los
        // completa (solo el listado, el detalle y el portafolio).
        foreach (var alta in new[] { clase, salud, pc })
        {
            foreach (var campo in new[] { "credencial", "supervisor", "tema", "condiciones" })
            {
                Assert.True(alta.TryGetProperty(campo, out var valor), $"Falta '{campo}' en la respuesta de alta.");
                Assert.Equal(JsonValueKind.Null, valor.ValueKind);
            }
        }
    }
}
