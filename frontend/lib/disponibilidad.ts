// Bloques de disponibilidad semanal del estudiante. Espejan BloqueDisponibilidadResponse.
// Las horas son locales de Argentina (UTC-3), formato "HH:mm:ss" (TimeOnly del backend).

import { apiFetch } from "./api";

export type DiaSemana =
  | "Lunes"
  | "Martes"
  | "Miercoles"
  | "Jueves"
  | "Viernes"
  | "Sabado"
  | "Domingo";

export interface BloqueDisponibilidadResponse {
  id: number;
  diaSemana: DiaSemana;
  horaInicio: string; // HH:mm:ss
  horaFin: string; // HH:mm:ss
}

export interface CrearBloqueRequest {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

/** Bloques activos del estudiante autenticado. */
export function listarMiDisponibilidad(): Promise<
  BloqueDisponibilidadResponse[]
> {
  return apiFetch<BloqueDisponibilidadResponse[]>("/api/disponibilidad/mia");
}

/** Bloques activos de un estudiante (publico: se consulta antes de contratar). */
export function listarDisponibilidadDeEstudiante(
  estudianteId: number,
): Promise<BloqueDisponibilidadResponse[]> {
  return apiFetch<BloqueDisponibilidadResponse[]>(
    `/api/disponibilidad/estudiante/${estudianteId}`,
    { auth: false },
  );
}

export function crearBloque(
  req: CrearBloqueRequest,
): Promise<BloqueDisponibilidadResponse> {
  return apiFetch<BloqueDisponibilidadResponse>("/api/disponibilidad", {
    method: "POST",
    body: req,
  });
}

export function actualizarBloque(
  id: number,
  req: CrearBloqueRequest,
): Promise<BloqueDisponibilidadResponse> {
  return apiFetch<BloqueDisponibilidadResponse>(`/api/disponibilidad/${id}`, {
    method: "PUT",
    body: req,
  });
}

export function eliminarBloque(id: number): Promise<void> {
  return apiFetch<void>(`/api/disponibilidad/${id}`, { method: "DELETE" });
}

export const DIAS_SEMANA: { valor: DiaSemana; etiqueta: string }[] = [
  { valor: "Lunes", etiqueta: "Lunes" },
  { valor: "Martes", etiqueta: "Martes" },
  { valor: "Miercoles", etiqueta: "Miércoles" },
  { valor: "Jueves", etiqueta: "Jueves" },
  { valor: "Viernes", etiqueta: "Viernes" },
  { valor: "Sabado", etiqueta: "Sábado" },
  { valor: "Domingo", etiqueta: "Domingo" },
];
