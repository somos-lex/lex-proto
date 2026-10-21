using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lex.Api.Migrations
{
    /// <inheritdoc />
    public partial class VerificacionEstudiantes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "motivo_rechazo",
                table: "estudiante_carrera",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "observaciones_verificacion",
                table: "estudiante_carrera",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "verificado_por_usuario_id",
                table: "estudiante_carrera",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_estudiante_carrera_verificado_por_usuario_id",
                table: "estudiante_carrera",
                column: "verificado_por_usuario_id");

            migrationBuilder.AddForeignKey(
                name: "FK_estudiante_carrera_usuario_verificado_por_usuario_id",
                table: "estudiante_carrera",
                column: "verificado_por_usuario_id",
                principalTable: "usuario",
                principalColumn: "usuario_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_estudiante_carrera_usuario_verificado_por_usuario_id",
                table: "estudiante_carrera");

            migrationBuilder.DropIndex(
                name: "IX_estudiante_carrera_verificado_por_usuario_id",
                table: "estudiante_carrera");

            migrationBuilder.DropColumn(
                name: "motivo_rechazo",
                table: "estudiante_carrera");

            migrationBuilder.DropColumn(
                name: "observaciones_verificacion",
                table: "estudiante_carrera");

            migrationBuilder.DropColumn(
                name: "verificado_por_usuario_id",
                table: "estudiante_carrera");
        }
    }
}
