"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Algo salió mal
        </h2>
        <p className="text-slate-600 mb-6">
          Ocurrió un error inesperado. Intentá de nuevo o volvé al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
