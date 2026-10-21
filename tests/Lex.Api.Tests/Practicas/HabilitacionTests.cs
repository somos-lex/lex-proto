using System.Net;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Practicas;
using Lex.Api.Tests.Infra;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Tests.Practicas;

// Publicar exige carrera VERIFICADA a la que pertenezca la materia y año cursado >= año
// minimo de la materia. Las materias usadas salen del seed (FOUNNE plan 134/2023 y FCV):
// Periodoncia es de 4° año de Odontología; Semiología, de 3° de Medicina Veterinaria.
[Collection(ApiCollection.Nombre)]
public class HabilitacionTests
{
    private const string Odontologia = "Odontología";
    private const string Veterinaria = "Medicina Veterinaria";

    private readonly LexApiFactory _factory;
    private readonly ApiCliente _api;

    public HabilitacionTests(LexApiFactory factory)
    {
        _factory = factory;
        _api = new ApiCliente(factory);
    }

    [Fact]
    public async Task Publicar_con_carrera_pendiente_de_verificacion_da_400()
    {
        var periodoncia = await _api.MateriaAsync(Odontologia, "Periodoncia");
        var (estudiante, _) = await _api.RegistrarEstudianteAsync(periodoncia.CarreraId, anioCursado: 5);

        var respuesta = await _api.PublicarAsync(estudiante, periodoncia.Id, TipoPaciente.Humano);

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Publicar_con_anio_cursado_menor_al_minimo_da_400()
    {
        var periodoncia = await _api.MateriaAsync(Odontologia, "Periodoncia");
        Assert.Equal(4, periodoncia.AnioMinimo);
        var estudiante = await _api.EstudianteVerificadoAsync(periodoncia.CarreraId, anioCursado: 3);

        var respuesta = await _api.PublicarAsync(estudiante, periodoncia.Id, TipoPaciente.Humano);

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Publicar_materia_de_una_carrera_que_no_es_la_verificada_da_400()
    {
        var periodoncia = await _api.MateriaAsync(Odontologia, "Periodoncia");
        var semiologia = await _api.MateriaAsync(Veterinaria, "Semiología");
        var estudiante = await _api.EstudianteVerificadoAsync(periodoncia.CarreraId, anioCursado: 5);

        var respuesta = await _api.PublicarAsync(estudiante, semiologia.Id, TipoPaciente.Animal);

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Publicar_habilitado_crea_la_practica_publicada_y_sin_arancel_expuesto()
    {
        var periodoncia = await _api.MateriaAsync(Odontologia, "Periodoncia");
        var estudiante = await _api.EstudianteVerificadoAsync(periodoncia.CarreraId, anioCursado: 4);

        var respuesta = await _api.PublicarAsync(estudiante, periodoncia.Id, TipoPaciente.Humano);
        var cuerpo = await respuesta.Content.ReadAsStringAsync();
        var practica = await ApiCliente.LeerAsync<PracticaDetalleResponse>(respuesta, HttpStatusCode.Created);

        Assert.Equal(EstadoPracticaClinica.Publicada, practica.Practica.Estado);
        Assert.Equal(periodoncia.Id, practica.Practica.MateriaId);
        Assert.Null(practica.Inscripcion);
        Assert.DoesNotContain("arancel", cuerpo, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Publicar_en_el_pasado_da_400()
    {
        var periodoncia = await _api.MateriaAsync(Odontologia, "Periodoncia");
        var estudiante = await _api.EstudianteVerificadoAsync(periodoncia.CarreraId, anioCursado: 4);

        var respuesta = await _api.PublicarAsync(estudiante, periodoncia.Id, TipoPaciente.Humano,
            inicio: DateTime.UtcNow.AddHours(-1));

        await ApiCliente.AssertStatusAsync(respuesta, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Dos_practicas_solapadas_del_mismo_estudiante_dan_400()
    {
        var periodoncia = await _api.MateriaAsync(Odontologia, "Periodoncia");
        var estudiante = await _api.EstudianteVerificadoAsync(periodoncia.CarreraId, anioCursado: 4);
        var inicio = DateTime.UtcNow.AddDays(10);

        await ApiCliente.AssertStatusAsync(
            await _api.PublicarAsync(estudiante, periodoncia.Id, TipoPaciente.Humano, inicio, duracionMinutos: 90),
            HttpStatusCode.Created);

        var solapada = await _api.PublicarAsync(estudiante, periodoncia.Id, TipoPaciente.Humano,
            inicio.AddMinutes(60), duracionMinutos: 60);

        await ApiCliente.AssertStatusAsync(solapada, HttpStatusCode.BadRequest);
    }

    // Un rechazo no es definitivo: el admin puede aprobar despues (comprobante reenviado).
    [Fact]
    public async Task Aprobar_desde_rechazado_habilita_a_publicar()
    {
        var periodoncia = await _api.MateriaAsync(Odontologia, "Periodoncia");
        var (estudiante, _) = await _api.RegistrarEstudianteAsync(periodoncia.CarreraId, anioCursado: 4);
        var admin = await _api.AdminAsync();
        var vinculo = $"/api/admin/verificaciones/{estudiante.UsuarioId}/{periodoncia.CarreraId}";

        await ApiCliente.AssertStatusAsync(
            await _api.PostAsync($"{vinculo}/rechazar", admin.Token, new { motivo = "La constancia no se lee." }),
            HttpStatusCode.OK);
        await ApiCliente.AssertStatusAsync(
            await _api.PublicarAsync(estudiante, periodoncia.Id, TipoPaciente.Humano),
            HttpStatusCode.BadRequest);

        await ApiCliente.AssertStatusAsync(
            await _api.PostAsync($"{vinculo}/aprobar", admin.Token, new { observaciones = "Constancia reenviada." }),
            HttpStatusCode.OK);
        await ApiCliente.AssertStatusAsync(
            await _api.PublicarAsync(estudiante, periodoncia.Id, TipoPaciente.Humano),
            HttpStatusCode.Created);
    }

    // El seed de una base nueva: la carrera nace con el nombre oficial y sin duplicados.
    [Fact]
    public async Task El_seed_no_deja_Veterinaria_ni_carreras_duplicadas()
    {
        await _factory.ConDbAsync(async db =>
        {
            Assert.False(await db.Carreras.AnyAsync(c => c.Nombre == "Veterinaria"));
            Assert.Empty(await db.Carreras
                .GroupBy(c => new { c.InstitucionId, c.Nombre })
                .Where(g => g.Count() > 1)
                .Select(g => g.Key.Nombre)
                .ToListAsync());
        });
    }

    [Fact]
    public async Task Verificaciones_son_solo_para_admin()
    {
        var periodoncia = await _api.MateriaAsync(Odontologia, "Periodoncia");
        var (estudiante, _) = await _api.RegistrarEstudianteAsync(periodoncia.CarreraId, anioCursado: 4);

        var autoaprobacion = await _api.PostAsync(
            $"/api/admin/verificaciones/{estudiante.UsuarioId}/{periodoncia.CarreraId}/aprobar", estudiante.Token, new { });

        await ApiCliente.AssertStatusAsync(autoaprobacion, HttpStatusCode.Forbidden);
    }
}
