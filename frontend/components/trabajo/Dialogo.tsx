"use client";

// Diálogo de confirmación del área: en mobile sube desde abajo como la Hoja; desde
// 640 px queda centrado y angosto, porque una hoja de ancho completo con dos
// botones se pierde en escritorio. Mismo comportamiento que el cajón y la hoja
// (useDialogoModal): fondo inerte, Escape, velo y el foco que vuelve.

import { useId, type ReactNode } from "react";
import { Icono } from "@/components/Icono";
import { useDialogoModal } from "@/lib/useDialogoModal";

export function Dialogo({
  abierto,
  onCerrar,
  titulo,
  children,
  pie,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: ReactNode;
  children?: ReactNode;
  /** Los botones, abajo: en mobile, uno debajo del otro y a lo ancho. */
  pie?: ReactNode;
}) {
  const { ref, alClickearVelo, cerrar } = useDialogoModal(abierto, onCerrar);
  const idTitulo = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClick={alClickearVelo}
      className="m-0 mt-auto h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-scrim open:flex open:flex-col open:justify-end sm:open:items-center sm:open:justify-center sm:open:p-6"
    >
      <div className="max-h-[88dvh] w-full overflow-y-auto rounded-t-sheet bg-surface px-5 pt-2 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-sheet transition-[translate,opacity] duration-[280ms] ease-out starting:translate-y-full motion-reduce:transition-none sm:max-w-[480px] sm:rounded-sheet sm:px-6 sm:pt-6 sm:pb-6 sm:shadow-float sm:starting:translate-y-3 sm:starting:opacity-0">
        <span aria-hidden="true" className="mx-auto mb-2.5 block h-[5px] w-10 rounded-[3px] bg-line-strong sm:hidden" />
        <div className="mb-3 flex items-start gap-3">
          <h2 id={idTitulo} className="min-w-0 flex-1 pt-2 text-title-3 text-balance">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-ink hover:bg-surface-3"
          >
            <Icono nombre="x" />
          </button>
        </div>
        <div className="grid gap-4 text-[15px] leading-[1.5] text-ink-2">{children}</div>
        {pie && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{pie}</div>}
      </div>
    </dialog>
  );
}
