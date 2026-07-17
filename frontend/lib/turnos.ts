// Tipos + helpers de turnos y slots de agenda. Espejan TurnoResponse / SlotDisponibleResponse.
// Las fechas van en UTC; la conversion a hora argentina la hace el cliente.
//
// El backend distingue el listado (TurnoResponse, sin notas) del detalle
// (TurnoDetalleResponse, con notas y la sesion asociada).

import { apiFetch } from "./api";

export type EstadoTurno =
  | "Reservado"
  | "Confirmado"
  | "Realizado"
  | "Cancelado"
  | "Ausente";

// GET /api/turnos/mios
export interface TurnoResponse {
  id: number;
  estudianteId: number;
  estudianteNombre: string;
  clienteId: number;
  clienteNombre: string;
  rolUsuario: "Estudiante" | "Cliente"; // segun el logueado
  fechaHoraInicio: string; // ISO UTC
  fechaHoraFin: string; // ISO UTC
  duracionMinutos: number;
  estado: EstadoTurno;
  linkVideollamada: string | null;
  fechaCreacion: string;
}

// La sesion vista desde su turno (bloque anidado del detalle).
export interface SesionDeTurno {
  id: number;
  trabajoId: number;
  tituloTrabajo: string;
  numeroSesion: number;
  estado: string;
}

// GET /api/turnos/{id}: turno con notas y la sesion que lo consume, si tiene.
export interface TurnoDetalleResponse {
  id: number;
  estudianteId: number;
  estudianteNombre: string;
  clienteId: number;
  clienteNombre: string;
  rolUsuario: "Estudiante" | "Cliente";
  fechaHoraInicio: string; // ISO UTC
  fechaHoraFin: string; // ISO UTC
  duracionMinutos: number;
  estado: EstadoTurno;
  linkVideollamada: string | null;
  notasEstudiante: string | null;
  notasCliente: string | null;
  fechaCreacion: string;
  sesion: SesionDeTurno | null;
}

// Hueco libre en la agenda del estudiante (se calcula al vuelo, no es una entidad).
export interface SlotDisponibleResponse {
  fechaHoraInicio: string; // ISO UTC
  fechaHoraFin: string; // ISO UTC
  duracionMinutos: number;
}

export interface ListarSlotsParams {
  estudianteId: number;
  desde: string; // YYYY-MM-DD (fecha local AR)
  hasta: string; // YYYY-MM-DD (fecha local AR)
  duracionMinutos: number;
}

/** Slots libres de un estudiante en un rango. Publico: se consulta antes de contratar. */
export function listarSlotsDisponibles(
  params: ListarSlotsParams,
): Promise<SlotDisponibleResponse[]> {
  const qs = new URLSearchParams({
    desde: params.desde,
    hasta: params.hasta,
    duracion_minutos: String(params.duracionMinutos),
  });
  return apiFetch<SlotDisponibleResponse[]>(
    `/api/turnos/disponibles/estudiante/${params.estudianteId}?${qs.toString()}`,
    { auth: false },
  );
}

export interface ListarMisTurnosFiltros {
  estado?: EstadoTurno;
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
}

export function listarMisTurnos(
  filtros: ListarMisTurnosFiltros = {},
): Promise<TurnoResponse[]> {
  const qs = new URLSearchParams();
  if (filtros.estado) qs.set("estado", filtros.estado);
  if (filtros.desde) qs.set("desde", filtros.desde);
  if (filtros.hasta) qs.set("hasta", filtros.hasta);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<TurnoResponse[]>(`/api/turnos/mios${suffix}`);
}

export function obtenerTurno(id: number): Promise<TurnoDetalleResponse> {
  return apiFetch<TurnoDetalleResponse>(`/api/turnos/${id}`);
}

export function cancelarTurno(
  id: number,
  motivo?: string,
): Promise<TurnoDetalleResponse> {
  return apiFetch<TurnoDetalleResponse>(`/api/turnos/${id}/cancelar`, {
    method: "POST",
    body: motivo ? { motivo } : undefined,
  });
}
