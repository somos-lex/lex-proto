using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lex.Api.Migrations
{
    /// <inheritdoc />
    public partial class ConcurrenciaOptimistaXmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Sin SQL a proposito: xmin ya existe como columna de sistema en toda tabla de
            // Postgres. El scaffolding de EF la trata como una columna nueva porque recien
            // ahora el modelo la conoce, pero un ALTER TABLE ADD COLUMN xmin fallaria --
            // Postgres rechaza cualquier columna que choque con un nombre de columna de
            // sistema (xmin, cmin, xmax, cmax, ctid, tableoid). Ver AppDbContext.OnModelCreating
            // (UseXminAsConcurrencyToken en Trabajo y Pago).
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Idem Up: no hay columna propia que borrar.
        }
    }
}
