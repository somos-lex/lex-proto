"use client";

import { useSyncExternalStore } from "react";

// "Ahora" para decidir en el render si una acción ya está habilitada (ej. registrar la
// asistencia recién a partir del horario de inicio), sin llamar a Date.now() durante el
// render: eso lo marca react-hooks/purity y además da distinto en servidor y cliente.
//
// Se expone redondeado a ventanas de 30 s, así el snapshot es estable entre renders y la
// UI se re-evalúa sola cuando cruza un horario. En el servidor es null: quien lo usa
// mantiene la acción deshabilitada hasta hidratar, y el backend valida igual.

const PASO_MS = 30_000;

function suscribir(avisar: () => void) {
  const id = setInterval(avisar, PASO_MS);
  return () => clearInterval(id);
}

function snapshot(): number {
  return Math.floor(Date.now() / PASO_MS) * PASO_MS;
}

function snapshotServidor(): number | null {
  return null;
}

export function useAhora(): number | null {
  return useSyncExternalStore(suscribir, snapshot, snapshotServidor);
}
