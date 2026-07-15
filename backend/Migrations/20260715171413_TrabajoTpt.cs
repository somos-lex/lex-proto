using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lex.Api.Migrations
{
    /// <inheritdoc />
    public partial class TrabajoTpt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Limpieza de datos transaccionales antes de aplicar cambios estructurales.
            // Los datos base del catálogo se preservan (roles, instituciones, carreras,
            // catálogo cerrado, supervisores, admin). El DemoService repuebla trabajos,
            // servicios y pacientes al arrancar (borra-y-recarga por email @demo.com).
            //
            // Nota de orden: se respeta la dirección de las FKs (hijos antes que padres).
            // Las tablas hijas TPT de 'trabajo' (trabajo_proyecto_cerrado/clase/salud) se
            // CREAN en esta misma migración; al inicio de Up() aún no existen, por eso el
            // borrado va guardado con to_regclass (cubre datos residuales si existieran).
            // 'paciente' todavía se llama 'pacientes' en este punto (el rename es posterior).
            migrationBuilder.Sql(@"
                DELETE FROM resena;
                DELETE FROM pago;
                DELETE FROM trabajo_historial;
                DELETE FROM consentimiento;
                DO $$
                BEGIN
                    IF to_regclass('public.trabajo_proyecto_cerrado') IS NOT NULL THEN DELETE FROM trabajo_proyecto_cerrado; END IF;
                    IF to_regclass('public.trabajo_clase') IS NOT NULL THEN DELETE FROM trabajo_clase; END IF;
                    IF to_regclass('public.trabajo_salud') IS NOT NULL THEN DELETE FROM trabajo_salud; END IF;
                END $$;
                DELETE FROM trabajo;
                DELETE FROM postulacion;
                DELETE FROM solicitud;
                DELETE FROM pacientes;
                DELETE FROM servicio_proyecto_cerrado;
                DELETE FROM servicio_clase;
                DELETE FROM servicio_salud;
                DELETE FROM servicio;
            ");

            migrationBuilder.DropForeignKey(
                name: "FK_consentimiento_pacientes_paciente_id",
                table: "consentimiento");

            migrationBuilder.DropForeignKey(
                name: "FK_consentimiento_trabajo_trabajo_id",
                table: "consentimiento");

            migrationBuilder.DropForeignKey(
                name: "FK_pacientes_perfil_cliente_cliente_id",
                table: "pacientes");

            migrationBuilder.DropForeignKey(
                name: "FK_trabajo_pacientes_paciente_id",
                table: "trabajo");

            migrationBuilder.DropForeignKey(
                name: "FK_trabajo_postulacion_postulacion_id",
                table: "trabajo");

            migrationBuilder.DropIndex(
                name: "IX_trabajo_paciente_id",
                table: "trabajo");

            migrationBuilder.DropIndex(
                name: "IX_trabajo_postulacion_id",
                table: "trabajo");

            migrationBuilder.DropIndex(
                name: "IX_consentimiento_paciente_id",
                table: "consentimiento");

            migrationBuilder.DropPrimaryKey(
                name: "PK_pacientes",
                table: "pacientes");

            migrationBuilder.DropColumn(
                name: "origen",
                table: "trabajo");

            migrationBuilder.DropColumn(
                name: "paciente_id",
                table: "trabajo");

            migrationBuilder.DropColumn(
                name: "postulacion_id",
                table: "trabajo");

            migrationBuilder.DropColumn(
                name: "aceptado",
                table: "consentimiento");

            migrationBuilder.DropColumn(
                name: "paciente_id",
                table: "consentimiento");

            migrationBuilder.DropColumn(
                name: "supervisor_responsable",
                table: "consentimiento");

            migrationBuilder.DropColumn(
                name: "edad",
                table: "pacientes");

            migrationBuilder.RenameTable(
                name: "pacientes",
                newName: "paciente");

            migrationBuilder.RenameColumn(
                name: "monto",
                table: "trabajo",
                newName: "precio_acordado");

            migrationBuilder.RenameColumn(
                name: "trabajo_id",
                table: "consentimiento",
                newName: "trabajo_salud_id");

            migrationBuilder.RenameColumn(
                name: "texto_consentimiento",
                table: "consentimiento",
                newName: "ip_aceptacion");

            migrationBuilder.RenameIndex(
                name: "IX_consentimiento_trabajo_id",
                table: "consentimiento",
                newName: "IX_consentimiento_trabajo_salud_id");

            migrationBuilder.RenameColumn(
                name: "notas",
                table: "paciente",
                newName: "raza");

            migrationBuilder.RenameColumn(
                name: "cliente_id",
                table: "paciente",
                newName: "cliente_responsable_id");

            migrationBuilder.RenameColumn(
                name: "paciente_id",
                table: "paciente",
                newName: "id");

            migrationBuilder.RenameIndex(
                name: "IX_pacientes_cliente_id",
                table: "paciente",
                newName: "IX_paciente_cliente_responsable_id");

            migrationBuilder.AlterColumn<int>(
                name: "servicio_id",
                table: "trabajo",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "estado",
                table: "trabajo",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "descripcion_snapshot",
                table: "trabajo",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "titulo_snapshot",
                table: "trabajo",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<DateTime>(
                name: "fecha_aceptacion",
                table: "consentimiento",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "aceptado_por_usuario_id",
                table: "consentimiento",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "texto_completo",
                table: "consentimiento",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "contacto_emergencia_nombre",
                table: "paciente",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "contacto_emergencia_telefono",
                table: "paciente",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "dni",
                table: "paciente",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "es_titular",
                table: "paciente",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "especie",
                table: "paciente",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_nacimiento",
                table: "paciente",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notas_relevantes",
                table: "paciente",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo",
                table: "paciente",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_paciente",
                table: "paciente",
                column: "id");

            migrationBuilder.CreateTable(
                name: "trabajo_clase",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    materia_snapshot = table.Column<string>(type: "text", nullable: false),
                    nivel_snapshot = table.Column<string>(type: "text", nullable: false),
                    modalidad_snapshot = table.Column<string>(type: "text", nullable: false),
                    duracion_minutos_sesion_snapshot = table.Column<int>(type: "integer", nullable: false),
                    es_paquete_snapshot = table.Column<bool>(type: "boolean", nullable: false),
                    cantidad_sesiones_totales = table.Column<int>(type: "integer", nullable: false),
                    sesiones_completadas = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trabajo_clase", x => x.id);
                    table.ForeignKey(
                        name: "FK_trabajo_clase_trabajo_id",
                        column: x => x.id,
                        principalTable: "trabajo",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trabajo_proyecto_cerrado",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    plazo_entrega_fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    revisiones_maximas = table.Column<int>(type: "integer", nullable: false),
                    revisiones_usadas = table.Column<int>(type: "integer", nullable: false),
                    formato_entrega_snapshot = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trabajo_proyecto_cerrado", x => x.id);
                    table.ForeignKey(
                        name: "FK_trabajo_proyecto_cerrado_trabajo_id",
                        column: x => x.id,
                        principalTable: "trabajo",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trabajo_salud",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    catalogo_servicio_id_snapshot = table.Column<int>(type: "integer", nullable: false),
                    catalogo_servicio_nombre_snapshot = table.Column<string>(type: "text", nullable: false),
                    catalogo_servicio_anio_minimo_snapshot = table.Column<int>(type: "integer", nullable: false),
                    supervisor_id_snapshot = table.Column<int>(type: "integer", nullable: false),
                    supervisor_nombre_snapshot = table.Column<string>(type: "text", nullable: false),
                    supervisor_matricula_snapshot = table.Column<string>(type: "text", nullable: false),
                    paciente_id = table.Column<int>(type: "integer", nullable: false),
                    modalidad_salud_snapshot = table.Column<string>(type: "text", nullable: false),
                    duracion_minutos_sesion_snapshot = table.Column<int>(type: "integer", nullable: false),
                    consentimiento_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trabajo_salud", x => x.id);
                    table.ForeignKey(
                        name: "FK_trabajo_salud_consentimiento_consentimiento_id",
                        column: x => x.consentimiento_id,
                        principalTable: "consentimiento",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_trabajo_salud_paciente_paciente_id",
                        column: x => x.paciente_id,
                        principalTable: "paciente",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_trabajo_salud_trabajo_id",
                        column: x => x.id,
                        principalTable: "trabajo",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_consentimiento_aceptado_por_usuario_id",
                table: "consentimiento",
                column: "aceptado_por_usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_trabajo_salud_consentimiento_id",
                table: "trabajo_salud",
                column: "consentimiento_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_trabajo_salud_paciente_id",
                table: "trabajo_salud",
                column: "paciente_id");

            migrationBuilder.AddForeignKey(
                name: "FK_consentimiento_usuario_aceptado_por_usuario_id",
                table: "consentimiento",
                column: "aceptado_por_usuario_id",
                principalTable: "usuario",
                principalColumn: "usuario_id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_paciente_perfil_cliente_cliente_responsable_id",
                table: "paciente",
                column: "cliente_responsable_id",
                principalTable: "perfil_cliente",
                principalColumn: "usuario_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_consentimiento_usuario_aceptado_por_usuario_id",
                table: "consentimiento");

            migrationBuilder.DropForeignKey(
                name: "FK_paciente_perfil_cliente_cliente_responsable_id",
                table: "paciente");

            migrationBuilder.DropTable(
                name: "trabajo_clase");

            migrationBuilder.DropTable(
                name: "trabajo_proyecto_cerrado");

            migrationBuilder.DropTable(
                name: "trabajo_salud");

            migrationBuilder.DropIndex(
                name: "IX_consentimiento_aceptado_por_usuario_id",
                table: "consentimiento");

            migrationBuilder.DropPrimaryKey(
                name: "PK_paciente",
                table: "paciente");

            migrationBuilder.DropColumn(
                name: "descripcion_snapshot",
                table: "trabajo");

            migrationBuilder.DropColumn(
                name: "titulo_snapshot",
                table: "trabajo");

            migrationBuilder.DropColumn(
                name: "aceptado_por_usuario_id",
                table: "consentimiento");

            migrationBuilder.DropColumn(
                name: "texto_completo",
                table: "consentimiento");

            migrationBuilder.DropColumn(
                name: "contacto_emergencia_nombre",
                table: "paciente");

            migrationBuilder.DropColumn(
                name: "contacto_emergencia_telefono",
                table: "paciente");

            migrationBuilder.DropColumn(
                name: "dni",
                table: "paciente");

            migrationBuilder.DropColumn(
                name: "es_titular",
                table: "paciente");

            migrationBuilder.DropColumn(
                name: "especie",
                table: "paciente");

            migrationBuilder.DropColumn(
                name: "fecha_nacimiento",
                table: "paciente");

            migrationBuilder.DropColumn(
                name: "notas_relevantes",
                table: "paciente");

            migrationBuilder.DropColumn(
                name: "tipo",
                table: "paciente");

            migrationBuilder.RenameTable(
                name: "paciente",
                newName: "pacientes");

            migrationBuilder.RenameColumn(
                name: "precio_acordado",
                table: "trabajo",
                newName: "monto");

            migrationBuilder.RenameColumn(
                name: "trabajo_salud_id",
                table: "consentimiento",
                newName: "trabajo_id");

            migrationBuilder.RenameColumn(
                name: "ip_aceptacion",
                table: "consentimiento",
                newName: "texto_consentimiento");

            migrationBuilder.RenameIndex(
                name: "IX_consentimiento_trabajo_salud_id",
                table: "consentimiento",
                newName: "IX_consentimiento_trabajo_id");

            migrationBuilder.RenameColumn(
                name: "raza",
                table: "pacientes",
                newName: "notas");

            migrationBuilder.RenameColumn(
                name: "cliente_responsable_id",
                table: "pacientes",
                newName: "cliente_id");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "pacientes",
                newName: "paciente_id");

            migrationBuilder.RenameIndex(
                name: "IX_paciente_cliente_responsable_id",
                table: "pacientes",
                newName: "IX_pacientes_cliente_id");

            migrationBuilder.AlterColumn<int>(
                name: "servicio_id",
                table: "trabajo",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "estado",
                table: "trabajo",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "origen",
                table: "trabajo",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "paciente_id",
                table: "trabajo",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "postulacion_id",
                table: "trabajo",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "fecha_aceptacion",
                table: "consentimiento",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<bool>(
                name: "aceptado",
                table: "consentimiento",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "paciente_id",
                table: "consentimiento",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "supervisor_responsable",
                table: "consentimiento",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "edad",
                table: "pacientes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_pacientes",
                table: "pacientes",
                column: "paciente_id");

            migrationBuilder.CreateIndex(
                name: "IX_trabajo_paciente_id",
                table: "trabajo",
                column: "paciente_id");

            migrationBuilder.CreateIndex(
                name: "IX_trabajo_postulacion_id",
                table: "trabajo",
                column: "postulacion_id");

            migrationBuilder.CreateIndex(
                name: "IX_consentimiento_paciente_id",
                table: "consentimiento",
                column: "paciente_id");

            migrationBuilder.AddForeignKey(
                name: "FK_consentimiento_pacientes_paciente_id",
                table: "consentimiento",
                column: "paciente_id",
                principalTable: "pacientes",
                principalColumn: "paciente_id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_consentimiento_trabajo_trabajo_id",
                table: "consentimiento",
                column: "trabajo_id",
                principalTable: "trabajo",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_pacientes_perfil_cliente_cliente_id",
                table: "pacientes",
                column: "cliente_id",
                principalTable: "perfil_cliente",
                principalColumn: "usuario_id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_trabajo_pacientes_paciente_id",
                table: "trabajo",
                column: "paciente_id",
                principalTable: "pacientes",
                principalColumn: "paciente_id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_trabajo_postulacion_postulacion_id",
                table: "trabajo",
                column: "postulacion_id",
                principalTable: "postulacion",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
