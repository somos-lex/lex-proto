using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Practicas;

// Ningun DTO del modulo expone ni recibe Arancel: el campo existe solo como punto de
// extension en la entidad, sin logica asociada.
//
// Los atributos de validacion van sobre el parametro del constructor: en un record
// posicional MVC rechaza la metadata puesta en la propiedad.

// --- Requests ----------------------------------------------------------------

// POST /api/practicas. FechaHoraInicio es un instante (el front manda UTC con 'Z').
// TipoPacienteRequerido es nullable + Required para que un body sin el campo falle en vez
// de caer en silencio al primer valor del enum.
public record PublicarPracticaRequest(
    [Range(1, int.MaxValue)] int MateriaId,
    DateTime FechaHoraInicio,
    [Range(15, 480)] int DuracionMinutos,
    [Required, MaxLength(200)] string Lugar,
    [Required] TipoPaciente? TipoPacienteRequerido,
    [MaxLength(2000)] string? RequisitosPrevios
);

public record CancelarPracticaRequest(
    [MaxLength(1000)] string? Motivo
);

// Asistio es nullable + Required a proposito: un bool ausente valdria false y emitiria una
// constancia de inasistencia que nadie pidio.
public record RegistrarAsistenciaRequest(
    [Required] bool? Asistio,
    [MaxLength(2000)] string? Observaciones
);

public record InscribirPracticaRequest(
    [Range(1, int.MaxValue)] int PacienteId,
    bool RequisitosAceptados
);

public record CancelarInscripcionRequest(
    [MaxLength(1000)] string? Motivo
);

// --- Responses ---------------------------------------------------------------

// Lo que cualquiera puede ver de una practica publicada. Estado es el EFECTIVO: una
// Publicada con fecha pasada sale como Vencida.
public record PracticaPublicaResponse(
    int Id,
    int MateriaId,
    string MateriaNombre,
    int CarreraId,
    string CarreraNombre,
    string InstitucionNombre,
    int EstudianteId,
    string EstudianteNombre,
    DateTime FechaHoraInicio,
    DateTime FechaHoraFin,
    int DuracionMinutos,
    string Lugar,
    TipoPaciente TipoPacienteRequerido,
    string? RequisitosPrevios,
    EstadoPracticaClinica Estado
);

// Vista de las partes: lo publico mas la inscripcion vigente (con el paciente), la
// cancelacion y el codigo de la constancia si ya se emitio.
public record PracticaDetalleResponse(
    PracticaPublicaResponse Practica,
    InscripcionDePracticaResponse? Inscripcion,
    DateTime FechaCreacion,
    DateTime? FechaCancelacion,
    string? MotivoCancelacion,
    string? CodigoConstancia
);

public record PacienteDeInscripcionResponse(
    int Id,
    TipoPaciente Tipo,
    string NombreCompleto,
    DateTime? FechaNacimiento,
    string? Especie,
    string? Raza,
    string? NotasRelevantes,
    string? ContactoEmergenciaNombre,
    string? ContactoEmergenciaTelefono
);

public record InscripcionDePracticaResponse(
    int Id,
    EstadoInscripcionPractica Estado,
    int ClienteId,
    string ClienteNombre,
    PacienteDeInscripcionResponse Paciente,
    bool RequisitosAceptados,
    DateTime? FechaAceptacionRequisitos,
    DateTime FechaInscripcion
);

// GET /api/inscripciones/mias: la inscripcion vista desde el cliente, con la practica.
public record InscripcionResponse(
    int Id,
    EstadoInscripcionPractica Estado,
    PracticaPublicaResponse Practica,
    PacienteDeInscripcionResponse Paciente,
    DateTime FechaInscripcion,
    DateTime? FechaAceptacionRequisitos,
    DateTime? FechaCancelacion,
    string? MotivoCancelacion,
    string? CodigoConstancia
);

// Constancia completa: solo para el estudiante y el cliente de la practica.
public record ConstanciaResponse(
    int Id,
    int PracticaClinicaId,
    string Codigo,
    DateTime FechaEmision,
    bool AsistenciaRegistrada,
    string? Observaciones,
    string NombreEstudiante,
    string NombreMateria,
    string NombreCarrera,
    string NombreInstitucion,
    string NombrePaciente,
    TipoPaciente TipoPaciente,
    DateTime FechaPractica
);

// GET /api/constancias/{codigo}: verificacion publica para la catedra. Sin NINGUN dato del
// paciente, ni siquiera el nombre.
public record ConstanciaPublicaResponse(
    string Codigo,
    DateTime FechaEmision,
    bool AsistenciaRegistrada,
    string NombreEstudiante,
    string NombreMateria,
    string NombreCarrera,
    string NombreInstitucion,
    DateTime FechaPractica
);

// GET /api/practicas/por-recordar: lo que un scheduler externo necesita para avisar.
public record PracticaPorRecordarResponse(
    int PracticaId,
    DateTime FechaHoraInicio,
    string Lugar,
    string MateriaNombre,
    int EstudianteId,
    string EstudianteNombre,
    string EstudianteEmail,
    int ClienteId,
    string ClienteNombre,
    string ClienteEmail,
    string PacienteNombre
);
