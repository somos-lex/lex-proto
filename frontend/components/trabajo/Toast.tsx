"use client";

// Toast (componente "Toast" del sistema): confirma una acción recién hecha y se
// va solo a los 6 s; se pausa con hover o foco. Paleta invertida. Nunca lleva la
// única forma de hacer algo, y los errores no van acá (van en un Aviso).

import { useEffect, useRef, useState } from "react";
import { Icono } from "@/components/Icono";

export function Toast({ mensaje, onCerrar }: { mensaje: string | null; onCerrar: () => void }) {
  const [pausado, setPausado] = useState(false);
  const cerrarRef = useRef(onCerrar);
  useEffect(() => {
    cerrarRef.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    if (!mensaje || pausado) return;
    const t = setTimeout(() => cerrarRef.current(), 6000);
    return () => clearTimeout(t);
  }, [mensaje, pausado]);

  return (
    // La región existe siempre para que el lector anuncie el mensaje al llegar.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 flex justify-center lg:inset-x-auto lg:bottom-6 lg:left-[calc(288px+32px)] lg:justify-start"
    >
      {mensaje && (
        <div
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onFocus={() => setPausado(true)}
          onBlur={() => setPausado(false)}
          className="pointer-events-auto flex max-w-[480px] items-center gap-3 rounded-notice bg-inverse py-2.5 pr-2.5 pl-4 text-[15px] font-medium text-canvas shadow-float"
        >
          <Icono nombre="check-circle" className="size-5.5 text-inverse-ok" />
          <span className="flex-1">{mensaje}</span>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar el aviso"
            className="grid size-11 shrink-0 place-items-center rounded-control text-canvas hover:bg-ink-2/30"
          >
            <Icono nombre="x" />
          </button>
        </div>
      )}
    </div>
  );
}
