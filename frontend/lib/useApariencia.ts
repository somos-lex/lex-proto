"use client";

// Hook del control "Apariencia". La lógica del script de <head> vive en lib/apariencia.ts.

import { useCallback, useSyncExternalStore } from "react";
import {
  CLAVE_APARIENCIA,
  CONSULTA_OSCURO,
  EVENTO_APARIENCIA,
  OSCURO_HABILITADO,
  type Apariencia,
} from "@/lib/apariencia";

function leer(): Apariencia {
  try {
    const v = localStorage.getItem(CLAVE_APARIENCIA);
    return v === "claro" || v === "oscuro" ? v : "sistema";
  } catch {
    return "sistema";
  }
}

function aplicar(a: Apariencia) {
  const oscuro =
    OSCURO_HABILITADO &&
    (a === "oscuro" || (a === "sistema" && matchMedia(CONSULTA_OSCURO).matches));
  document.documentElement.dataset.theme = oscuro ? "dark" : "light";
}

function suscribir(avisar: () => void) {
  const mq = matchMedia(CONSULTA_OSCURO);
  const alCambiarSistema = () => {
    if (leer() === "sistema") aplicar("sistema");
    avisar();
  };
  mq.addEventListener("change", alCambiarSistema);
  window.addEventListener(EVENTO_APARIENCIA, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    mq.removeEventListener("change", alCambiarSistema);
    window.removeEventListener(EVENTO_APARIENCIA, avisar);
    window.removeEventListener("storage", avisar);
  };
}

/** Lo que eligió la persona y cómo cambiarlo. En el servidor devuelve "sistema". */
export function useApariencia(): [Apariencia, (a: Apariencia) => void] {
  const actual = useSyncExternalStore(suscribir, leer, () => "sistema" as const);
  const elegir = useCallback((a: Apariencia) => {
    try {
      localStorage.setItem(CLAVE_APARIENCIA, a);
    } catch {
      // Sin almacenamiento (modo privado): se aplica solo a esta pestaña.
    }
    aplicar(a);
    window.dispatchEvent(new Event(EVENTO_APARIENCIA));
  }, []);
  return [actual, elegir];
}
