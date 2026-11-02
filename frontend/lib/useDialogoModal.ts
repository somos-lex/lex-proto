"use client";

// Comportamiento común del cajón y de la hoja: un <dialog> modal sincronizado con
// un estado de React.
//
// showModal() ya vuelve inerte el resto de la página, pone el diálogo en la capa
// superior y lo cierra con Escape. Este hook suma:
//   - devolver el foco al elemento que lo abrió,
//   - bloquear el desplazamiento del fondo mientras está abierto,
//   - avisar a React cuando se cerró por cualquier vía (Escape, velo, botón).
// El cierre al tocar el velo lo resuelve alClickearVelo.

import { useEffect, useRef, type MouseEvent } from "react";

export function useDialogoModal(abierto: boolean, onCerrar: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const previo = useRef<HTMLElement | null>(null);

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

  // Si se desmonta abierto, no deja el fondo bloqueado.
  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
    },
    [],
  );

  /** El <dialog> ocupa la pantalla y el panel va adentro: un click directo
   *  sobre el <dialog> es un click en el velo. */
  function alClickearVelo(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) e.currentTarget.close();
  }

  const cerrar = () => ref.current?.close();

  return { ref, alClickearVelo, cerrar };
}
