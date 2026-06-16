// Tipos + helpers de pacientes (solo Cliente). Espejan PacienteResponse del backend.

import { apiFetch } from "./api";

export interface Paciente {
  pacienteId: number;
  clienteId: number;
  nombreCompleto: string;
  edad: number | null;
  notas: string | null;
}

export interface PacienteInput {
  nombreCompleto: string;
  edad?: number | null;
  notas?: string | null;
}

/** Pacientes del cliente autenticado. */
export function listarMisPacientes(): Promise<Paciente[]> {
  return apiFetch<Paciente[]>("/api/pacientes");
}

/** Registra un paciente a cargo del cliente. */
export function crearPaciente(input: PacienteInput): Promise<Paciente> {
  return apiFetch<Paciente>("/api/pacientes", { method: "POST", body: input });
}

// Texto del consentimiento informado (mismo que aplica el backend al contratar
// un servicio de salud). Se muestra al cliente antes de aceptar.
export const TEXTO_CONSENTIMIENTO_SALUD =
  "El cliente declara haber sido informado sobre la naturaleza del servicio de salud " +
  "contratado, sus alcances y limitaciones, y presta su consentimiento para que el " +
  "estudiante lo realice bajo la supervisión de un profesional matriculado responsable. " +
  "LEX actúa únicamente como plataforma de intermediación.";
