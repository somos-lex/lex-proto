using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lex.Api.Migrations
{
    /// <summary>
    /// Renombra la carrera de UNNE "Veterinaria" a su nombre oficial, "Medicina Veterinaria"
    /// (FCV UNNE, Res. 637/08-CS; titulo: Medico Veterinario).
    ///
    /// Es un UPDATE sobre la fila existente y no un cambio del string del seed, porque
    /// DbSeeder es idempotente POR NOMBRE: cambiar solo el seed crearia una segunda carrera
    /// con el catalogo y las materias enganchados, y dejaria la vieja con los
    /// EstudianteCarrera verificados. Los estudiantes de veterinaria se quedarian sin poder
    /// publicar, sin ningun error visible. Al renombrar la fila, carrera_id no cambia y todo
    /// lo que la referencia (estudiante_carrera, catalogo_servicio_carrera, materia) sigue
    /// apuntando al mismo lugar.
    ///
    /// Corre antes que el seed (Program.cs: MigrateAsync y despues DbSeeder), asi el seed ya
    /// encuentra el nombre nuevo. En una base vacia (tests, CI) no afecta filas y el seed
    /// crea la carrera directamente con el nombre nuevo.
    ///
    /// Guardas:
    ///  - Acotado a UNNE: otra institucion puede tener una carrera "Veterinaria" propia.
    ///    El id de UNNE no se conoce al escribir la migracion, se resuelve por nombre (con
    ///    IN y no =: institucion tampoco tiene UNIQUE por nombre, y una subconsulta de mas
    ///    de una fila haria fallar la migracion en el arranque).
    ///  - NOT EXISTS: carrera no tiene UNIQUE (institucion_id, nombre); si por algun motivo
    ///    ya existiera "Medicina Veterinaria" en UNNE, renombrar crearia un duplicado. En ese
    ///    caso no toca nada y el duplicado queda para resolver a mano, en vez de empeorarlo.
    /// </summary>
    public partial class RenombrarCarreraMedicinaVeterinaria : Migration
    {
        private const string Unne = "Universidad Nacional del Nordeste (UNNE)";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(Renombrar(desde: "Veterinaria", hacia: "Medicina Veterinaria"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(Renombrar(desde: "Medicina Veterinaria", hacia: "Veterinaria"));
        }

        private static string Renombrar(string desde, string hacia) => $"""
            UPDATE carrera
               SET nombre = '{hacia}'
             WHERE nombre = '{desde}'
               AND institucion_id IN (SELECT institucion_id FROM institucion WHERE nombre = '{Unne}')
               AND NOT EXISTS (
                   SELECT 1
                     FROM carrera otra
                    WHERE otra.nombre = '{hacia}'
                      AND otra.institucion_id = carrera.institucion_id);
            """;
    }
}
