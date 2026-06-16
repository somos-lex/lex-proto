"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listarMisTrabajos, type Trabajo } from "@/lib/trabajos";
import { formatPrecio } from "@/lib/servicios";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/RequireRole";
import { EstadoBadge } from "@/components/EstadoBadge";
import { ErrorAlert } from "@/components/ui";

export default function MisTrabajosPage() {
  return (
    <RequireRole roles={["Cliente", "Estudiante"]}>
      <MisTrabajos />
    </RequireRole>
  );
}

function MisTrabajos() {
  const { user } = useAuth();
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    listarMisTrabajos()
      .then((data) => {
        if (!cancelado) setTrabajos(data);
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar tus trabajos.",
          );
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Mis trabajos
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Las contrataciones donde participás, como cliente o estudiante.
      </p>

      {error && (
        <div className="mt-6">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
              />
            ))}
          </div>
        ) : trabajos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
            <p className="font-semibold text-foreground">
              Todavía no tenés trabajos
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Cuando contrates (o te contraten) un servicio, aparecerá acá.
            </p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Ver servicios
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trabajos.map((t) => {
              const soyCliente = user?.usuarioId === t.clienteId;
              const otraParte = soyCliente ? t.estudianteNombre : t.clienteNombre;
              return (
                <li key={t.idTrabajo}>
                  <Link
                    href={`/panel/trabajos/${t.idTrabajo}`}
                    className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-400">
                        Trabajo #{t.idTrabajo}
                      </span>
                      <EstadoBadge estado={t.estado} />
                    </div>
                    <h3 className="mt-2 font-semibold text-foreground">
                      {t.tipoServicioNombre ?? "Servicio"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {soyCliente ? "Estudiante" : "Cliente"}:{" "}
                      <span className="font-medium text-foreground">
                        {otraParte}
                      </span>
                    </p>
                    <div className="mt-4 border-t border-gray-100 pt-3 text-right text-lg font-bold text-foreground">
                      {formatPrecio(t.monto)}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
