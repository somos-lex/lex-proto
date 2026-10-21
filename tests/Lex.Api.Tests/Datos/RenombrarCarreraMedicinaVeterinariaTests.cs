using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Testcontainers.PostgreSql;

namespace Lex.Api.Tests.Datos;

// La migracion RenombrarCarreraMedicinaVeterinaria sobre una base que YA tiene la carrera
// con el nombre viejo: el caso de produccion. En la base vacia de los demas tests el UPDATE
// no toca filas, asi que este escenario solo se prueba armandolo a mano.
//
// Lo que tiene que quedar garantizado: el renombre conserva el carrera_id, y por lo tanto
// los EstudianteCarrera verificados; y el seed, que es idempotente por nombre, no crea una
// segunda carrera despues.
//
// Contenedor propio: necesita una base parada en la migracion anterior.
public class RenombrarCarreraMedicinaVeterinariaTests : IAsyncLifetime
{
    private const string MigracionAnterior = "20261021204321_BancoDeTurnosPracticas";
    private const string Unne = "Universidad Nacional del Nordeste (UNNE)";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    public Task InitializeAsync() => _postgres.StartAsync();

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    private AppDbContext NuevoContexto() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseNpgsql(_postgres.GetConnectionString())
        .Options);

    private static Task MigrarAsync(AppDbContext db, string? hasta = null) =>
        db.Database.GetService<IMigrator>().MigrateAsync(hasta);

    [Fact]
    public async Task Renombra_la_fila_existente_de_UNNE_y_el_seed_no_la_duplica()
    {
        int carreraUnneId, carreraOtraId, estudianteId;

        // 1) Base como esta hoy: parada en la migracion anterior, con "Veterinaria" en UNNE,
        //    otra institucion con su propia "Veterinaria" y un estudiante verificado.
        await using (var db = NuevoContexto())
        {
            await MigrarAsync(db, MigracionAnterior);

            var tipo = new TipoInstitucion { Nombre = "Universidad" };
            var unne = new Institucion { Nombre = Unne, TipoInstitucion = tipo };
            var otra = new Institucion { Nombre = "Universidad de Prueba", TipoInstitucion = tipo };
            var vetUnne = new Carrera { Nombre = "Veterinaria", AreaConocimiento = "Salud", Institucion = unne };
            var vetOtra = new Carrera { Nombre = "Veterinaria", AreaConocimiento = "Salud", Institucion = otra };

            var usuario = new Usuario
            {
                Email = "florencia@migracion.lex",
                PasswordHash = "x",
                NombreCompleto = "Florencia de Migración",
                FechaRegistro = DateTime.UtcNow,
                Activo = true,
                PerfilEstudiante = new PerfilEstudiante { AnioCursado = 5 }
            };
            usuario.PerfilEstudiante.EstudianteCarreras.Add(new EstudianteCarrera
            {
                Carrera = vetUnne,
                EstadoVerificacion = EstadoVerificacion.Verificado,
                FechaVerificacion = DateTime.UtcNow
            });

            db.AddRange(vetUnne, vetOtra, usuario);
            await db.SaveChangesAsync();

            carreraUnneId = vetUnne.CarreraId;
            carreraOtraId = vetOtra.CarreraId;
            estudianteId = usuario.UsuarioId;
        }

        // 2) Up: renombra solo la de UNNE, conservando el id y el vinculo verificado.
        await using (var db = NuevoContexto())
        {
            await MigrarAsync(db);

            Assert.Equal("Medicina Veterinaria", await NombreAsync(db, carreraUnneId));
            Assert.Equal("Veterinaria", await NombreAsync(db, carreraOtraId));

            var vinculo = await db.EstudianteCarreras.SingleAsync(ec => ec.EstudianteId == estudianteId);
            Assert.Equal(carreraUnneId, vinculo.CarreraId);
            Assert.Equal(EstadoVerificacion.Verificado, vinculo.EstadoVerificacion);
        }

        // 3) Down y Up de nuevo: el inverso deja el nombre viejo y la ida vuelve a aplicar.
        await using (var db = NuevoContexto())
        {
            await MigrarAsync(db, MigracionAnterior);
            Assert.Equal("Veterinaria", await NombreAsync(db, carreraUnneId));

            await MigrarAsync(db);
            Assert.Equal("Medicina Veterinaria", await NombreAsync(db, carreraUnneId));
        }

        // 4) El seed corre despues (como en Program.cs) y encuentra el nombre nuevo: engancha
        //    materias y catalogo a la MISMA carrera en vez de crear otra.
        await using (var db = NuevoContexto())
        {
            await DbSeeder.SeedAsync(db, "admin@migracion.lex", "Admin1234!");

            // El SELECT nombre, count(*) FROM carrera GROUP BY nombre del plan, por
            // institucion: ni "Veterinaria" en UNNE ni nombres duplicados.
            var duplicadas = await db.Carreras
                .GroupBy(c => new { c.InstitucionId, c.Nombre })
                .Where(g => g.Count() > 1)
                .Select(g => g.Key.Nombre)
                .ToListAsync();
            Assert.Empty(duplicadas);

            var deUnne = await db.Carreras
                .Where(c => c.Institucion.Nombre == Unne && c.Nombre.Contains("Veterinaria"))
                .ToListAsync();
            var carrera = Assert.Single(deUnne);
            Assert.Equal(carreraUnneId, carrera.CarreraId);
            Assert.Equal("Medicina Veterinaria", carrera.Nombre);

            // Lo que el seed engancha por nombre cae sobre la carrera original, la del
            // estudiante verificado.
            Assert.True(await db.Materias.AnyAsync(m => m.Nombre == "Semiología" && m.CarreraId == carreraUnneId));
            Assert.True(await db.CatalogoServicioCarreras.AnyAsync(cc =>
                cc.CatalogoServicio.Nombre == "Aplicación de vacunas (Veterinaria)" && cc.CarreraId == carreraUnneId));
        }
    }

    private static Task<string> NombreAsync(AppDbContext db, int carreraId) =>
        db.Carreras.AsNoTracking().Where(c => c.CarreraId == carreraId).Select(c => c.Nombre).SingleAsync();
}
