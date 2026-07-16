using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Lex.Api.Migrations
{
    /// <inheritdoc />
    public partial class PagosConMovimientos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Limpieza de pagos residuales antes del cambio estructural (patrón Sub-hito 1.2).
            // Deja 'pago' vacío para que: (a) los renames de columnas no crucen datos entre
            // monto_a_estudiante y monto_comision_calculada, y (b) el ALTER de 'estado' int→text
            // no requiera USING. El DemoService repuebla pagos y movimientos al arrancar.
            // 'movimiento_pago' se crea en esta misma migración: al inicio de Up() aún no existe,
            // por eso su borrado va guardado con to_regclass (cubre datos residuales si existieran).
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF to_regclass('public.movimiento_pago') IS NOT NULL THEN DELETE FROM movimiento_pago; END IF;
                END $$;
                DELETE FROM pago;
            ");

            migrationBuilder.DropColumn(
                name: "fecha_retencion",
                table: "pago");

            migrationBuilder.DropColumn(
                name: "metodo_pago",
                table: "pago");

            migrationBuilder.RenameColumn(
                name: "porcentaje_comision",
                table: "pago",
                newName: "porcentaje_comision_lex");

            migrationBuilder.RenameColumn(
                name: "monto_estudiante",
                table: "pago",
                newName: "monto_comision_calculada");

            migrationBuilder.RenameColumn(
                name: "comision_lex",
                table: "pago",
                newName: "monto_a_estudiante");

            migrationBuilder.AlterColumn<string>(
                name: "estado",
                table: "pago",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_creacion",
                table: "pago",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "movimiento_pago",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    pago_id = table.Column<int>(type: "integer", nullable: false),
                    tipo = table.Column<string>(type: "text", nullable: false),
                    monto = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: false),
                    fecha_movimiento = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    referencia_externa = table.Column<string>(type: "text", nullable: true),
                    trabajo_historial_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movimiento_pago", x => x.id);
                    table.ForeignKey(
                        name: "FK_movimiento_pago_pago_pago_id",
                        column: x => x.pago_id,
                        principalTable: "pago",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_movimiento_pago_trabajo_historial_trabajo_historial_id",
                        column: x => x.trabajo_historial_id,
                        principalTable: "trabajo_historial",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_movimiento_pago_pago_id",
                table: "movimiento_pago",
                column: "pago_id");

            migrationBuilder.CreateIndex(
                name: "IX_movimiento_pago_trabajo_historial_id",
                table: "movimiento_pago",
                column: "trabajo_historial_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "movimiento_pago");

            migrationBuilder.DropColumn(
                name: "fecha_creacion",
                table: "pago");

            migrationBuilder.RenameColumn(
                name: "porcentaje_comision_lex",
                table: "pago",
                newName: "porcentaje_comision");

            migrationBuilder.RenameColumn(
                name: "monto_comision_calculada",
                table: "pago",
                newName: "monto_estudiante");

            migrationBuilder.RenameColumn(
                name: "monto_a_estudiante",
                table: "pago",
                newName: "comision_lex");

            migrationBuilder.AlterColumn<int>(
                name: "estado",
                table: "pago",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_retencion",
                table: "pago",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "metodo_pago",
                table: "pago",
                type: "text",
                nullable: true);
        }
    }
}
