// Tipos de dominio + helpers de servicios. Espejan los DTOs del backend post-Hito 2:
// jerarquia TPT con 3 verticales (ProyectoCerrado / Clase / Salud) y catalogo cerrado.
//
// Importante: el backend expone DOS formas del servicio.
//   - LISTADO  (GET /api/servicios)      -> ServicioResponse: campos comunes, SIN detalle.
//   - DETALLE  (GET /api/servicios/{id}) -> ServicioDetalleResponse: comunes + `detalle`
//     polimorfico segun la vertical.
// La creacion/edicion por vertical devuelve la forma "plana" (comunes + campos propios al
// tope), que es un supertipo de la base: por eso la tipamos como ServicioResponse.

import { apiFetch } from "./api";

export type TipoServicio = "ProyectoCerrado" | "Clase" | "Salud";

export type FormatoEntrega = "Archivos" | "Link" | "Ambos";
export type NivelClase =
  | "Primario"
  | "Secundario"
  | "Universitario"
  | "Adulto"
  | "Idioma"
  | "Otro";
export type ModalidadClase = "Online" | "Presencial" | "Ambas";
export type ModalidadSalud = "Domicilio" | "Consultorio" | "Ambas";

// Campos comunes a las tres verticales: es lo que devuelve el listado unificado
// (GET /api/servicios) y la base de la respuesta por vertical.
export interface ServicioResponse {
  id: number;
  estudianteId: number;
  estudianteNombre: string;
  estudianteCalificacion: number;
  titulo: string;
  descripcion: string;
  precio: number;
  activo: boolean;
  fechaPublicacion: string; // ISO UTC
  imagenUrl: string | null;
  tipo: TipoServicio;
}

// Bloques `detalle` polimorficos por vertical.
export interface DetalleProyectoCerrado {
  catalogoServicioId: number;
  catalogoServicioNombre: string;
  plazoEntregaDias: number;
  revisionesIncluidas: number;
  formatoEntrega: FormatoEntrega;
}

export interface DetalleClase {
  materia: string;
  nivel: NivelClase;
  modalidad: ModalidadClase;
  duracionMinutosSesion: number;
  esPaquete: boolean;
  cantidadSesionesPaquete: number | null;
}

export interface DetalleSalud {
  catalogoServicioId: number;
  catalogoServicioNombre: string;
  supervisorId: number;
  supervisorNombre: string;
  supervisorMatricula: string;
  modalidad: ModalidadSalud;
  duracionMinutosSesion: number;
}

// Detalle unificado (GET /api/servicios/{id}): comunes + bloque polimorfico.
export type ServicioDetalleResponse = ServicioResponse & {
  detalle: DetalleProyectoCerrado | DetalleClase | DetalleSalud;
};

// Type guards: estrechan el `detalle` segun la vertical.
export function esProyectoCerrado(
  s: ServicioDetalleResponse,
): s is ServicioDetalleResponse & { detalle: DetalleProyectoCerrado } {
  return s.tipo === "ProyectoCerrado";
}

export function esClase(
  s: ServicioDetalleResponse,
): s is ServicioDetalleResponse & { detalle: DetalleClase } {
  return s.tipo === "Clase";
}

export function esSalud(
  s: ServicioDetalleResponse,
): s is ServicioDetalleResponse & { detalle: DetalleSalud } {
  return s.tipo === "Salud";
}

// --- Constantes de dominio ---

export const TIPOS_SERVICIO: { valor: TipoServicio; etiqueta: string }[] = [
  { valor: "ProyectoCerrado", etiqueta: "Proyectos cerrados" },
  { valor: "Clase", etiqueta: "Tutorías y clases" },
  { valor: "Salud", etiqueta: "Servicios de salud" },
];

// --- Listado y detalle (publicos) ---

export interface ListarServiciosParams {
  tipo?: TipoServicio;
  carreraId?: number;
  estudianteId?: number;
  activo?: boolean;
}

export function listarServicios(
  params: ListarServiciosParams = {},
): Promise<ServicioResponse[]> {
  const qs = new URLSearchParams();
  if (params.tipo) qs.set("tipo", params.tipo);
  if (params.carreraId) qs.set("carrera_id", String(params.carreraId));
  if (params.estudianteId) qs.set("estudiante_id", String(params.estudianteId));
  if (params.activo !== undefined) qs.set("activo", String(params.activo));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ServicioResponse[]>(`/api/servicios${suffix}`, { auth: false });
}

export function obtenerServicio(id: number): Promise<ServicioDetalleResponse> {
  return apiFetch<ServicioDetalleResponse>(`/api/servicios/${id}`, { auth: false });
}

// --- Creacion / edicion / baja por vertical (estudiante autenticado) ---

export interface CrearServicioProyectoCerradoRequest {
  titulo: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  catalogoServicioId: number;
  plazoEntregaDias: number;
  revisionesIncluidas: number;
  formatoEntrega: FormatoEntrega;
}

export function crearServicioProyectoCerrado(
  req: CrearServicioProyectoCerradoRequest,
): Promise<ServicioResponse> {
  return apiFetch<ServicioResponse>("/api/servicios/proyecto-cerrado", {
    method: "POST",
    body: req,
  });
}

export function actualizarServicioProyectoCerrado(
  id: number,
  req: CrearServicioProyectoCerradoRequest,
): Promise<ServicioResponse> {
  return apiFetch<ServicioResponse>(`/api/servicios/proyecto-cerrado/${id}`, {
    method: "PUT",
    body: req,
  });
}

export function eliminarServicioProyectoCerrado(id: number): Promise<void> {
  return apiFetch<void>(`/api/servicios/proyecto-cerrado/${id}`, {
    method: "DELETE",
  });
}

export interface CrearServicioClaseRequest {
  titulo: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  materia: string;
  nivel: NivelClase;
  modalidad: ModalidadClase;
  duracionMinutosSesion: number;
  esPaquete: boolean;
  cantidadSesionesPaquete?: number;
}

export function crearServicioClase(
  req: CrearServicioClaseRequest,
): Promise<ServicioResponse> {
  return apiFetch<ServicioResponse>("/api/servicios/clase", {
    method: "POST",
    body: req,
  });
}

export function actualizarServicioClase(
  id: number,
  req: CrearServicioClaseRequest,
): Promise<ServicioResponse> {
  return apiFetch<ServicioResponse>(`/api/servicios/clase/${id}`, {
    method: "PUT",
    body: req,
  });
}

export function eliminarServicioClase(id: number): Promise<void> {
  return apiFetch<void>(`/api/servicios/clase/${id}`, { method: "DELETE" });
}

export interface CrearServicioSaludRequest {
  titulo: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  catalogoServicioId: number;
  supervisorId: number;
  modalidad: ModalidadSalud;
  duracionMinutosSesion: number;
}

export function crearServicioSalud(
  req: CrearServicioSaludRequest,
): Promise<ServicioResponse> {
  return apiFetch<ServicioResponse>("/api/servicios/salud", {
    method: "POST",
    body: req,
  });
}

export function actualizarServicioSalud(
  id: number,
  req: CrearServicioSaludRequest,
): Promise<ServicioResponse> {
  return apiFetch<ServicioResponse>(`/api/servicios/salud/${id}`, {
    method: "PUT",
    body: req,
  });
}

export function eliminarServicioSalud(id: number): Promise<void> {
  return apiFetch<void>(`/api/servicios/salud/${id}`, { method: "DELETE" });
}

// --- Helpers de presentacion ---

export function tipoBadgeClasses(tipo: TipoServicio): string {
  const map: Record<TipoServicio, string> = {
    ProyectoCerrado: "bg-indigo-100 text-indigo-800",
    Clase: "bg-emerald-100 text-emerald-800",
    Salud: "bg-rose-100 text-rose-800",
  };
  return map[tipo];
}

export function tipoEtiqueta(tipo: TipoServicio): string {
  const map: Record<TipoServicio, string> = {
    ProyectoCerrado: "Proyecto cerrado",
    Clase: "Clases",
    Salud: "Salud",
  };
  return map[tipo];
}

const formatoMoneda = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

export function formatPrecio(precio: number): string {
  return `$${formatoMoneda.format(precio)}`;
}

export function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
