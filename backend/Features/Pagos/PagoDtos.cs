namespace Lex.Api.Features.Pagos;

// GET /api/pagos/mios: una fila por pago en el que participa el usuario logueado.
public record PagoResumenResponse(
    int Id,
    int TrabajoId,
    string TituloTrabajo,
    string TipoTrabajo,  // "ProyectoCerrado" | "Clase" | "Salud"
    string RolUsuario,   // "Cliente" | "Estudiante" (segun el logueado)
    decimal MontoTotal,
    decimal MontoAEstudiante,
    decimal MontoComisionCalculada,
    string Estado,
    DateTime FechaCreacion,
    DateTime? FechaLiberacion
);

// GET /api/pagos/{id}: el pago con su libro de movimientos.
public record PagoDetalleResponse(
    int Id,
    int TrabajoId,
    string TituloTrabajo,
    string TipoTrabajo,
    decimal MontoTotal,
    decimal PorcentajeComisionLex,
    decimal MontoComisionCalculada,
    decimal MontoAEstudiante,
    string Estado,
    DateTime FechaCreacion,
    DateTime? FechaLiberacion,
    List<MovimientoPagoResponse> Movimientos
);

// Un asiento del libro contable de un pago.
public record MovimientoPagoResponse(
    int Id,
    string Tipo,
    decimal Monto,
    string Descripcion,
    DateTime FechaMovimiento
);

// GET /api/admin/ingresos: panel del modelo de ingresos de LEX.
public record IngresosAdminResponse(
    // Comision ya liberada = ingreso efectivo de LEX.
    decimal ComisionLiberada,
    // Comision retenida en escrow = ingreso potencial.
    decimal ComisionRetenida,
    // Suma de ambas (no incluye reembolsadas).
    decimal ComisionTotal,
    int CantidadTrabajosConPago,
    int CantidadPagosLiberados,
    int CantidadPagosRetenidos,
    int CantidadPagosReembolsados,
    // Comision promedio de los trabajos ya cobrados (pagos liberados). 0 si no hay ninguno.
    decimal IngresoPromedioPorTrabajoCompletado,
    // Keys: "ProyectoCerrado", "Clase", "Salud".
    Dictionary<string, IngresosPorVertical> BreakdownPorVertical
);

public record IngresosPorVertical(
    int CantidadTrabajos,
    decimal ComisionLiberada,
    decimal ComisionRetenida
);
