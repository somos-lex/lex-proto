"use client";

// Hoja inferior (componente "Hoja" del sistema): donde se decide sin salir de la
// pantalla. Dos piezas:
//   - HojaAsomada: la barra fija de abajo en las fichas mobile (precio, "Pago
//     protegido" y la acción). Ahí no hay barra inferior de navegación.
//   - Hoja: el diálogo modal que sube desde abajo. Mismo comportamiento que el
//     cajón (useDialogoModal): fondo inerte, Escape, velo, foco que vuelve.

import { useId, type ReactNode } from "react";
import { Icono } from "@/components/Icono";
import { useDialogoModal } from "@/lib/useDialogoModal";

export function Hoja({
  abierto,
  onCerrar,
  titulo,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: ReactNode;
  children: ReactNode;
}) {
  const { ref, alClickearVelo, cerrar } = useDialogoModal(abierto, onCerrar);
  const idTitulo = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClick={alClickearVelo}
      className="m-0 mt-auto h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-scrim open:flex open:flex-col open:justify-end"
    >
      <div className="max-h-[88dvh] overflow-y-auto rounded-t-sheet bg-surface px-5 pt-2 pb-[calc(24px+env(safe-area-inset-bottom))] text-ink shadow-sheet transition-transform duration-[280ms] ease-out starting:translate-y-full motion-reduce:transition-none">
        <span aria-hidden="true" className="mx-auto mb-2.5 block h-[5px] w-10 rounded-[3px] bg-line-strong" />
        <div className="mb-4 flex items-start gap-3">
          <div id={idTitulo} className="min-w-0 flex-1 text-title-3">
            {titulo}
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
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

/** Barra fija de abajo en mobile. Ocultala desde 1024 px, donde la ficha usa el aside. */
export function HojaAsomada({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sticky bottom-0 z-30 rounded-t-sheet bg-surface px-4 pt-2 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-sheet lg:hidden ${className}`}>
      <span aria-hidden="true" className="mx-auto mb-2.5 block h-[5px] w-10 rounded-[3px] bg-line-strong" />
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
