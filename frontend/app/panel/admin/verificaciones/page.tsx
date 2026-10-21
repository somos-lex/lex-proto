"use client";

// Bandeja de verificación institucional (solo Admin).
//
// Sin esta pantalla ningún estudiante real puede publicar: el vínculo con la
// carrera nace Pendiente y tanto los servicios como las prácticas clínicas
// exigen al menos una carrera Verificada.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  aprobarVerificacion,
  listarVerificacionesPendientes,
  rechazarVerificacion,
  type VerificacionPendiente,
} from "@/lib/verificaciones";
import { ApiError } from "@/lib/api";
import { RequireRole } from "@/components/RequireRole";
import { ErrorAlert } from "@/components/ui";

export default function VerificacionesPage() {
  return (
    <RequireRole roles={["Admin"]}>
      <Verificaciones />
    </RequireRole>
  );
}

function claveDe(v: VerificacionPendiente) {
  return `${v.estudianteId}-${v.carreraId}`;
}

function Verificaciones() {
  const [pendientes, setPendientes] = useState<VerificacionPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarVerificacionesPendientes()
      .then((data) => {
        if (!cancelado) setPendientes(data);
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar las verificaciones pendientes.",
          );
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Resuelto (aprobado o rechazado) sale de la bandeja: ya no está Pendiente.
  function quitar(v: VerificacionPendiente) {
    setPendientes((actuales) => actuales.filter((p) => claveDe(p) !== claveDe(v)));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/panel/admin" className="text-sm font-medium text-accent hover:underline">
        ← Panel de admin
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        Verificaciones pendientes
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Vínculos estudiante–carrera esperando validación institucional, los más
        antiguos primero.
      </p>

      {error && (
        <div className="mt-6">
          <ErrorAlert message={error} />
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
          ))}
        </div>
      ) : pendientes.length === 0 && !error ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">
          No hay verificaciones pendientes.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {pendientes.map((v) => (
            <TarjetaVerificacion key={claveDe(v)} verificacion={v} onResuelta={() => quitar(v)} />
          ))}
        </ul>
      )}
    </div>
  );
}

// El comprobante es un link que pegó el estudiante. Se abre en otra pestaña y solo si es
// http(s): el backend ya lo valida al activar, pero esto no confía en datos viejos (un
// "javascript:" en un href se ejecutaría al hacer click).
function Comprobante({ valor }: { valor: string | null }) {
  if (!valor) {
    return (
      <p className="mt-2 text-xs italic text-amber-700">
        Sin comprobante cargado: pedíselo al estudiante antes de aprobar.
      </p>
    );
  }

  let url: URL | null = null;
  try {
    url = new URL(valor);
  } catch {
    url = null;
  }

  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) {
    return (
      <p className="mt-2 break-all text-xs text-slate-600">
        Comprobante (no es un link válido): <span className="font-mono">{valor}</span>
      </p>
    );
  }

  return (
    <a
      href={url.href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
    >
      Abrir comprobante
      <span className="font-normal text-indigo-500">({url.hostname})</span> ↗
    </a>
  );
}

function TarjetaVerificacion({
  verificacion: v,
  onResuelta,
}: {
  verificacion: VerificacionPendiente;
  onResuelta: () => void;
}) {
  const [modo, setModo] = useState<"ninguno" | "aprobar" | "rechazar">("ninguno");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    if (modo === "rechazar" && !texto.trim()) {
      setError("El motivo del rechazo es obligatorio.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      if (modo === "aprobar") await aprobarVerificacion(v.estudianteId, v.carreraId, texto);
      else await rechazarVerificacion(v.estudianteId, v.carreraId, texto.trim());
      onResuelta();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo resolver la verificación.");
      setEnviando(false);
    }
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900">{v.estudianteNombre}</p>
          <p className="text-sm text-slate-500">{v.estudianteEmail}</p>
          <p className="mt-2 text-sm text-slate-700">
            {v.carreraNombre} · {v.institucionNombre}
            {v.anioCursado != null && <> · {v.anioCursado}° año</>}
          </p>
          <Comprobante valor={v.documentoComprobante} />
        </div>

        {modo === "ninguno" && (
          <div className="flex gap-2">
            <button
              onClick={() => setModo("aprobar")}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Aprobar
            </button>
            <button
              onClick={() => setModo("rechazar")}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Rechazar
            </button>
          </div>
        )}
      </div>

      {modo !== "ninguno" && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor={`texto-${v.estudianteId}-${v.carreraId}`}>
            {modo === "aprobar" ? "Observaciones (opcional)" : "Motivo del rechazo"}
          </label>
          <textarea
            id={`texto-${v.estudianteId}-${v.carreraId}`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder={
              modo === "aprobar"
                ? "Ej: constancia de alumno regular 2026 verificada."
                : "Ej: la foto de la constancia no se lee; reenviala."
            }
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {modo === "rechazar" && (
            <p className="text-xs text-slate-500">
              Un rechazo no es definitivo: si el estudiante reenvía el comprobante,
              se puede aprobar después.
            </p>
          )}
          {error && <ErrorAlert message={error} />}
          <div className="flex gap-2">
            <button
              onClick={confirmar}
              disabled={enviando}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                modo === "aprobar" ? "bg-accent hover:bg-accent-hover" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {enviando ? "Guardando…" : modo === "aprobar" ? "Confirmar aprobación" : "Confirmar rechazo"}
            </button>
            <button
              onClick={() => {
                setModo("ninguno");
                setTexto("");
                setError(null);
              }}
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
