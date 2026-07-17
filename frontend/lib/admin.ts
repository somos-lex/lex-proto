// Panel de ingresos de LEX (solo rol Admin). Espeja IngresosAdminResponse del backend.

import { apiFetch } from "./api";
import type { TipoServicio } from "./servicios";

export interface IngresosPorVertical {
  cantidadTrabajos: number;
  comisionLiberada: number;
  comisionRetenida: number;
}

export interface IngresosAdminResponse {
  comisionLiberada: number; // efectiva (pagos liberados)
  comisionRetenida: number; // potencial (pagos retenidos)
  comisionTotal: number; // liberada + retenida (no incluye reembolsadas)
  cantidadTrabajosConPago: number;
  cantidadPagosLiberados: number;
  cantidadPagosRetenidos: number;
  cantidadPagosReembolsados: number;
  ingresoPromedioPorTrabajoCompletado: number;
  // Keys: "ProyectoCerrado" | "Clase" | "Salud".
  breakdownPorVertical: Record<TipoServicio, IngresosPorVertical>;
}

export function obtenerIngresosAdmin(): Promise<IngresosAdminResponse> {
  return apiFetch<IngresosAdminResponse>("/api/admin/ingresos");
}
