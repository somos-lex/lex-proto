using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Vertical de catalogo LIBRE: no hay FK a CatalogoServicio. El estudiante
// describe materia y nivel en texto, sin restriccion por carrera.
[Table("servicio_clase")]
public class ServicioClase : Servicio
{
    [Column("materia")]
    public string Materia { get; set; } = null!;

    [Column("nivel")]
    public NivelClase Nivel { get; set; }

    [Column("modalidad")]
    public ModalidadClase Modalidad { get; set; }

    [Column("duracion_minutos_sesion")]
    public int DuracionMinutosSesion { get; set; } = 60;

    [Column("es_paquete")]
    public bool EsPaquete { get; set; }

    // Requerido solo si EsPaquete = true (se valida en el service).
    [Column("cantidad_sesiones_paquete")]
    public int? CantidadSesionesPaquete { get; set; }
}
