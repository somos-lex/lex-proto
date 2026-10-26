// Chip y contador (componente "Chip" del sistema de diseño).
// El chip informa: 28 px, sin borde, sin hover. No se aprieta.

import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";
import type { EstadoTrabajo } from "@/lib/trabajos";

export type TonoChip = "neutro" | "acento" | "ok" | "warn" | "danger" | "info";

const TONOS: Record<TonoChip, string> = {
  neutro: "bg-surface-2 text-ink-2",
  acento: "bg-accent-soft text-on-accent-soft",
  ok: "bg-ok-soft text-ok-ink",
  warn: "bg-warn-soft text-warn-ink",
  danger: "bg-danger-soft text-danger-ink",
  info: "bg-info-soft text-info-ink",
};

export function Chip({
  tono = "neutro",
  icono,
  children,
  className = "",
}: {
  tono?: TonoChip;
  /** Todo chip de estado lleva ícono: nada depende solo del color. */
  icono?: NombreIcono;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 align-middle text-[14px] font-semibold ${TONOS[tono]} ${className}`}
    >
      {icono && <Icono nombre={icono} className="size-4" />}
      {children}
    </span>
  );
}

/** Cuenta cosas pendientes. `etiqueta` es lo que oye un lector de pantalla
 *  ("2 por responder"): el número se oculta y el texto va en sr-only, porque
 *  aria-label en un span sin rol no lo leen todos los lectores. */
export function Contador({ n, etiqueta }: { n: number; etiqueta: string }) {
  return (
    <span className="inline-grid h-5.5 min-w-5.5 place-items-center rounded-pill bg-accent px-[7px] text-[13px] font-bold text-on-accent tabular-nums">
      <span aria-hidden="true">{n}</span>
      <span className="sr-only">{etiqueta}</span>
    </span>
  );
}

// Estados de un trabajo: se pintan por QUIÉN tiene que actuar.
// "Te toca" va en acento; lo que le toca a la otra parte, en neutro.
const ESTADOS: Record<
  EstadoTrabajo,
  { etiqueta: string; icono: NombreIcono; tono: TonoChip; teToca?: string }
> = {
  Pendiente: { etiqueta: "Pendiente", icono: "clock", tono: "neutro", teToca: "Te toca aceptar" },
  Aceptado: { etiqueta: "Aceptado", icono: "check", tono: "neutro", teToca: "Aceptado: te toca empezar" },
  EnCurso: { etiqueta: "En curso", icono: "refresh", tono: "neutro" },
  Entregado: { etiqueta: "Entregado", icono: "file-check", tono: "neutro", teToca: "Entregado: te toca confirmar" },
  Completado: { etiqueta: "Completado", icono: "check-circle", tono: "ok" },
  Cancelado: { etiqueta: "Cancelado", icono: "x", tono: "neutro" },
  Disputa: { etiqueta: "Disputa", icono: "alert", tono: "danger" },
};

/** Chip del estado de un trabajo. `teToca` lo decide quien lo usa, según el rol
 *  de la persona en ese trabajo (por ejemplo, Pendiente le toca al estudiante). */
export function ChipEstadoTrabajo({
  estado,
  teToca = false,
}: {
  estado: EstadoTrabajo;
  teToca?: boolean;
}) {
  const e = ESTADOS[estado];
  const leToca = teToca && !!e.teToca;
  return (
    <Chip tono={leToca ? "acento" : e.tono} icono={e.icono}>
      {leToca ? e.teToca : e.etiqueta}
    </Chip>
  );
}
