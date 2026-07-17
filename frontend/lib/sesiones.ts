// Tipos + helpers de sesiones. Espejan SesionResponse del backend.
// Los datos de agenda (fecha, duracion, link) salen del turno que consume la sesion.
// Solo el estudiante marca una sesion como realizada o no-asistio (libera el pago).

import { apiFetch } from "./api";

export type EstadoSesion = "Pendiente" | "Realizada" | "Cancelada" | "NoAsistio";

export interface SesionResponse {
  id: number;
  numeroSesion: number;
  estado: EstadoSesion;
  fechaHoraInicio: string; // ISO UTC (viene del turno)
  duracionMinutos: number;
  fechaRealizada: string | null;
  observaciones: string | null;
  linkVideollamada: string | null;
}

export function listarSesionesDeTrabajo(
  trabajoId: number,
): Promise<SesionResponse[]> {
  return apiFetch<SesionResponse[]>(`/api/trabajos/${trabajoId}/sesiones`);
}

export function marcarSesionRealizada(
  id: number,
  observaciones?: string,
): Promise<SesionResponse> {
  return apiFetch<SesionResponse>(`/api/sesiones/${id}/realizar`, {
    method: "POST",
    body: observaciones ? { observaciones } : undefined,
  });
}

export function marcarSesionNoAsistio(
  id: number,
  observaciones?: string,
): Promise<SesionResponse> {
  return apiFetch<SesionResponse>(`/api/sesiones/${id}/no-asistio`, {
    method: "POST",
    body: observaciones ? { observaciones } : undefined,
  });
}
