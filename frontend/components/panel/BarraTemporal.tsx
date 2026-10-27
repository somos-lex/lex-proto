"use client";

// TEMPORAL, solo para probar la barra antes de que el layout raíz la monte:
// "Menú" aprieta el botón del encabezado, que es el que abre el cajón hoy.
// Este archivo y su uso en app/panel/layout.tsx se revierten al integrar.

import { BarraInferior } from "@/components/BarraInferior";

export function BarraTemporal() {
  return (
    <BarraInferior
      menuAbierto={false}
      abrirMenu={() => document.querySelector<HTMLButtonElement>('header button[aria-haspopup="dialog"]')?.click()}
    />
  );
}
