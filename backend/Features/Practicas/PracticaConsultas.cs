using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Practicas;

// Reglas de lectura compartidas por los services del modulo: el estado efectivo (Vencida
// calculada) y el mapeo a DTOs. Viven en un solo lugar para que el listado, el filtro y el
// detalle no puedan diferir sobre que es una practica vencida.
internal static class PracticaConsultas
{
    // Vencida no se persiste: es una Publicada cuya fecha ya llego. Se resuelve al leer, sin
    // job programado. Desde el inicio ya no es inscribible, asi que el corte es el inicio y
    // no el fin de la practica.
    public static EstadoPracticaClinica EstadoEfectivo(PracticaClinica p, DateTime ahora) =>
        p.Estado == EstadoPracticaClinica.Publicada && p.FechaHoraInicio <= ahora
            ? EstadoPracticaClinica.Vencida
            : p.Estado;

    // Traduce un filtro por estado EFECTIVO a un predicado sobre el estado persistido.
    public static IQueryable<PracticaClinica> FiltrarPorEstado(
        IQueryable<PracticaClinica> query, EstadoPracticaClinica estado, DateTime ahora) => estado switch
    {
        EstadoPracticaClinica.Vencida => query.Where(p =>
            p.Estado == EstadoPracticaClinica.Publicada && p.FechaHoraInicio <= ahora),
        EstadoPracticaClinica.Publicada => query.Where(p =>
            p.Estado == EstadoPracticaClinica.Publicada && p.FechaHoraInicio > ahora),
        _ => query.Where(p => p.Estado == estado)
    };

    // Lo que hace falta cargar para armar la vista publica de una practica.
    public static IQueryable<PracticaClinica> ConDatosPublicos(IQueryable<PracticaClinica> query) =>
        query
            .Include(p => p.Materia).ThenInclude(m => m.Carrera).ThenInclude(c => c.Institucion)
            .Include(p => p.Estudiante).ThenInclude(e => e.Usuario);

    public static PracticaPublicaResponse ToPublica(PracticaClinica p, DateTime ahora) => new(
        p.Id,
        p.MateriaId,
        p.Materia.Nombre,
        p.Materia.CarreraId,
        p.Materia.Carrera.Nombre,
        p.Materia.Carrera.Institucion.Nombre,
        p.EstudianteId,
        p.Estudiante.Usuario.NombreCompleto,
        p.FechaHoraInicio,
        p.FechaHoraInicio.AddMinutes(p.DuracionMinutos),
        p.DuracionMinutos,
        p.Lugar,
        p.TipoPacienteRequerido,
        p.RequisitosPrevios,
        EstadoEfectivo(p, ahora));

    public static PacienteDeInscripcionResponse ToPaciente(Paciente p) => new(
        p.Id,
        p.Tipo,
        p.NombreCompleto,
        p.FechaNacimiento,
        p.Especie,
        p.Raza,
        p.NotasRelevantes,
        p.ContactoEmergenciaNombre,
        p.ContactoEmergenciaTelefono);

    public static ConstanciaResponse ToConstancia(ConstanciaPractica c) => new(
        c.Id,
        c.PracticaClinicaId,
        c.Codigo,
        c.FechaEmision,
        c.AsistenciaRegistrada,
        c.Observaciones,
        c.NombreEstudiante,
        c.NombreMateria,
        c.NombreCarrera,
        c.NombreInstitucion,
        c.NombrePaciente,
        c.TipoPaciente,
        c.FechaPractica);

    // La inscripcion que ocupa el cupo: a lo sumo una (indice unico parcial).
    public static InscripcionPractica? Vigente(PracticaClinica p) =>
        p.Inscripciones.FirstOrDefault(i => i.Estado != EstadoInscripcionPractica.Cancelada);

    // Instante UTC a partir de lo que llego en el JSON. System.Text.Json deja Kind=Utc si
    // vino con 'Z', Local si vino con otro offset (ya convertido) y Unspecified si no traia
    // zona: este ultimo se interpreta como UTC, igual que en el resto de la API.
    public static DateTime ComoUtc(DateTime fecha) => fecha.Kind switch
    {
        DateTimeKind.Utc => fecha,
        DateTimeKind.Local => fecha.ToUniversalTime(),
        _ => DateTime.SpecifyKind(fecha, DateTimeKind.Utc)
    };
}
