using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Necesidad de un paciente que publica un estudiante para una materia concreta (Banco de
// Turnos). Agregado independiente del marketplace: no tiene Trabajo, Pago ni Sesion.
//
// El estado persistido es Publicada | Cubierta | Realizada | Cancelada. Vencida NUNCA se
// guarda: es una Publicada cuya fecha ya paso, y se resuelve al consultar (ver
// README_PRACTICAS.md).
[Table("practica_clinica")]
public class PracticaClinica
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("estudiante_id")]
    public int EstudianteId { get; set; }

    [Column("materia_id")]
    public int MateriaId { get; set; }

    [Column("fecha_hora_inicio")]
    public DateTime FechaHoraInicio { get; set; }

    [Column("duracion_minutos")]
    public int DuracionMinutos { get; set; }

    // Catedra, aula o clinica donde se hace la practica, en texto libre.
    [Column("lugar")]
    public string Lugar { get; set; } = null!;

    [Column("tipo_paciente_requerido")]
    public TipoPaciente TipoPacienteRequerido { get; set; }

    // Lo que el paciente tiene que cumplir antes de venir (ej. "plan de vacunacion al dia").
    // Se muestra antes de inscribirse y la inscripcion exige aceptarlo.
    [Column("requisitos_previos", TypeName = "text")]
    public string? RequisitosPrevios { get; set; }

    [Column("estado")]
    public EstadoPracticaClinica Estado { get; set; } = EstadoPracticaClinica.Publicada;

    // Punto de extension para una decision comercial abierta (gratis vs. precio bajo).
    // Siempre null en el MVP y SIN ninguna logica asociada: no se lee, no se valida y no
    // viaja en ningun DTO.
    [Column("arancel")]
    public decimal? Arancel { get; set; }

    [Column("fecha_creacion")]
    public DateTime FechaCreacion { get; set; }

    [Column("fecha_cancelacion")]
    public DateTime? FechaCancelacion { get; set; }

    [Column("motivo_cancelacion", TypeName = "text")]
    public string? MotivoCancelacion { get; set; }

    // Navegacion
    public PerfilEstudiante Estudiante { get; set; } = null!;
    public Materia Materia { get; set; } = null!;
    public ICollection<InscripcionPractica> Inscripciones { get; set; } = new List<InscripcionPractica>();
    public ConstanciaPractica? Constancia { get; set; }
}
