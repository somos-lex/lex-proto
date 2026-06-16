// Tipos de dominio + helpers del motor de trabajos.
// Espejan los DTOs del backend (TrabajoResponse / TrabajoHistorialResponse).
// Los enums viajan como string (JsonStringEnumConverter en el backend).

import { apiFetch } from "./api";

export type EstadoTrabajo =
  | "Pendiente"
  | "Aceptado"
  | "EnCurso"
  | "Completado"
  | "Cancelado";

export type OrigenTrabajo = "Directo" | "Postulacion";

export interface Consentimiento {
  idConsentimiento: number;
  pacienteId: number | null;
  pacienteNombre: string | null;
  textoConsentimiento: string | null;
  aceptado: boolean;
  fechaAceptacion: string | null;
  supervisorResponsable: string | null;
}

export interface Trabajo {
  idTrabajo: number;
  estudianteId: number;
  estudianteNombre: string;
  clienteId: number;
  clienteNombre: string;
  tipoServicioId: number | null;
  tipoServicioNombre: string | null;
  origen: OrigenTrabajo;
  idServicio: number | null;
  idPostulacion: number | null;
  pacienteId: number | null;
  estado: EstadoTrabajo;
  monto: number;
  fechaCreacion: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  // Solo presente en trabajos de Salud.
  consentimiento: Consentimiento | null;
}

export interface TrabajoHistorial {
  idHistorial: number;
  estadoAnterior: EstadoTrabajo | null;
  estadoNuevo: EstadoTrabajo;
  fecha: string;
  usuarioId: number | null;
}

/** Contratación directa (Flujo 1): un cliente contrata un servicio. */
export function contratarServicio(idServicio: number): Promise<Trabajo> {
  return apiFetch<Trabajo>("/api/trabajos/contratar-servicio", {
    method: "POST",
    body: { idServicio },
  });
}

/** Contratación de Salud (Flujo 3): requiere paciente + consentimiento aceptado. */
export function contratarServicioSalud(
  idServicio: number,
  pacienteId: number,
  consentimientoAceptado: boolean,
): Promise<Trabajo> {
  return apiFetch<Trabajo>("/api/trabajos/contratar-servicio-salud", {
    method: "POST",
    body: { idServicio, pacienteId, consentimientoAceptado },
  });
}

/** Trabajos donde participa el usuario logueado (estudiante o cliente). */
export function listarMisTrabajos(): Promise<Trabajo[]> {
  return apiFetch<Trabajo[]>("/api/trabajos/mios");
}

export function obtenerTrabajo(id: number): Promise<Trabajo> {
  return apiFetch<Trabajo>(`/api/trabajos/${id}`);
}

export function cambiarEstadoTrabajo(
  id: number,
  nuevoEstado: EstadoTrabajo,
  // Solo al aceptar un trabajo de Salud: el estudiante indica el supervisor matriculado.
  supervisorResponsable?: string,
): Promise<Trabajo> {
  return apiFetch<Trabajo>(`/api/trabajos/${id}/estado`, {
    method: "PATCH",
    body: { nuevoEstado, supervisorResponsable },
  });
}

export function listarHistorialTrabajo(id: number): Promise<TrabajoHistorial[]> {
  return apiFetch<TrabajoHistorial[]>(`/api/trabajos/${id}/historial`);
}

// --- Presentación de estados ---

export const ESTADO_META: Record<
  EstadoTrabajo,
  { label: string; classes: string }
> = {
  Pendiente: { label: "Pendiente", classes: "bg-gray-100 text-gray-600 ring-gray-200" },
  Aceptado: { label: "Aceptado", classes: "bg-blue-50 text-blue-700 ring-blue-100" },
  EnCurso: { label: "En curso", classes: "bg-amber-50 text-amber-700 ring-amber-100" },
  Completado: { label: "Completado", classes: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  Cancelado: { label: "Cancelado", classes: "bg-red-50 text-red-700 ring-red-100" },
};
