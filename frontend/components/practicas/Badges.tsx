import {
  ESTADO_INSCRIPCION_META,
  ESTADO_PRACTICA_META,
  type EstadoInscripcion,
  type EstadoPractica,
} from "@/lib/practicas";
import type { TipoPaciente } from "@/lib/pacientes";

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset";

export function EstadoPracticaBadge({ estado }: { estado: EstadoPractica }) {
  const meta = ESTADO_PRACTICA_META[estado];
  return <span className={`${base} ${meta.clase}`}>{meta.etiqueta}</span>;
}

export function EstadoInscripcionBadge({ estado }: { estado: EstadoInscripcion }) {
  const meta = ESTADO_INSCRIPCION_META[estado];
  return <span className={`${base} ${meta.clase}`}>{meta.etiqueta}</span>;
}

export function TipoPacienteBadge({ tipo }: { tipo: TipoPaciente }) {
  return (
    <span className={`${base} bg-violet-50 text-violet-700 ring-violet-200`}>
      {tipo === "Animal" ? "Paciente animal" : "Paciente humano"}
    </span>
  );
}

// Marca visible de que el módulo no cobra: es el diferencial frente al marketplace.
export function SinCostoBadge() {
  return (
    <span className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-200`}>Sin costo</span>
  );
}
