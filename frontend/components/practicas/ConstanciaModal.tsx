"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatFechaAR, formatFechaHoraAR, obtenerConstancia, type Constancia } from "@/lib/practicas";
import { ApiError } from "@/lib/api";
import { ErrorAlert } from "@/components/ui";

// Constancia completa, para las partes de la práctica (estudiante y cliente inscripto).
// La cátedra no necesita esto: verifica con el código en /constancias/{codigo}, que no
// muestra ningún dato del paciente.
export function ConstanciaModal({ practicaId, onCerrar }: { practicaId: number; onCerrar: () => void }) {
  const [constancia, setConstancia] = useState<Constancia | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    obtenerConstancia(practicaId)
      .then((c) => {
        if (!cancelado) setConstancia(c);
      })
      .catch((err) => {
        if (!cancelado)
          setError(err instanceof ApiError ? err.message : "No pudimos cargar la constancia.");
      });
    return () => {
      cancelado = true;
    };
  }, [practicaId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCerrar}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">Constancia de práctica</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorAlert message={error} />
          </div>
        )}

        {!constancia && !error && <div className="mt-4 h-48 animate-pulse rounded-xl bg-slate-100" />}

        {constancia && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Código de verificación</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-slate-900">{constancia.codigo}</p>
            </div>

            <p
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                constancia.asistenciaRegistrada ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
              }`}
            >
              {constancia.asistenciaRegistrada
                ? "El paciente asistió a la práctica."
                : "El paciente no se presentó a la práctica."}
            </p>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Dato label="Estudiante" valor={constancia.nombreEstudiante} />
              <Dato label="Materia" valor={constancia.nombreMateria} />
              <Dato label="Carrera" valor={constancia.nombreCarrera} />
              <Dato label="Institución" valor={constancia.nombreInstitucion} />
              <Dato label="Fecha de la práctica" valor={formatFechaHoraAR(constancia.fechaPractica)} />
              <Dato label="Emitida" valor={formatFechaAR(constancia.fechaEmision)} />
              <Dato label="Paciente" valor={`${constancia.nombrePaciente} (${constancia.tipoPaciente.toLowerCase()})`} />
            </dl>

            {constancia.observaciones && (
              <div className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Observaciones</p>
                <p className="mt-1 whitespace-pre-line text-slate-700">{constancia.observaciones}</p>
              </div>
            )}

            <p className="text-xs text-slate-500">
              La cátedra puede verificarla en{" "}
              <Link href={`/constancias/${constancia.codigo}`} className="font-semibold text-indigo-700 hover:underline">
                /constancias/{constancia.codigo}
              </Link>
              . La verificación pública no muestra datos del paciente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800 first-letter:uppercase">{valor}</dd>
    </div>
  );
}
