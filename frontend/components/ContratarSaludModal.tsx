"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listarMisPacientes,
  TEXTO_CONSENTIMIENTO_SALUD,
  type Paciente,
} from "@/lib/pacientes";
import { contratarServicioSalud } from "@/lib/trabajos";
import { ApiError } from "@/lib/api";
import { type Servicio } from "@/lib/servicios";
import { ErrorAlert } from "@/components/ui";

export function ContratarSaludModal({
  servicio,
  onClose,
  onContratado,
}: {
  servicio: Servicio;
  onClose: () => void;
  onContratado: (idTrabajo: number) => void;
}) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    listarMisPacientes()
      .then((data) => {
        if (!cancelado) setPacientes(data);
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar tus pacientes.",
          );
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const puedeConfirmar = pacienteId !== null && acepta && !enviando;

  async function handleConfirmar() {
    if (!puedeConfirmar || pacienteId === null) return;
    setEnviando(true);
    setError(null);
    try {
      const trabajo = await contratarServicioSalud(
        servicio.idServicio,
        pacienteId,
        acepta,
      );
      onContratado(trabajo.idTrabajo);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No pudimos contratar el servicio.",
      );
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
              Servicio de salud
            </span>
            <h2 className="mt-2 text-lg font-bold text-foreground">
              Contratar “{servicio.titulo}”
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorAlert message={error} />
          </div>
        )}

        {/* Paso 1: elegir paciente */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground">
            1. Elegí el paciente
          </h3>
          {cargando ? (
            <div className="mt-3 h-10 animate-pulse rounded-lg bg-gray-100" />
          ) : pacientes.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center text-sm text-gray-600">
              <p>No tenés pacientes registrados.</p>
              <Link
                href="/panel/pacientes"
                className="mt-2 inline-block font-semibold text-accent hover:underline"
              >
                Registrar un paciente →
              </Link>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {pacientes.map((p) => (
                <label
                  key={p.pacienteId}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition ${
                    pacienteId === p.pacienteId
                      ? "border-accent bg-accent-soft"
                      : "border-gray-200 hover:border-accent/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="paciente"
                    className="accent-[var(--color-accent)]"
                    checked={pacienteId === p.pacienteId}
                    onChange={() => setPacienteId(p.pacienteId)}
                  />
                  <span className="font-medium text-foreground">
                    {p.nombreCompleto}
                  </span>
                  {p.edad != null && (
                    <span className="text-gray-500">· {p.edad} años</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Paso 2: consentimiento */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-foreground">
            2. Consentimiento informado
          </h3>
          <p className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3.5 text-xs leading-relaxed text-gray-600">
            {TEXTO_CONSENTIMIENTO_SALUD}
          </p>
          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
            <input
              type="checkbox"
              className="mt-0.5 accent-[var(--color-accent)]"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
            />
            <span>Acepto el consentimiento informado</span>
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!puedeConfirmar}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? "Contratando…" : "Confirmar contratación"}
          </button>
        </div>
      </div>
    </div>
  );
}
