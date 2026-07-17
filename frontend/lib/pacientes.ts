// Tipos + helpers de pacientes (solo Cliente). Espejan PacienteResponse del backend.
// Un paciente es Humano o Animal; los campos aplicables cambian segun el tipo.

import { apiFetch } from "./api";

export type TipoPaciente = "Humano" | "Animal";

export interface PacienteResponse {
  id: number;
  clienteResponsableId: number;
  tipo: TipoPaciente;
  nombreCompleto: string;
  esTitular: boolean;
  fechaNacimiento: string | null; // ISO
  dni: string | null; // solo Humano
  especie: string | null; // solo Animal
  raza: string | null; // solo Animal
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  notasRelevantes: string | null;
}

export interface CrearPacienteHumanoRequest {
  tipo: "Humano";
  nombreCompleto: string;
  esTitular: boolean;
  fechaNacimiento?: string;
  dni?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  notasRelevantes?: string;
}

export interface CrearPacienteAnimalRequest {
  tipo: "Animal";
  nombreCompleto: string;
  esTitular: false; // los animales nunca son titulares
  fechaNacimiento?: string;
  especie: string;
  raza?: string;
  notasRelevantes?: string;
}

export type CrearPacienteRequest =
  | CrearPacienteHumanoRequest
  | CrearPacienteAnimalRequest;

export function listarMisPacientes(): Promise<PacienteResponse[]> {
  return apiFetch<PacienteResponse[]>("/api/pacientes");
}

export function crearPaciente(
  req: CrearPacienteRequest,
): Promise<PacienteResponse> {
  return apiFetch<PacienteResponse>("/api/pacientes", {
    method: "POST",
    body: req,
  });
}
