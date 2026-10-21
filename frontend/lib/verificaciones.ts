// Bandeja de verificación institucional (solo rol Admin). Espeja VerificacionDtos del backend.
//
// El vínculo estudiante-carrera no tiene id propio: se direcciona por el par
// (estudianteId, carreraId), que es su clave en la base.

import { apiFetch } from "./api";

export type EstadoVerificacion = "Pendiente" | "Verificado" | "Rechazado";

export interface VerificacionPendiente {
  estudianteId: number;
  estudianteNombre: string;
  estudianteEmail: string;
  carreraId: number;
  carreraNombre: string;
  institucionNombre: string;
  anioCursado: number | null;
  documentoComprobante: string | null;
  fechaRegistroUsuario: string; // ISO
}

export interface VerificacionResuelta {
  estudianteId: number;
  carreraId: number;
  estadoVerificacion: EstadoVerificacion;
  fechaVerificacion: string; // ISO
  verificadoPorUsuarioId: number;
  observacionesVerificacion: string | null;
  motivoRechazo: string | null;
}

export function listarVerificacionesPendientes(): Promise<VerificacionPendiente[]> {
  return apiFetch<VerificacionPendiente[]>("/api/admin/verificaciones/pendientes");
}

export function aprobarVerificacion(
  estudianteId: number,
  carreraId: number,
  observaciones?: string,
): Promise<VerificacionResuelta> {
  return apiFetch<VerificacionResuelta>(
    `/api/admin/verificaciones/${estudianteId}/${carreraId}/aprobar`,
    { method: "POST", body: { observaciones: observaciones?.trim() || null } },
  );
}

export function rechazarVerificacion(
  estudianteId: number,
  carreraId: number,
  motivo: string,
): Promise<VerificacionResuelta> {
  return apiFetch<VerificacionResuelta>(
    `/api/admin/verificaciones/${estudianteId}/${carreraId}/rechazar`,
    { method: "POST", body: { motivo } },
  );
}
