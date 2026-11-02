using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Lex.Api.Data;

// Las herramientas de diseño de EF (dotnet ef migrations add/...) construyen el DbContext
// por esta vía en vez de levantar Program.cs completo: así no corren MigrateAsync ni
// DbSeeder contra ninguna base real solo para generar una migración. La cadena de conexión
// nunca se abre en este camino — alcanza con el modelo para diffear contra el snapshot — así
// que el valor de abajo no apunta a nada real ni hace falta que lo haga.
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Port=5432;Database=lex_design_time;Username=postgres;Password=postgres")
            .Options;

        return new AppDbContext(options);
    }
}
