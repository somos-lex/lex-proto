using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Vertical Salud del motor transaccional. Ademas de los snapshots por valor del
// catalogo y del supervisor (evidencia legal: se conservan aunque el registro
// original cambie), lleva un FK real al paciente y un consentimiento obligatorio
// para poder pasar a EnCurso.
[Table("trabajo_salud")]
public class TrabajoSalud : Trabajo
{
    // Snapshots por valor (sin FK): evidencia congelada del catalogo cerrado.
    [Column("catalogo_servicio_id_snapshot")]
    public int CatalogoServicioIdSnapshot { get; set; }

    [Column("catalogo_servicio_nombre_snapshot")]
    public string CatalogoServicioNombreSnapshot { get; set; } = null!;

    [Column("catalogo_servicio_anio_minimo_snapshot")]
    public int CatalogoServicioAnioMinimoSnapshot { get; set; }

    // Snapshots por valor del profesional matriculado responsable.
    [Column("supervisor_id_snapshot")]
    public int SupervisorIdSnapshot { get; set; }

    [Column("supervisor_nombre_snapshot")]
    public string SupervisorNombreSnapshot { get; set; } = null!;

    [Column("supervisor_matricula_snapshot")]
    public string SupervisorMatriculaSnapshot { get; set; } = null!;

    // FK real: el paciente sobre el que se realiza la practica.
    [Column("paciente_id")]
    public int PacienteId { get; set; }

    [Column("modalidad_salud_snapshot")]
    public ModalidadSalud ModalidadSaludSnapshot { get; set; }

    [Column("duracion_minutos_sesion_snapshot")]
    public int DuracionMinutosSesionSnapshot { get; set; }

    // Se llena cuando el cliente firma el consentimiento; hasta entonces el
    // trabajo queda en Pendiente/Aceptado y NO puede pasar a EnCurso.
    [Column("consentimiento_id")]
    public int? ConsentimientoId { get; set; }

    // Navegacion
    public Paciente Paciente { get; set; } = null!;
    public Consentimiento? Consentimiento { get; set; }
}
