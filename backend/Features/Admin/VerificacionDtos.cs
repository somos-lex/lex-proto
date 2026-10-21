using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Admin;

// Un vinculo estudiante-carrera esperando la verificacion institucional del admin.
public record VerificacionPendienteResponse(
    int EstudianteId,
    string EstudianteNombre,
    string EstudianteEmail,
    int CarreraId,
    string CarreraNombre,
    string InstitucionNombre,
    int? AnioCursado,
    string? DocumentoComprobante,
    DateTime FechaRegistroUsuario
);

// Resultado de aprobar o rechazar: el vinculo como quedo.
public record VerificacionResueltaResponse(
    int EstudianteId,
    int CarreraId,
    EstadoVerificacion EstadoVerificacion,
    DateTime FechaVerificacion,
    int VerificadoPorUsuarioId,
    string? ObservacionesVerificacion,
    string? MotivoRechazo
);

// Los atributos de validacion van sobre el parametro del constructor, no sobre la
// propiedad: en un record posicional MVC rechaza la metadata puesta en la propiedad.
public record AprobarVerificacionRequest(
    [MaxLength(1000)] string? Observaciones
);

public record RechazarVerificacionRequest(
    [Required, MaxLength(1000)] string Motivo
);
