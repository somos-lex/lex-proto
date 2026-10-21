using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Constancia de comparecencia de una practica clinica. Se emite al marcar la asistencia,
// tanto si el paciente vino como si no: la ausencia tambien es un dato que el estudiante
// necesita documentar ante la catedra.
//
// Es evidencia, asi que guarda SNAPSHOTS por valor (mismo criterio que Trabajo): tiene que
// sobrevivir a cambios posteriores en la materia, la carrera, la institucion o el perfil.
// Los datos del paciente quedan para el registro interno; el endpoint publico de
// verificacion por codigo nunca los expone.
[Table("constancia_practica")]
public class ConstanciaPractica
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    // Una constancia por practica (UNIQUE): tambien frena la doble emision por doble click.
    [Column("practica_clinica_id")]
    public int PracticaClinicaId { get; set; }

    // Codigo publico de verificacion (ej. LEX-7K3M-9QXR). Aleatorio criptografico, nunca
    // derivado del id: si fuera enumerable, el endpoint publico permitiria listar
    // estudiantes y materias desde afuera. UNIQUE.
    [Column("codigo")]
    public string Codigo { get; set; } = null!;

    [Column("fecha_emision")]
    public DateTime FechaEmision { get; set; }

    // true = el paciente asistio; false = no asistio.
    [Column("asistencia_registrada")]
    public bool AsistenciaRegistrada { get; set; }

    [Column("observaciones", TypeName = "text")]
    public string? Observaciones { get; set; }

    // --- Snapshots por valor ---
    [Column("nombre_estudiante")]
    public string NombreEstudiante { get; set; } = null!;

    [Column("nombre_materia")]
    public string NombreMateria { get; set; } = null!;

    [Column("nombre_carrera")]
    public string NombreCarrera { get; set; } = null!;

    [Column("nombre_institucion")]
    public string NombreInstitucion { get; set; } = null!;

    [Column("nombre_paciente")]
    public string NombrePaciente { get; set; } = null!;

    [Column("tipo_paciente")]
    public TipoPaciente TipoPaciente { get; set; }

    [Column("fecha_practica")]
    public DateTime FechaPractica { get; set; }

    // Navegacion
    public PracticaClinica PracticaClinica { get; set; } = null!;
}
