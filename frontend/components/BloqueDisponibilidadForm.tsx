"use client";

import { useState, type FormEvent } from "react";
import {
  crearBloque,
  actualizarBloque,
  DIAS_SEMANA,
  type BloqueDisponibilidadResponse,
  type DiaSemana,
} from "@/lib/disponibilidad";
import { ApiError } from "@/lib/api";
import { ErrorAlert, Field, Select } from "@/components/ui";

// El input HTML type="time" trabaja con "HH:mm"; el backend espera "HH:mm:ss".
function aHoraBackend(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}
function aHoraInput(hhmmss: string): string {
  return hhmmss.slice(0, 5);
}

export function BloqueDisponibilidadForm({
  bloque,
  onCerrar,
  onExito,
}: {
  bloque?: BloqueDisponibilidadResponse;
  onCerrar: () => void;
  onExito: () => void;
}) {
  const editando = Boolean(bloque);
  const [diaSemana, setDiaSemana] = useState<DiaSemana>(
    bloque?.diaSemana ?? "Lunes",
  );
  const [horaInicio, setHoraInicio] = useState(
    bloque ? aHoraInput(bloque.horaInicio) : "09:00",
  );
  const [horaFin, setHoraFin] = useState(
    bloque ? aHoraInput(bloque.horaFin) : "12:00",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!horaInicio || !horaFin) return setError("Completá ambas horas.");
    if (horaInicio >= horaFin)
      return setError("La hora de inicio debe ser anterior a la de fin.");

    const req = {
      diaSemana,
      horaInicio: aHoraBackend(horaInicio),
      horaFin: aHoraBackend(horaFin),
    };

    setSubmitting(true);
    try {
      if (bloque) await actualizarBloque(bloque.id, req);
      else await crearBloque(req);
      onExito();
    } catch (err) {
      // El backend puede devolver 400 por superposición con otro bloque del mismo día.
      setError(
        err instanceof ApiError ? err.message : "No pudimos guardar el bloque.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {editando ? "Editar bloque" : "Agregar bloque"}
          </h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <ErrorAlert message={error} />}

          <Field label="Día de la semana" htmlFor="dia">
            <Select
              id="dia"
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value as DiaSemana)}
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.etiqueta}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Hora de inicio" htmlFor="inicio">
              <input
                id="inicio"
                type="time"
                required
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </Field>
            <Field label="Hora de fin" htmlFor="fin">
              <input
                id="fin"
                type="time"
                required
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Guardando…" : editando ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
