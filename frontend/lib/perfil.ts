// Identidad del usuario y catálogo de carreras.
//
// La "identidad" (GET /api/perfil/yo) es la fuente de verdad de qué puede ver y
// hacer el usuario: sus roles reales (leídos de la base, no del token), si es
// cliente Particular/Empresa, si ya es estudiante y si puede activarse como tal.
// El sistema de "vistas" del frontend se deriva de acá.

import { apiFetch } from "./api";
import type { Rol } from "./session";

export type TipoCliente = "Particular" | "Empresa";

/** Las "vistas" que puede habitar un usuario. Cada una define navbar + paneles. */
export type Vista = "Cliente" | "Estudiante" | "Agencia";

export interface CarreraEstudiante {
  carreraId: number;
  carreraNombre: string;
  bio: string | null;
  anioCursado: number | null;
}

export interface Identidad {
  roles: Rol[];
  tipoCliente: TipoCliente | null;
  esEstudiante: boolean;
  puedeActivarEstudiante: boolean;
  carreras: CarreraEstudiante[];
}

export interface Carrera {
  carreraId: number;
  nombre: string;
}

/** Identidad del usuario autenticado. Refleja el estado real en la base. */
export function obtenerIdentidad(): Promise<Identidad> {
  return apiFetch<Identidad>("/api/perfil/yo");
}

// El backend puede nombrar los campos de carrera de varias formas; normalizamos
// para que el selector funcione sin acoplarnos a un nombre exacto.
interface CarreraRaw {
  carreraId?: number;
  id?: number;
  nombre?: string;
  carreraNombre?: string;
}

/** Catálogo público de carreras para poblar selectores. */
export async function listarCarreras(): Promise<Carrera[]> {
  const data = await apiFetch<CarreraRaw[]>("/api/catalogo/carreras", {
    auth: false,
  });
  return data
    .map((c) => ({
      carreraId: c.carreraId ?? c.id ?? 0,
      nombre: c.nombre ?? c.carreraNombre ?? "Carrera",
    }))
    .filter((c) => c.carreraId > 0);
}

export interface ActivarEstudianteInput {
  carreraId: number;
  bio: string;
  anioCursado: number;
}

/** Agrega el rol Estudiante al usuario. OJO: el token viejo no tendrá el rol
 *  nuevo hasta re-loguear (ver refrescarSesion en AuthContext). */
export function activarEstudiante(input: ActivarEstudianteInput): Promise<void> {
  return apiFetch<void>("/api/perfil/activar-estudiante", {
    method: "POST",
    body: input,
  });
}

// --- Helpers de vistas (derivados de la identidad) ---

/** Vistas que el usuario tiene disponibles según sus roles. */
export function vistasDisponiblesDe(identidad: Identidad | null): Vista[] {
  if (!identidad) return [];
  const vistas: Vista[] = [];
  if (identidad.roles.includes("Cliente")) vistas.push("Cliente");
  if (identidad.esEstudiante || identidad.roles.includes("Estudiante")) {
    vistas.push("Estudiante");
  }
  if (identidad.roles.includes("Agencia")) vistas.push("Agencia");
  return vistas;
}

/** Vista por defecto al iniciar sesión: Cliente para clientes, luego Agencia,
 *  luego Estudiante. */
export function vistaPorDefecto(identidad: Identidad | null): Vista | null {
  const vistas = vistasDisponiblesDe(identidad);
  if (vistas.includes("Cliente")) return "Cliente";
  if (vistas.includes("Agencia")) return "Agencia";
  if (vistas.includes("Estudiante")) return "Estudiante";
  return vistas[0] ?? null;
}

export const VISTA_META: Record<Vista, { label: string }> = {
  Cliente: { label: "Cliente" },
  Estudiante: { label: "Estudiante" },
  Agencia: { label: "Agencia" },
};
