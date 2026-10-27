// Chips del Banco de Turnos (componente "Chip" del sistema). Mismos exports de
// siempre, así los paneles que los usan toman el estilo nuevo sin cambios.
// Se pintan por quién actúa: el verde es para lo que alguien confirmó (asistió,
// realizada) y el Banco usa el acento de LEX para "Sin costo" (D6), nunca verde.

import { Chip, type TonoChip } from "@/components/ds/Chip";
import type { NombreIcono } from "@/components/Icono";
import {
  ESTADO_INSCRIPCION_META,
  ESTADO_PRACTICA_META,
  type EstadoInscripcion,
  type EstadoPractica,
} from "@/lib/practicas";
import type { TipoPaciente } from "@/lib/pacientes";

const PRACTICA: Record<EstadoPractica, { tono: TonoChip; icono: NombreIcono }> = {
  Publicada: { tono: "neutro", icono: "clock" },
  Cubierta: { tono: "neutro", icono: "user" },
  Realizada: { tono: "ok", icono: "check-circle" },
  Cancelada: { tono: "neutro", icono: "x" },
  Vencida: { tono: "neutro", icono: "alert" },
};

const INSCRIPCION: Record<EstadoInscripcion, { tono: TonoChip; icono: NombreIcono }> = {
  Inscripta: { tono: "neutro", icono: "check" },
  Asistio: { tono: "ok", icono: "check-circle" },
  NoAsistio: { tono: "neutro", icono: "alert" },
  Cancelada: { tono: "neutro", icono: "x" },
};

export function EstadoPracticaBadge({ estado }: { estado: EstadoPractica }) {
  const e = PRACTICA[estado];
  return (
    <Chip tono={e.tono} icono={e.icono}>
      {ESTADO_PRACTICA_META[estado].etiqueta}
    </Chip>
  );
}

export function EstadoInscripcionBadge({ estado }: { estado: EstadoInscripcion }) {
  const e = INSCRIPCION[estado];
  return (
    <Chip tono={e.tono} icono={e.icono}>
      {ESTADO_INSCRIPCION_META[estado].etiqueta}
    </Chip>
  );
}

export function TipoPacienteBadge({ tipo }: { tipo: TipoPaciente }) {
  return (
    <Chip icono={tipo === "Animal" ? "paw" : "user"}>{tipo === "Animal" ? "Paciente: mascota" : "Paciente: persona"}</Chip>
  );
}

// "Sin costo": el diferencial del Banco frente a Salud. Acento de LEX (D6).
export function SinCostoBadge() {
  return (
    <Chip tono="acento" icono="tag">
      Sin costo
    </Chip>
  );
}
