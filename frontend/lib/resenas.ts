// Tipos + helpers de reseñas. Espejan ResenaResponse del backend.
// Una reseña la deja una parte de un trabajo Completado sobre la otra parte.

import { apiFetch } from "./api";

export interface ResenaResponse {
  id: number;
  trabajoId: number;
  autorUsuarioId: number;
  autorNombre: string;
  receptorUsuarioId: number;
  puntaje: number;
  comentario: string | null;
  fecha: string; // ISO
}

export interface CrearResenaRequest {
  puntaje: number; // 1..5
  comentario?: string;
}

/** Reseñas recibidas por un usuario (reputación pública). No requiere sesión. */
export function listarResenasUsuario(
  usuarioId: number,
): Promise<ResenaResponse[]> {
  return apiFetch<ResenaResponse[]>(`/api/usuarios/${usuarioId}/resenas`, {
    auth: false,
  });
}

/** Reseñas de un trabajo puntual (ambas partes). Requiere ser parte del trabajo. */
export function listarResenasTrabajo(
  trabajoId: number,
): Promise<ResenaResponse[]> {
  return apiFetch<ResenaResponse[]>(`/api/trabajos/${trabajoId}/resenas`);
}

/** Deja una reseña sobre la otra parte de un trabajo Completado.
 *  El backend valida: estado Completado (400), ser parte (403) y una sola
 *  reseña por parte (400). */
export function crearResenaTrabajo(
  trabajoId: number,
  req: CrearResenaRequest,
): Promise<ResenaResponse> {
  return apiFetch<ResenaResponse>(`/api/trabajos/${trabajoId}/resenas`, {
    method: "POST",
    body: req,
  });
}
