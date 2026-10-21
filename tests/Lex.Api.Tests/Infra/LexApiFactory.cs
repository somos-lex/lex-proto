using Lex.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace Lex.Api.Tests.Infra;

// La API real (Program.cs) contra un Postgres efimero en Docker. Al arrancar corre
// MigrateAsync + DbSeeder como en produccion, asi que los tests validan tambien que las
// migraciones aplican sobre una base vacia y que el seed de materias carga.
//
// Un solo contenedor para toda la coleccion: cada test crea sus propios usuarios con emails
// unicos y no depende de lo que hayan dejado los demas.
public class LexApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string AdminEmail = "admin@tests.lex";
    public const string AdminPassword = "AdminTests123!";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // Toda la configuracion que en produccion sale de appsettings.json (gitignoreado, no
        // existe en CI). Se agrega ultima para ganarle a cualquier appsettings local.
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = _postgres.GetConnectionString(),
            ["Jwt:Key"] = "clave-de-tests-de-integracion-de-al-menos-32-caracteres",
            ["Jwt:Issuer"] = "LexApi",
            ["Jwt:Audience"] = "LexClient",
            ["Jwt:ExpireMinutes"] = "60",
            ["Lex:AdminEmail"] = AdminEmail,
            ["Lex:AdminPassword"] = AdminPassword,
            ["Lex:PorcentajeComision"] = "10",
        }));

        // Red de seguridad: aunque un appsettings local apunte a Supabase, el DbContext de los
        // tests solo puede hablar con el contenedor.
        builder.ConfigureServices(services =>
        {
            var registrado = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (registrado is not null)
                services.Remove(registrado);
            services.AddDbContext<AppDbContext>(o => o.UseNpgsql(_postgres.GetConnectionString()));
        });
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        // Fuerza el arranque del host (migraciones + seed) antes del primer test.
        _ = Services;
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    // Acceso directo a la base para preparar escenarios que la API no permite crear, como una
    // practica cuya hora de inicio ya llego.
    public async Task ConDbAsync(Func<AppDbContext, Task> accion)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await accion(db);
    }
}

[CollectionDefinition(Nombre)]
public class ApiCollection : ICollectionFixture<LexApiFactory>
{
    public const string Nombre = "api";
}
