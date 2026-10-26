"use client";

// Control "Apariencia" (Según el sistema · Claro · Oscuro), en la sección
// "Cuenta" del cajón y del lateral del panel. Solo se muestra con
// OSCURO_HABILITADO (lib/apariencia.ts).

import { Icono } from "@/components/Icono";
import { OPCIONES_APARIENCIA } from "@/lib/apariencia";
import { useApariencia } from "@/lib/useApariencia";

export function ControlApariencia() {
  const [apariencia, elegir] = useApariencia();
  return (
    <fieldset className="px-3 pb-2">
      <legend className="flex min-h-12 items-center gap-3 text-base font-medium">
        <Icono nombre="contrast" className="size-5.5 text-ink-2" />
        Apariencia
      </legend>
      <div className="flex gap-0.5 rounded-pill bg-surface-2 p-[3px]">
        {OPCIONES_APARIENCIA.map((o) => (
          <label
            key={o.valor}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-pill px-2 text-center text-[14px] font-[550] text-ink-2 has-checked:bg-surface has-checked:font-[620] has-checked:text-ink has-checked:shadow-thumb has-focus-visible:outline-2 has-focus-visible:outline-focus dark:has-checked:bg-surface-3"
          >
            <input
              type="radio"
              name="apariencia"
              value={o.valor}
              checked={apariencia === o.valor}
              onChange={() => elegir(o.valor)}
              className="sr-only"
            />
            {o.etiqueta}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
