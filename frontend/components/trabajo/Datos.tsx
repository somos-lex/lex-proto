// Datos de un trabajo en pares rótulo y valor, con el ícono que nombra el dato
// (el "lex-dato" del sistema). Una columna en mobile, dos desde 640 px.

import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";

export function Datos({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>;
}

export function Dato({ icono, rotulo, children }: { icono: NombreIcono; rotulo: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-2.5">
      <Icono nombre={icono} className="mt-px size-5 text-ink-2" />
      <dt className="text-[14px] font-semibold text-ink-2">{rotulo}</dt>
      <dd className="col-start-2 text-base leading-[1.45] text-ink [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
