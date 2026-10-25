"use client";

// Cajón (drawer) del sistema de diseño: un diálogo modal que sale por la derecha.
//
// Se apoya en <dialog> con showModal(): el navegador vuelve inerte el resto de la
// página (el foco no puede salir del cajón), lo pone en la capa superior y lo
// cierra con Escape. Encima de eso, este componente:
//   - devuelve el foco al elemento que lo abrió,
//   - bloquea el desplazamiento del fondo mientras está abierto,
//   - cierra al tocar el velo (fuera del panel),
//   - entra con un desplazamiento corto, salvo con prefers-reduced-motion.

import { useEffect, useRef, type ReactNode } from "react";
import { Icono } from "@/components/Icono";

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
  const ref = useRef<HTMLDialogElement>(null);
  const previo = useRef<HTMLElement | null>(null);

  // Sincroniza el estado de React con el diálogo nativo.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      previo.current = document.activeElement as HTMLElement | null;
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!abierto && d.open) {
      d.close();
    }
  }, [abierto]);

  // Al cerrarse por cualquier vía (Escape, velo, botón, navegación).
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const alCerrar = () => {
      document.documentElement.style.overflow = "";
      previo.current?.focus();
      previo.current = null;
      onCerrar();
    };
    d.addEventListener("close", alCerrar);
    return () => d.removeEventListener("close", alCerrar);
  }, [onCerrar]);

  // Si el componente se desmonta abierto, no deja el fondo bloqueado.
  useEffect(() => () => {
    document.documentElement.style.overflow = "";
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={etiqueta}
      onClick={(e) => {
        // El <dialog> ocupa la pantalla y el panel está adentro: un click
        // directo sobre el <dialog> es un click en el velo.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-scrim open:flex open:justify-end"
    >
      <div className="flex h-full w-[min(88vw,360px)] flex-col overflow-y-auto rounded-l-sheet bg-surface px-3 pt-2.5 pb-7 text-ink shadow-float transition-transform duration-300 ease-out starting:translate-x-full motion-reduce:transition-none">
        <div className="mb-1.5 flex items-center gap-3 border-b border-line pt-1.5 pr-1 pb-3.5 pl-2">
          <div className="min-w-0 flex-1">{cabecera}</div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
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
