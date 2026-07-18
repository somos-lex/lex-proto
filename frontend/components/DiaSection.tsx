"use client";

import type {
  BloqueDisponibilidadResponse,
  DiaSemana,
} from "@/lib/disponibilidad";

// Horas del backend vienen "HH:mm:ss"; mostramos "HH:mm".
function hhmm(hora: string): string {
  return hora.slice(0, 5);
}

export function DiaSection({
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
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{etiqueta}</h3>
      {bloques.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">Sin bloques.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {bloques.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-700">
                {hhmm(b.horaInicio)} – {hhmm(b.horaFin)}
              </span>
              <span className="flex gap-2">
                <button
                  onClick={() => onEditar(b)}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white"
                >
                  Editar
                </button>
                <button
                  onClick={() => onEliminar(b)}
                  className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Eliminar
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
