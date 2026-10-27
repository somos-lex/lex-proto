"use client";

// Historial de un trabajo como línea de tiempo: cada cambio de estado, cuándo y
// quién lo hizo. Recibe el historial ya cargado (lo comparte con el riel).

import type { EstadoTrabajo, TrabajoHistorialResponse } from "@/lib/trabajos";
import { fechaHora } from "@/components/trabajo/estado";
import { TituloSeccion } from "@/components/trabajo/Pagina";

const PASO: Record<EstadoTrabajo, string> = {
  Pendiente: "Volvió a pendiente",
  Aceptado: "Se aceptó",
  EnCurso: "Empezó",
  Entregado: "Se entregó",
  Completado: "Se completó",
  Cancelado: "Se canceló",
  Disputa: "Se abrió una disputa",
};

export function HistorialTrabajo({
  historial,
  miUsuarioId,
  estudianteId,
  estudianteNombre,
  clienteId,
  clienteNombre,
}: {
  historial: TrabajoHistorialResponse[];
  miUsuarioId: number | undefined;
  estudianteId: number;
  estudianteNombre: string;
  clienteId: number;
  clienteNombre: string;
}) {
  if (historial.length === 0) return null;
  const ordenado = [...historial].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);

  function quien(usuarioId: number | null) {
    if (usuarioId === null) return null;
    if (usuarioId === miUsuarioId) return "vos";
    if (usuarioId === estudianteId) return estudianteNombre;
    if (usuarioId === clienteId) return clienteNombre;
    return null;
  }

  return (
    <section aria-labelledby="titulo-historial">
      <TituloSeccion id="titulo-historial">Historial</TituloSeccion>
      <ol className="rounded-card bg-surface px-5 py-4 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
        {ordenado.map((h, i) => {
          const ultimo = i === ordenado.length - 1;
          const autor = quien(h.usuarioId);
          return (
            <li key={h.id} className={`relative grid grid-cols-[16px_minmax(0,1fr)] gap-3.5 ${ultimo ? "" : "pb-4"}`}>
              {!ultimo && <span aria-hidden="true" className="absolute top-5 bottom-0 left-[7px] w-0.5 rounded-sm bg-line" />}
              <span aria-hidden="true" className={`mt-1 size-4 rounded-full ${ultimo ? "bg-ink shadow-[0_0_0_4px_var(--color-surface-3)]" : "bg-ink-2"}`} />
              <div>
                <p className="text-base leading-[1.35] font-semibold">
                  {h.estadoAnterior === null ? "Se contrató" : PASO[h.estadoNuevo]}
                </p>
                <p className="text-secondary text-ink-2">
                  {fechaHora(h.fecha)}
                  {autor && `, por ${autor}`}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
