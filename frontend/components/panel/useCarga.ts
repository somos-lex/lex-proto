"use client";

// Carga de un bloque de pantalla con sus tres estados: cargando, error y datos.
// Cada bloque del panel carga por su cuenta, así un error no tumba la pantalla.
//
// `clave` identifica qué se pide (null = todavía no hay con qué pedirlo).
// `reintentar` vuelve a pedir mostrando la carga (después de un error);
// `recargar` vuelve a pedir dejando a la vista lo que ya había (después de
// guardar algo). `cargar` recibe el número de intento, por si quiere saltear
// una caché (intento > 0).

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";

export interface Carga<T> {
  datos: T | undefined;
  error: string | null;
  cargando: boolean;
  reintentar: () => void;
  recargar: () => void;
}

/** Qué pasó, dicho para quien usa LEX: el mensaje del backend si es de
 *  negocio; si no, si fue la conexión o el servidor. */
export function mensajeDeError(e: unknown) {
  if (e instanceof ApiError) {
    return e.status >= 500 ? "LEX no respondió. Probá de nuevo en un rato." : e.message;
  }
  return "No hay conexión con LEX. Revisá tu conexión y probá de nuevo.";
}

export function useCarga<T>(clave: string | null, cargar: (intento: number) => Promise<T>): Carga<T> {
  const [pedido, setPedido] = useState({ intento: 0, silencioso: false });
  const [res, setRes] = useState<{ clave: string; intento: number; datos?: T; error?: string } | null>(null);
  const { intento, silencioso } = pedido;

  const cargarRef = useRef(cargar);
  useEffect(() => {
    cargarRef.current = cargar;
  });

  useEffect(() => {
    if (clave === null) return;
    let vigente = true;
    cargarRef.current(intento).then(
      (datos) => {
        if (vigente) setRes({ clave, intento, datos });
      },
      (e: unknown) => {
        if (vigente) setRes({ clave, intento, error: mensajeDeError(e) });
      },
    );
    return () => {
      vigente = false;
    };
  }, [clave, intento]);

  const mismaClave = res !== null && res.clave === clave;
  const actual = mismaClave && res.intento === intento ? res : null;
  // En una recarga silenciosa, lo último que llegó sigue a la vista.
  const previo = silencioso && mismaClave && res.datos !== undefined ? res : null;
  return {
    datos: actual ? actual.datos : previo?.datos,
    error: actual?.error ?? null,
    cargando: clave !== null && !actual && !previo,
    reintentar: () => setPedido((p) => ({ intento: p.intento + 1, silencioso: false })),
    recargar: () => setPedido((p) => ({ intento: p.intento + 1, silencioso: true })),
  };
}
