// Tipos + helpers del escrow. Espejan PagoResumenResponse / PagoDetalleResponse.
// El backend serializa Estado y TipoTrabajo como string.
//
// Ojo: resumen y detalle NO comparten shape. El resumen trae `rolUsuario` (el rol del
// usuario logueado en ese pago) y el detalle no; el detalle trae `porcentajeComisionLex`
// y el libro de `movimientos`, que el resumen no. Por eso van como interfaces separadas.

import { apiFetch } from "./api";
import type { TipoServicio } from "./servicios";

export type EstadoPago =
  | "Retenido"
  | "ParcialmenteLiberado"
  | "Liberado"
  | "Reembolsado"
  | "EnDisputa";

export type TipoMovimientoPago =
  | "Retencion"
  | "LiberacionEstudiante"
  | "ComisionLex"
  | "Reembolso"
  | "Ajuste";

// GET /api/pagos/mios
export interface PagoResumenResponse {
  id: number;
  trabajoId: number;
  tituloTrabajo: string;
  tipoTrabajo: TipoServicio;
  rolUsuario: "Cliente" | "Estudiante";
  montoTotal: number;
  montoAEstudiante: number;
  montoComisionCalculada: number;
  estado: EstadoPago;
  fechaCreacion: string;
  fechaLiberacion: string | null;
}

// Un asiento del libro contable de un pago.
export interface MovimientoPagoResponse {
  id: number;
  tipo: TipoMovimientoPago;
  monto: number;
  descripcion: string;
  fechaMovimiento: string;
}

// GET /api/pagos/{id}
export interface PagoDetalleResponse {
  id: number;
  trabajoId: number;
  tituloTrabajo: string;
  tipoTrabajo: TipoServicio;
  montoTotal: number;
  porcentajeComisionLex: number;
  montoComisionCalculada: number;
  montoAEstudiante: number;
  estado: EstadoPago;
  fechaCreacion: string;
  fechaLiberacion: string | null;
  movimientos: MovimientoPagoResponse[];
}

export interface ListarMisPagosParams {
  estado?: EstadoPago;
  tipoTrabajo?: TipoServicio;
}

export function listarMisPagos(
  params: ListarMisPagosParams = {},
): Promise<PagoResumenResponse[]> {
  const qs = new URLSearchParams();
  if (params.estado) qs.set("estado", params.estado);
  if (params.tipoTrabajo) qs.set("tipo_trabajo", params.tipoTrabajo);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<PagoResumenResponse[]>(`/api/pagos/mios${suffix}`);
}

export function obtenerPagoDetalle(id: number): Promise<PagoDetalleResponse> {
  return apiFetch<PagoDetalleResponse>(`/api/pagos/${id}`);
}

export function listarMovimientosDePago(
  pagoId: number,
): Promise<MovimientoPagoResponse[]> {
  return apiFetch<MovimientoPagoResponse[]>(
    `/api/pagos/${pagoId}/movimientos`,
  );
}
