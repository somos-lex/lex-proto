using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Vertical de catalogo cerrado + supervision: ademas del catalogo por carrera/año,
// exige un profesional matriculado responsable.
[Table("servicio_salud")]
public class ServicioSalud : Servicio
{
    [Column("catalogo_servicio_id")]
    public int CatalogoServicioId { get; set; }

    [Column("supervisor_id")]
    public int SupervisorId { get; set; }

    [Column("modalidad")]
    public ModalidadSalud Modalidad { get; set; }

    [Column("duracion_minutos_sesion")]
    public int DuracionMinutosSesion { get; set; } = 45;

    // Navegacion
    public CatalogoServicio CatalogoServicio { get; set; } = null!;
    public ProfesionalSupervisor Supervisor { get; set; } = null!;
}
