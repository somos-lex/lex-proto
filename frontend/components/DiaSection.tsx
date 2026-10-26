"use client";

// Los horarios de un día de la semana, como lista agrupada. Eliminar pide
// confirmación en la misma fila, sin diálogo.

import { useState } from "react";
import type { BloqueDisponibilidadResponse, DiaSemana } from "@/lib/disponibilidad";
import { Boton } from "@/components/Boton";
import { Tesela } from "@/components/ds/Lista";

/** "09:30:00" → "9:30". */
export function hora(h: string): string {
  const [hh, mm] = h.split(":");
  return `${Number(hh)}:${mm}`;
}

/** "9:00 a 13:00". */
export function rango(b: { horaInicio: string; horaFin: string }) {
  return `${hora(b.horaInicio)} a ${hora(b.horaFin)}`;
}

function duracion(b: BloqueDisponibilidadResponse) {
  const min = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const total = min(b.horaFin) - min(b.horaInicio);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const horas = h === 1 ? "1 hora" : `${h} horas`;
  if (h === 0) return `${m} min`;
  return m ? `${horas} y ${m} min` : horas;
}

export function DiaSection({
  dia,
  etiqueta,
  bloques,
  onEditar,
  onEliminar,
}: {
  dia: DiaSemana;
  etiqueta: string;
  bloques: BloqueDisponibilidadResponse[];
  onEditar: (bloque: BloqueDisponibilidadResponse) => void;
  onEliminar: (bloque: BloqueDisponibilidadResponse) => void;
}) {
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const deDia = etiqueta.toLowerCase();

  function volver(id: number) {
    setConfirmando(null);
    requestAnimationFrame(() => document.getElementById(`eliminar-${id}`)?.focus());
  }

  return (
    <section aria-labelledby={`dia-${dia}`}>
      <h2 id={`dia-${dia}`} className="mx-1 mb-2 text-[15px] font-semibold text-ink-2">
        {etiqueta}
      </h2>
      <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
        {bloques.map((b) => (
          <li
            key={b.id}
            className="relative before:absolute before:top-0 before:right-0 before:left-[74px] before:h-px before:bg-line first:before:hidden"
          >
            {confirmando === b.id ? (
              <div role="group" aria-label={`Eliminar el horario del ${deDia}`} className="grid gap-3 bg-surface-2 px-4 py-3">
                <p className="text-[15px] leading-[1.45]">
                  <strong className="font-[650]">¿Eliminar el horario de {rango(b)}?</strong> Deja de ofrecerse para turnos nuevos.
                </p>
                <div className="flex flex-wrap gap-2">
                  {/* El foco va a la opción que no borra. */}
                  <Boton variante="secundario" tamano="sm" autoFocus onClick={() => volver(b.id)}>
                    No, dejarlo
                  </Boton>
                  <Boton
                    variante="peligro"
                    tamano="sm"
                    onClick={() => {
                      setConfirmando(null);
                      onEliminar(b);
                    }}
                  >
                    Eliminar
                  </Boton>
                </div>
              </div>
            ) : (
              <div className="flex min-h-16 items-center gap-3.5 py-2.5 pr-2 pl-4">
                <Tesela icono="clock" />
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-[1.35] font-semibold">{rango(b)}</span>
                  <span className="block text-[15px] leading-[1.4] text-ink-2">{duracion(b)}</span>
                </span>
                <Boton variante="texto" tamano="sm" onClick={() => onEditar(b)}>
                  Editar<span className="sr-only"> el horario del {deDia} de {rango(b)}</span>
                </Boton>
                <Boton id={`eliminar-${b.id}`} variante="texto" tamano="sm" className="text-danger-ink" onClick={() => setConfirmando(b.id)}>
                  Eliminar<span className="sr-only"> el horario del {deDia} de {rango(b)}</span>
                </Boton>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
