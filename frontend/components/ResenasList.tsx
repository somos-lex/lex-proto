// Reseñas recibidas (estrellas, comentario, autor y fecha) como lista agrupada.
// La usa el perfil público del estudiante.

import { formatFecha } from "@/lib/servicios";
import type { ResenaResponse } from "@/lib/resenas";
import { StarsRow } from "@/components/Stars";

export function ResenasList({
  resenas,
  emptyText = "Todavía no tiene reseñas.",
}: {
  resenas: ResenaResponse[];
  emptyText?: string;
}) {
  if (resenas.length === 0) {
    return <p className="rounded-card bg-surface-2 px-4 py-4 text-[15px] text-ink-2">{emptyText}</p>;
  }

  return (
    <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      {resenas.map((r) => (
        <li
          key={r.id}
          className="relative grid gap-1.5 px-4 py-4 before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-line first:before:hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="font-semibold">{r.autorNombre}</p>
            <StarsRow value={r.puntaje} />
          </div>
          {r.comentario && <p className="max-w-[62ch] text-[15px] leading-[1.5] text-ink">{r.comentario}</p>}
          <p className="text-[14px] text-ink-2">{formatFecha(r.fecha)}</p>
        </li>
      ))}
    </ul>
  );
}
