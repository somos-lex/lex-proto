using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lex.Api.Migrations
{
    /// <inheritdoc />
    public partial class AjusteDefaultFechaCreacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // La migración anterior (PagosConMovimientos) agregó pago.fecha_creacion con
            // defaultValue para poder backfillear filas existentes, y eso dejó pegado un
            // DEFAULT '-infinity' en la columna. El modelo nunca declaró ese default, así
            // que EF no lo ve y no genera el DROP solo: va explícito.
            // EF siempre escribe FechaCreacion al insertar; el default solo podía afectar
            // a un INSERT crudo, que quedaría con fecha del año 1 en vez de fallar.
            migrationBuilder.Sql("ALTER TABLE pago ALTER COLUMN fecha_creacion DROP DEFAULT;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE pago ALTER COLUMN fecha_creacion SET DEFAULT TIMESTAMPTZ '-infinity';");
        }
    }
}
