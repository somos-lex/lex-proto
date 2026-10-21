using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Lex.Api.Common;

// Lectura de errores de Postgres que el negocio necesita distinguir. El middleware solo
// conoce 400/403/404: una violacion de indice unico que se escape llega como 500, asi que
// el service que depende de un UNIQUE la atrapa y la traduce a un mensaje claro.
public static class ErroresPostgres
{
    private const string UniqueViolation = "23505";

    /// <summary>
    /// true si el SaveChanges fallo por un indice/constraint unico. Con constraint, solo si
    /// fue ese (nombre exacto del indice en la base).
    /// </summary>
    public static bool EsViolacionUnica(DbUpdateException ex, string? constraint = null) =>
        ex.InnerException is PostgresException pg
        && pg.SqlState == UniqueViolation
        && (constraint is null || pg.ConstraintName == constraint);
}
