using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Vertical Clase del motor transaccional. Congela materia, nivel, modalidad y
// duracion. CantidadSesionesTotales NO es snapshot: es el numero real acordado
// (1 si no es paquete, N si el cliente contrato un paquete).
[Table("trabajo_clase")]
public class TrabajoClase : Trabajo
{
    [Column("materia_snapshot")]
    public string MateriaSnapshot { get; set; } = null!;

    [Column("nivel_snapshot")]
    public NivelClase NivelSnapshot { get; set; }

    [Column("modalidad_snapshot")]
    public ModalidadClase ModalidadSnapshot { get; set; }

    [Column("duracion_minutos_sesion_snapshot")]
    public int DuracionMinutosSesionSnapshot { get; set; }

    [Column("es_paquete_snapshot")]
    public bool EsPaqueteSnapshot { get; set; }

    // Numero real de sesiones acordadas (no snapshot).
    [Column("cantidad_sesiones_totales")]
    public int CantidadSesionesTotales { get; set; }

    [Column("sesiones_completadas")]
    public int SesionesCompletadas { get; set; }
}
