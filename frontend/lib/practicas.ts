// Banco de Turnos: prácticas clínicas sin costo. Espeja PracticaDtos y MateriaDtos del backend.
//
// Ningún tipo de este archivo lleva precio ni arancel: el módulo no toca dinero.
//
// Zona horaria: la API entrega y recibe instantes UTC; el prototipo asume Argentina
// (UTC-3 fijo, sin horario de verano), igual que Common/HorarioArgentina.cs. Los helpers
// de abajo formatean corriendo el instante 3 horas y leyéndolo como UTC, así el resultado
// es el mismo en el servidor y en cualquier navegador, sin depender de su timezone.

import { apiFetch } from "./api";
import type { TipoPaciente } from "./pacientes";

export type EstadoPractica =
  | "Publicada"
  | "Cubierta"
  | "Realizada"
  | "Cancelada"
  | "Vencida"; // calculado por el backend: Publicada con fecha pasada

export type EstadoInscripcion = "Inscripta" | "Asistio" | "NoAsistio" | "Cancelada";

export interface Materia {
  id: number;
  nombre: string;
  carreraId: number;
  carreraNombre: string;
  institucionNombre: string;
  anioMinimo: number;
  activa: boolean;
}

export interface PracticaPublica {
  id: number;
  materiaId: number;
  materiaNombre: string;
  carreraId: number;
  carreraNombre: string;
  institucionNombre: string;
  estudianteId: number;
  estudianteNombre: string;
  fechaHoraInicio: string; // ISO UTC
  fechaHoraFin: string; // ISO UTC
  duracionMinutos: number;
  lugar: string;
  tipoPacienteRequerido: TipoPaciente;
  requisitosPrevios: string | null;
  estado: EstadoPractica;
}

export interface PacienteDeInscripcion {
  id: number;
  tipo: TipoPaciente;
  nombreCompleto: string;
  fechaNacimiento: string | null;
  especie: string | null;
  raza: string | null;
  notasRelevantes: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
}

export interface InscripcionDePractica {
  id: number;
  estado: EstadoInscripcion;
  clienteId: number;
  clienteNombre: string;
  paciente: PacienteDeInscripcion;
  requisitosAceptados: boolean;
  fechaAceptacionRequisitos: string | null;
  fechaInscripcion: string;
}

// Vista de las partes. Para un visitante, `inscripcion`, la cancelación y el código vienen null.
export interface PracticaDetalle {
  practica: PracticaPublica;
  inscripcion: InscripcionDePractica | null;
  fechaCreacion: string;
  fechaCancelacion: string | null;
  motivoCancelacion: string | null;
  codigoConstancia: string | null;
}

export interface Inscripcion {
  id: number;
  estado: EstadoInscripcion;
  practica: PracticaPublica;
  paciente: PacienteDeInscripcion;
  fechaInscripcion: string;
  fechaAceptacionRequisitos: string | null;
  fechaCancelacion: string | null;
  motivoCancelacion: string | null;
  codigoConstancia: string | null;
}

export interface Constancia {
  id: number;
  practicaClinicaId: number;
  codigo: string;
  fechaEmision: string;
  asistenciaRegistrada: boolean;
  observaciones: string | null;
  nombreEstudiante: string;
  nombreMateria: string;
  nombreCarrera: string;
  nombreInstitucion: string;
  nombrePaciente: string;
  tipoPaciente: TipoPaciente;
  fechaPractica: string;
}

// Verificación pública por código: sin ningún dato del paciente.
export interface ConstanciaPublica {
  codigo: string;
  fechaEmision: string;
  asistenciaRegistrada: boolean;
  nombreEstudiante: string;
  nombreMateria: string;
  nombreCarrera: string;
  nombreInstitucion: string;
  fechaPractica: string;
}

export interface PublicarPracticaInput {
  materiaId: number;
  fechaHoraInicio: string; // ISO UTC
  duracionMinutos: number;
  lugar: string;
  tipoPacienteRequerido: TipoPaciente;
  requisitosPrevios?: string;
}

// --- Materias ------------------------------------------------------------------

export function listarMaterias(carreraId?: number): Promise<Materia[]> {
  const qs = carreraId ? `?carreraId=${carreraId}` : "";
  return apiFetch<Materia[]>(`/api/materias${qs}`, { auth: false });
}

/** Materias para las que el estudiante autenticado puede publicar hoy (carrera verificada + año). */
export function listarMateriasHabilitadas(): Promise<Materia[]> {
  return apiFetch<Materia[]>("/api/materias/habilitadas");
}

// --- Estudiante ----------------------------------------------------------------

export function publicarPractica(input: PublicarPracticaInput): Promise<PracticaDetalle> {
  return apiFetch<PracticaDetalle>("/api/practicas", { method: "POST", body: input });
}

export function listarMisPracticas(estado?: EstadoPractica): Promise<PracticaDetalle[]> {
  const qs = estado ? `?estado=${estado}` : "";
  return apiFetch<PracticaDetalle[]>(`/api/practicas/mias${qs}`);
}

export function cancelarPractica(id: number, motivo?: string): Promise<PracticaDetalle> {
  return apiFetch<PracticaDetalle>(`/api/practicas/${id}/cancelar`, {
    method: "POST",
    body: { motivo: motivo?.trim() || null },
  });
}

export function registrarAsistencia(
  id: number,
  asistio: boolean,
  observaciones?: string,
): Promise<Constancia> {
  return apiFetch<Constancia>(`/api/practicas/${id}/asistencia`, {
    method: "POST",
    body: { asistio, observaciones: observaciones?.trim() || null },
  });
}

export function obtenerConstancia(practicaId: number): Promise<Constancia> {
  return apiFetch<Constancia>(`/api/practicas/${practicaId}/constancia`);
}

// --- Público / paciente --------------------------------------------------------

export interface FiltrosDisponibles {
  carreraId?: number;
  tipoPaciente?: TipoPaciente;
  desde?: string; // YYYY-MM-DD (fecha local AR)
  hasta?: string; // YYYY-MM-DD (fecha local AR)
}

export function listarPracticasDisponibles(f: FiltrosDisponibles = {}): Promise<PracticaPublica[]> {
  const qs = new URLSearchParams();
  if (f.carreraId) qs.set("carreraId", String(f.carreraId));
  if (f.tipoPaciente) qs.set("tipoPaciente", f.tipoPaciente);
  if (f.desde) qs.set("desde", f.desde);
  if (f.hasta) qs.set("hasta", f.hasta);
  const s = qs.toString();
  return apiFetch<PracticaPublica[]>(`/api/practicas/disponibles${s ? `?${s}` : ""}`, { auth: false });
}

/** Con sesión, las partes reciben el detalle completo; sin sesión, solo prácticas abiertas (404 si no). */
export function obtenerPractica(id: number): Promise<PracticaDetalle> {
  return apiFetch<PracticaDetalle>(`/api/practicas/${id}`);
}

export function inscribirEnPractica(
  practicaId: number,
  pacienteId: number,
  requisitosAceptados: boolean,
): Promise<Inscripcion> {
  return apiFetch<Inscripcion>(`/api/practicas/${practicaId}/inscripcion`, {
    method: "POST",
    body: { pacienteId, requisitosAceptados },
  });
}

export function listarMisInscripciones(): Promise<Inscripcion[]> {
  return apiFetch<Inscripcion[]>("/api/inscripciones/mias");
}

export function cancelarInscripcion(id: number, motivo?: string): Promise<Inscripcion> {
  return apiFetch<Inscripcion>(`/api/inscripciones/${id}/cancelar`, {
    method: "POST",
    body: { motivo: motivo?.trim() || null },
  });
}

export function verificarConstancia(codigo: string): Promise<ConstanciaPublica> {
  return apiFetch<ConstanciaPublica>(`/api/constancias/${encodeURIComponent(codigo)}`, { auth: false });
}

// --- Hora argentina ------------------------------------------------------------

const OFFSET_AR_MS = 3 * 60 * 60 * 1000;

function enAR(iso: string): Date {
  return new Date(new Date(iso).getTime() - OFFSET_AR_MS);
}

/** "jueves 23/10/2026, 14:00" en hora argentina. */
export function formatFechaHoraAR(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(enAR(iso));
}

/** "23/10/2026" en hora argentina. */
export function formatFechaAR(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(enAR(iso));
}

/** "14:00" en hora argentina. */
export function formatHoraAR(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(enAR(iso));
}

/** Instante UTC (ISO) de una fecha y hora tipeadas en hora argentina. */
export function localARaUtcIso(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora}:00-03:00`).toISOString();
}

/** Fecha argentina "YYYY-MM-DD" de un instante en ms (ej. para el min de un input date). */
export function fechaARDe(ms: number): string {
  return new Date(ms - OFFSET_AR_MS).toISOString().slice(0, 10);
}

export const ESTADO_PRACTICA_META: Record<EstadoPractica, { etiqueta: string; clase: string }> = {
  Publicada: { etiqueta: "Buscando paciente", clase: "bg-sky-50 text-sky-700 ring-sky-200" },
  Cubierta: { etiqueta: "Paciente inscripto", clase: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  Realizada: { etiqueta: "Realizada", clase: "bg-slate-100 text-slate-700 ring-slate-200" },
  Cancelada: { etiqueta: "Cancelada", clase: "bg-rose-50 text-rose-700 ring-rose-200" },
  Vencida: { etiqueta: "Vencida sin paciente", clase: "bg-amber-50 text-amber-700 ring-amber-200" },
};

export const ESTADO_INSCRIPCION_META: Record<EstadoInscripcion, { etiqueta: string; clase: string }> = {
  Inscripta: { etiqueta: "Inscripta", clase: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  Asistio: { etiqueta: "Asistió", clase: "bg-slate-100 text-slate-700 ring-slate-200" },
  NoAsistio: { etiqueta: "No asistió", clase: "bg-amber-50 text-amber-700 ring-amber-200" },
  Cancelada: { etiqueta: "Cancelada", clase: "bg-rose-50 text-rose-700 ring-rose-200" },
};
