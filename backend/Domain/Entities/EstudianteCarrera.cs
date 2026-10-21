using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Clave primaria compuesta (estudiante_id, carrera_id) — configurada en AppDbContext.
[Table("estudiante_carrera")]
public class EstudianteCarrera
{
    [Column("estudiante_id")]
    public int EstudianteId { get; set; }

    [Column("carrera_id")]
    public int CarreraId { get; set; }

    [Column("estado_verificacion")]
    public EstadoVerificacion EstadoVerificacion { get; set; } = EstadoVerificacion.Pendiente;

    // Fecha de la ultima resolucion del admin, sea aprobacion o rechazo.
    [Column("fecha_verificacion")]
    public DateTime? FechaVerificacion { get; set; }

    [Column("documento_comprobante")]
    public string? DocumentoComprobante { get; set; }

    // Admin que resolvio la ultima vez. Null mientras siga Pendiente (o si lo sembro el seed).
    [Column("verificado_por_usuario_id")]
    public int? VerificadoPorUsuarioId { get; set; }

    [Column("observaciones_verificacion", TypeName = "text")]
    public string? ObservacionesVerificacion { get; set; }

    // Se limpia al aprobar: un vinculo verificado no arrastra el motivo de un rechazo viejo.
    [Column("motivo_rechazo", TypeName = "text")]
    public string? MotivoRechazo { get; set; }

    // Navegacion
    public PerfilEstudiante Estudiante { get; set; } = null!;
    public Carrera Carrera { get; set; } = null!;
    public Usuario? VerificadoPor { get; set; }
}
