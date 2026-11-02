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
//
// Movimiento: el CSS lee dos atributos del <dialog>.
//   - data-oculto: el panel está en su posición de reposo, fuera de pantalla.
//   - data-cerrando: la salida, que es más corta que la entrada.
// Al abrir se muestra con data-oculto y se lo quita pasados dos cuadros: así el estado
// de reposo se pinta una vez y la transición de entrada tiene desde dónde arrancar
// (lo mismo que hacía @starting-style, pero con el mismo mecanismo para la salida).
// Todo cierre (botón, velo, Escape, o `abierto` en false) pasa por cerrarAnimado, que
// deja correr la salida y recién entonces llama a close().

import { useCallback, useEffect, useRef, type MouseEvent } from "react";

// Al bloquear el scroll con overflow:hidden desaparece la barra de desplazamiento y la
// página se ensancha (en escritorio, ~15 px): el contenido de atrás pega un tirón. Se
// compensa con un padding igual al ancho de la barra mientras el diálogo está abierto.
function bloquearScroll() {
  const html = document.documentElement;
  const barra = window.innerWidth - html.clientWidth;
  html.style.paddingRight = barra > 0 ? `${barra}px` : "";
  html.style.overflow = "hidden";
}

function liberarScroll() {
  const html = document.documentElement;
  html.style.overflow = "";
  html.style.paddingRight = "";
}

function msDe(duraciones: string): number {
  return Math.max(0, ...duraciones.split(",").map((t) => parseFloat(t) * (t.trim().endsWith("ms") ? 1 : 1000)));
}

export function useDialogoModal(
  abierto: boolean,
  onCerrar: () => void,
  /** Se consulta ante un pedido de cierre del navegador (Escape, Atrás): si devuelve true, el cierre se retiene. */
  retener?: () => boolean,
) {
  const ref = useRef<HTMLDialogElement>(null);
  const previo = useRef<HTMLElement | null>(null);
  const retenerRef = useRef(retener);
  useEffect(() => {
    retenerRef.current = retener;
  });

  const cerrarAnimado = useCallback(() => {
    const d = ref.current;
    if (!d || !d.open || d.dataset.cerrando) return;
    const panel = d.firstElementChild;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    d.dataset.oculto = "true";
    d.dataset.cerrando = "true";
    // Se lee después de marcar data-cerrando: la salida tiene su propia duración.
    const ms = reducido || !panel ? 0 : msDe(getComputedStyle(panel).transitionDuration);
    window.setTimeout(
      () => {
        delete d.dataset.cerrando;
        if (d.open) d.close();
        delete d.dataset.oculto;
      },
      ms > 0 ? ms + 20 : 0,
    );
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      previo.current = document.activeElement as HTMLElement | null;
      d.dataset.oculto = "true";
      d.showModal();
      bloquearScroll();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!d.dataset.cerrando) delete d.dataset.oculto;
        }),
      );
    } else if (!abierto && d.open) {
      cerrarAnimado();
    }
  }, [abierto, cerrarAnimado]);

  // Escape y el botón Atrás piden "cancel": se frena el cierre inmediato y se hace
  // el animado, salvo que quien usa el hook lo retenga (formulario con cambios).
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const alCancelar = (e: Event) => {
      e.preventDefault();
      if (retenerRef.current?.()) return;
      cerrarAnimado();
    };
    d.addEventListener("cancel", alCancelar);
    return () => d.removeEventListener("cancel", alCancelar);
  }, [cerrarAnimado]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const alCerrar = () => {
      liberarScroll();
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
      liberarScroll();
    },
    [],
  );

  /** El <dialog> ocupa la pantalla y el panel va adentro: un click directo
   *  sobre el <dialog> es un click en el velo. */
  function alClickearVelo(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) cerrarAnimado();
  }

  return { ref, alClickearVelo, cerrar: cerrarAnimado };
}
