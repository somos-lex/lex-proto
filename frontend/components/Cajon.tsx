"use client";

// Cajón (drawer) del sistema de diseño: un diálogo modal que sale por la derecha.
// El comportamiento (foco, Escape, velo, scroll) vive en useDialogoModal y es el
// mismo de la Hoja. Entra con un desplazamiento corto, salvo con
// prefers-reduced-motion.

import type { ReactNode } from "react";
import { Icono } from "@/components/Icono";
import { useDialogoModal } from "@/lib/useDialogoModal";

export function Cajon({
  abierto,
  onCerrar,
  etiqueta,
  cabecera,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  /** Nombre accesible del diálogo, por ejemplo "Menú". */
  etiqueta: string;
  /** Lo que va arriba, al lado del botón de cerrar (usuario, marca). */
  cabecera?: ReactNode;
  children: ReactNode;
}) {
  const { ref, alClickearVelo, cerrar } = useDialogoModal(abierto, onCerrar);

  return (
    <dialog
      ref={ref}
      aria-label={etiqueta}
      onClick={alClickearVelo}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-scrim open:flex open:justify-end"
    >
      <div className="flex h-full w-[min(88vw,360px)] flex-col overflow-y-auto rounded-l-sheet bg-surface px-3 pt-2.5 pb-7 text-ink shadow-float transition-transform duration-300 ease-out starting:translate-x-full motion-reduce:transition-none">
        <div className="mb-1.5 flex items-center gap-3 border-b border-line pt-1.5 pr-1 pb-3.5 pl-2">
          <div className="min-w-0 flex-1">{cabecera}</div>
          <button
            type="button"
            onClick={cerrar}
            aria-label={`Cerrar ${etiqueta.toLowerCase()}`}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-ink hover:bg-surface-3"
          >
            <Icono nombre="x" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
