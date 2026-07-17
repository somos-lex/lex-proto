// Consulta del catalogo cerrado: carreras, servicios permitidos por carrera+año y
// supervisores matriculados. Espeja los DTOs del backend (Catalogo + Perfil).
//
// Los nombres de campo siguen al backend real (CarreraCatalogoResponse / SupervisorResponse),
// que difieren de un primer borrador: la carrera usa `carreraId` e `institucion`.

import { apiFetch } from "./api";
import type { TipoServicio } from "./servicios";

// GET /api/catalogo/carreras -> CarreraCatalogoResponse
export interface CarreraResponse {
  carreraId: number;
  nombre: string;
  areaConocimiento: string | null;
  institucionId: number;
  institucion: string;
  provincia: string | null;
  ciudad: string | null;
}

// GET /api/catalogo/servicios-permitidos -> CatalogoServicioPermitidoResponse.
// Solo contiene entradas de tipo ProyectoCerrado y Salud (Clase es catalogo libre).
export interface CatalogoServicioResponse {
  id: number;
  nombre: string;
  descripcion: string;
  tipoServicio: TipoServicio;
  requiereSupervisor: boolean;
  observaciones: string | null;
  anioMinimo: number; // año minimo exigido para la carrera consultada
}

// GET /api/catalogo/supervisores -> SupervisorResponse
export interface ProfesionalSupervisorResponse {
  id: number;
  nombreCompleto: string;
  matricula: string;
  especialidad: string;
  institucionId: number | null;
  institucion: string | null;
}

export function listarCarreras(): Promise<CarreraResponse[]> {
  return apiFetch<CarreraResponse[]>("/api/catalogo/carreras", { auth: false });
}

export function listarServiciosPermitidos(
  carreraId: number,
  anio: number,
): Promise<CatalogoServicioResponse[]> {
  const qs = new URLSearchParams({
    carrera_id: String(carreraId),
    anio: String(anio),
  });
  return apiFetch<CatalogoServicioResponse[]>(
    `/api/catalogo/servicios-permitidos?${qs.toString()}`,
    { auth: false },
  );
}

export function listarSupervisores(): Promise<ProfesionalSupervisorResponse[]> {
  return apiFetch<ProfesionalSupervisorResponse[]>("/api/catalogo/supervisores", {
    auth: false,
  });
}
