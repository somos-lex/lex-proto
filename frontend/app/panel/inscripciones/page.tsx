"use client";

// Inscripciones del cliente a prácticas clínicas: próximas, pasadas y canceladas, con la
// constancia cuando el estudiante ya registró la asistencia.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  cancelarInscripcion,
  formatFechaHoraAR,
  listarMisInscripciones,
  type Inscripcion,
} from "@/lib/practicas";
import { ApiError } from "@/lib/api";
import { useAhora } from "@/lib/useAhora";
import { RequireRole } from "@/components/RequireRole";
import { ErrorAlert } from "@/components/ui";
import { EstadoInscripcionBadge, TipoPacienteBadge } from "@/components/practicas/Badges";
import { ConstanciaModal } from "@/components/practicas/ConstanciaModal";

export default function MisInscripcionesPage() {
  return (
    <RequireRole roles={["Cliente"]} vista="Cliente">
      <MisInscripciones />
    </RequireRole>
  );
}

function MisInscripciones() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [constanciaDe, setConstanciaDe] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarMisInscripciones()
      .then((data) => {
        if (!cancelado) {
          setInscripciones(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelado)
          setError(err instanceof ApiError ? err.message : "No pudimos cargar tus inscripciones.");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [version]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis inscripciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            Prácticas clínicas sin costo en las que inscribiste a un paciente.
          </p>
        </div>
        <Link
          href="/practicas"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Buscar prácticas
        </Link>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorAlert message={error} />
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
          ))}
        </div>
      ) : inscripciones.length === 0 && !error ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-slate-200 px-6 py-14 text-center text-slate-600">
          Todavía no te inscribiste en ninguna práctica.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {inscripciones.map((i) => (
            <InscripcionItem
              key={i.id}
              inscripcion={i}
              onCambio={() => setVersion((v) => v + 1)}
              onVerConstancia={() => setConstanciaDe(i.practica.id)}
            />
          ))}
        </ul>
      )}

      {constanciaDe !== null && (
        <ConstanciaModal practicaId={constanciaDe} onCerrar={() => setConstanciaDe(null)} />
      )}
    </div>
  );
}

function InscripcionItem({
  inscripcion: i,
  onCambio,
  onVerConstancia,
}: {
  inscripcion: Inscripcion;
  onCambio: () => void;
  onVerConstancia: () => void;
}) {
  const ahora = useAhora();
  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esFutura = ahora !== null && ahora < new Date(i.practica.fechaHoraInicio).getTime();
  const cancelable = i.estado === "Inscripta" && esFutura;

  async function cancelar() {
    setEnviando(true);
    setError(null);
    try {
      await cancelarInscripcion(i.id, motivo);
      onCambio();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos cancelar la inscripción.");
      setEnviando(false);
    }
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <EstadoInscripcionBadge estado={i.estado} />
            <TipoPacienteBadge tipo={i.paciente.tipo} />
          </div>
          <p className="mt-2 font-semibold text-slate-900">{i.practica.materiaNombre}</p>
          <p className="text-sm text-slate-600 first-letter:uppercase">
            {formatFechaHoraAR(i.practica.fechaHoraInicio)} · {i.practica.lugar}
          </p>
          <p className="text-sm text-slate-500">
            Paciente: {i.paciente.nombreCompleto} · con {i.practica.estudianteNombre} ({i.practica.carreraNombre})
          </p>
          {i.motivoCancelacion && <p className="mt-1 text-xs text-slate-500">Motivo: {i.motivoCancelacion}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {i.codigoConstancia && (
            <button
              onClick={onVerConstancia}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver constancia
            </button>
          )}
          {cancelable && !confirmando && (
            <button
              onClick={() => setConfirmando(true)}
              className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Cancelar inscripción
            </button>
          )}
        </div>
      </div>

      {i.estado === "Inscripta" && i.practica.requisitosPrevios && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Requisitos que aceptaste: {i.practica.requisitosPrevios}
        </p>
      )}

      {confirmando && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor={`motivo-${i.id}`}>
            Motivo (opcional)
          </label>
          <textarea
            id={`motivo-${i.id}`}
            rows={2}
            maxLength={1000}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {error && <ErrorAlert message={error} />}
          <div className="flex gap-2">
            <button
              onClick={cancelar}
              disabled={enviando}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {enviando ? "Cancelando…" : "Confirmar cancelación"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              disabled={enviando}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
