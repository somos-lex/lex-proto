// Chips del Banco de Turnos (componente "Chip" del sistema). Mismos exports de
// siempre, así los paneles que los usan toman el estilo nuevo sin cambios.
// Se pintan por quién actúa: el verde es para lo que alguien confirmó (asistió,
// realizada) y el Banco usa el acento de LEX para "Sin costo" (D6), nunca verde.

import { Chip, type TonoChip } from "@/components/ds/Chip";
import type { NombreIcono } from "@/components/Icono";
import type { EstadoInscripcion, EstadoPractica } from "@/lib/practicas";
import type { TipoPaciente } from "@/lib/pacientes";

const PRACTICA: Record<EstadoPractica, { etiqueta: string; tono: TonoChip; icono: NombreIcono }> = {
  Publicada: { etiqueta: "Buscando paciente", tono: "neutro", icono: "clock" },
  Cubierta: { etiqueta: "Paciente inscripto", tono: "neutro", icono: "user" },
  Realizada: { etiqueta: "Realizada", tono: "ok", icono: "check-circle" },
  Cancelada: { etiqueta: "Cancelada", tono: "neutro", icono: "x" },
  Vencida: { etiqueta: "Vencida sin paciente", tono: "neutro", icono: "alert" },
};

const INSCRIPCION: Record<EstadoInscripcion, { etiqueta: string; tono: TonoChip; icono: NombreIcono }> = {
  Inscripta: { etiqueta: "Inscripta", tono: "neutro", icono: "check" },
  Asistio: { etiqueta: "Asistió", tono: "ok", icono: "check-circle" },
  NoAsistio: { etiqueta: "No asistió", tono: "neutro", icono: "alert" },
  Cancelada: { etiqueta: "Cancelada", tono: "neutro", icono: "x" },
};

export function EstadoPracticaBadge({ estado }: { estado: EstadoPractica }) {
  const e = PRACTICA[estado];
  return (
    <Chip tono={e.tono} icono={e.icono}>
      {e.etiqueta}
    </Chip>
  );
}

export function EstadoInscripcionBadge({ estado }: { estado: EstadoInscripcion }) {
  const e = INSCRIPCION[estado];
  return (
    <Chip tono={e.tono} icono={e.icono}>
      {e.etiqueta}
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
