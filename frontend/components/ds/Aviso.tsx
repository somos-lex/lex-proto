// Aviso (componente "Aviso" del sistema de diseño): explica algo y, si se puede
// arreglar, ofrece la acción. El texto dice qué pasó y qué hacer.

import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";

export type TonoAviso = "info" | "warn" | "danger" | "ok" | "neutro";

const TONOS: Record<TonoAviso, { clases: string; icono: NombreIcono }> = {
  info: { clases: "bg-info-soft text-info-ink", icono: "info" },
  warn: { clases: "bg-warn-soft text-warn-ink", icono: "alert" },
  danger: { clases: "bg-danger-soft text-danger-ink", icono: "alert-circle" },
  ok: { clases: "bg-ok-soft text-ok-ink", icono: "check-circle" },
  neutro: { clases: "bg-surface-2 text-ink-2", icono: "info" },
};

export function Aviso({
  tono = "info",
  titulo,
  children,
  acciones,
  className = "",
}: {
  tono?: TonoAviso;
  /** Va en negrita antes del texto: dice el tipo sin depender del color. */
  titulo?: ReactNode;
  children?: ReactNode;
  acciones?: ReactNode;
  className?: string;
}) {
  const t = TONOS[tono];
  return (
    <div
      role={tono === "danger" ? "alert" : "status"}
      className={`flex gap-3 rounded-notice px-4 py-3.5 text-[15px] leading-[1.45] [&_a]:font-[650] [&_a]:text-inherit ${t.clases} ${className}`}
    >
      <Icono nombre={t.icono} className="-mt-px size-5.5" />
      <div className="min-w-0 flex-1">
        {titulo && <strong className="font-[650]">{titulo}</strong>}
        {titulo && children ? " " : null}
        {children}
        {acciones && <div className="mt-2.5 flex flex-wrap gap-2">{acciones}</div>}
      </div>
    </div>
  );
}
