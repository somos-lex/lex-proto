using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Lex.Api.Migrations
{
    /// <inheritdoc />
    public partial class BancoDeTurnosPracticas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "materia",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    carrera_id = table.Column<int>(type: "integer", nullable: false),
                    anio_minimo = table.Column<int>(type: "integer", nullable: false),
                    activa = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_materia", x => x.id);
                    table.ForeignKey(
                        name: "FK_materia_carrera_carrera_id",
                        column: x => x.carrera_id,
                        principalTable: "carrera",
                        principalColumn: "carrera_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "practica_clinica",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    estudiante_id = table.Column<int>(type: "integer", nullable: false),
                    materia_id = table.Column<int>(type: "integer", nullable: false),
                    fecha_hora_inicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    duracion_minutos = table.Column<int>(type: "integer", nullable: false),
                    lugar = table.Column<string>(type: "text", nullable: false),
                    tipo_paciente_requerido = table.Column<string>(type: "text", nullable: false),
                    requisitos_previos = table.Column<string>(type: "text", nullable: true),
                    estado = table.Column<string>(type: "text", nullable: false),
                    arancel = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    fecha_creacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_cancelacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    motivo_cancelacion = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_practica_clinica", x => x.id);
                    table.ForeignKey(
                        name: "FK_practica_clinica_materia_materia_id",
                        column: x => x.materia_id,
                        principalTable: "materia",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_practica_clinica_perfil_estudiante_estudiante_id",
                        column: x => x.estudiante_id,
                        principalTable: "perfil_estudiante",
                        principalColumn: "usuario_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "constancia_practica",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    practica_clinica_id = table.Column<int>(type: "integer", nullable: false),
                    codigo = table.Column<string>(type: "text", nullable: false),
                    fecha_emision = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    asistencia_registrada = table.Column<bool>(type: "boolean", nullable: false),
                    observaciones = table.Column<string>(type: "text", nullable: true),
                    nombre_estudiante = table.Column<string>(type: "text", nullable: false),
                    nombre_materia = table.Column<string>(type: "text", nullable: false),
                    nombre_carrera = table.Column<string>(type: "text", nullable: false),
                    nombre_institucion = table.Column<string>(type: "text", nullable: false),
                    nombre_paciente = table.Column<string>(type: "text", nullable: false),
                    tipo_paciente = table.Column<string>(type: "text", nullable: false),
                    fecha_practica = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_constancia_practica", x => x.id);
                    table.ForeignKey(
                        name: "FK_constancia_practica_practica_clinica_practica_clinica_id",
                        column: x => x.practica_clinica_id,
                        principalTable: "practica_clinica",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "inscripcion_practica",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    practica_clinica_id = table.Column<int>(type: "integer", nullable: false),
                    cliente_id = table.Column<int>(type: "integer", nullable: false),
                    paciente_id = table.Column<int>(type: "integer", nullable: false),
                    estado = table.Column<string>(type: "text", nullable: false),
                    requisitos_aceptados = table.Column<bool>(type: "boolean", nullable: false),
                    fecha_aceptacion_requisitos = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    fecha_inscripcion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_cancelacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    motivo_cancelacion = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inscripcion_practica", x => x.id);
                    table.ForeignKey(
                        name: "FK_inscripcion_practica_paciente_paciente_id",
                        column: x => x.paciente_id,
                        principalTable: "paciente",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_inscripcion_practica_perfil_cliente_cliente_id",
                        column: x => x.cliente_id,
                        principalTable: "perfil_cliente",
                        principalColumn: "usuario_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_inscripcion_practica_practica_clinica_practica_clinica_id",
                        column: x => x.practica_clinica_id,
                        principalTable: "practica_clinica",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_constancia_practica_codigo",
                table: "constancia_practica",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_constancia_practica_practica_clinica_id",
                table: "constancia_practica",
                column: "practica_clinica_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inscripcion_practica_cliente_id",
                table: "inscripcion_practica",
                column: "cliente_id");

            migrationBuilder.CreateIndex(
                name: "IX_inscripcion_practica_paciente_id",
                table: "inscripcion_practica",
                column: "paciente_id");

            migrationBuilder.CreateIndex(
                name: "ux_inscripcion_practica_vigente",
                table: "inscripcion_practica",
                column: "practica_clinica_id",
                unique: true,
                filter: "estado <> 'Cancelada'");

            migrationBuilder.CreateIndex(
                name: "IX_materia_carrera_id_nombre",
                table: "materia",
                columns: new[] { "carrera_id", "nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_practica_clinica_estado_fecha_hora_inicio",
                table: "practica_clinica",
                columns: new[] { "estado", "fecha_hora_inicio" });

            migrationBuilder.CreateIndex(
                name: "IX_practica_clinica_estudiante_id_fecha_hora_inicio",
                table: "practica_clinica",
                columns: new[] { "estudiante_id", "fecha_hora_inicio" });

            migrationBuilder.CreateIndex(
                name: "IX_practica_clinica_materia_id",
                table: "practica_clinica",
                column: "materia_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "constancia_practica");

            migrationBuilder.DropTable(
                name: "inscripcion_practica");

            migrationBuilder.DropTable(
                name: "practica_clinica");

            migrationBuilder.DropTable(
                name: "materia");
        }
    }
}
