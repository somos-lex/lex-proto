using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Inscripcion sin costo de un paciente a una practica clinica.
//
// Una practica conserva todas sus inscripciones (las canceladas quedan como historial),
// pero a lo sumo UNA vigente: indice UNIQUE parcial sobre practica_clinica_id para
// estado <> 'Cancelada' (AppDbContext). El cupo del MVP es un paciente por practica.
[Table("inscripcion_practica")]
public class InscripcionPractica
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("practica_clinica_id")]
    public int PracticaClinicaId { get; set; }

    // Perfil de cliente que inscribe y responde por el paciente.
    [Column("cliente_id")]
    public int ClienteId { get; set; }

    [Column("paciente_id")]
    public int PacienteId { get; set; }

    [Column("estado")]
    public EstadoInscripcionPractica Estado { get; set; } = EstadoInscripcionPractica.Inscripta;

    [Column("requisitos_aceptados")]
    public bool RequisitosAceptados { get; set; }

    [Column("fecha_aceptacion_requisitos")]
    public DateTime? FechaAceptacionRequisitos { get; set; }

    [Column("fecha_inscripcion")]
    public DateTime FechaInscripcion { get; set; }

    [Column("fecha_cancelacion")]
    public DateTime? FechaCancelacion { get; set; }

    [Column("motivo_cancelacion", TypeName = "text")]
    public string? MotivoCancelacion { get; set; }

    // Navegacion
    public PracticaClinica PracticaClinica { get; set; } = null!;
    public PerfilCliente Cliente { get; set; } = null!;
    public Paciente Paciente { get; set; } = null!;
}
