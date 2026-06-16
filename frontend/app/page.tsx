"use client";

import { useEffect, useState } from "react";
import {
  listarServicios,
  TIPOS_SERVICIO,
  type Servicio,
} from "@/lib/servicios";
import { ApiError } from "@/lib/api";
import { ServiceCard } from "@/components/ServiceCard";
import { ErrorAlert } from "@/components/ui";

export default function Home() {
  const [texto, setTexto] = useState("");
  const [debouncedTexto, setDebouncedTexto] = useState("");
  const [tipoServicioId, setTipoServicioId] = useState<number | null>(null);

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce del texto para no consultar en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTexto(texto), 350);
    return () => clearTimeout(t);
  }, [texto]);

  // Re-consulta la API cada vez que cambian los filtros.
  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);
    listarServicios({ tipoServicioId, texto: debouncedTexto })
      .then((data) => {
        if (!cancelado) setServicios(data);
      })
      .catch((err) => {
        if (cancelado) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "No pudimos cargar los servicios. ¿Está corriendo el backend?",
        );
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [tipoServicioId, debouncedTexto]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-accent-soft/60 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Conectá con estudiantes universitarios para tus{" "}
            <span className="text-accent">proyectos, clases y más</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
            Talento joven, calificado y cercano. Encontrá el servicio justo para
            lo que necesitás.
          </p>

          {/* Barra de búsqueda */}
          <div className="mx-auto mt-8 flex max-w-2xl items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <svg
              className="ml-4 h-5 w-5 shrink-0 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscá por título: diseño, cálculo, fotografía…"
              className="w-full bg-transparent px-3 py-3.5 text-sm text-foreground outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* Listado */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Pills de tipo */}
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterPill
            active={tipoServicioId === null}
            onClick={() => setTipoServicioId(null)}
          >
            Todos
          </FilterPill>
          {TIPOS_SERVICIO.map((t) => (
            <FilterPill
              key={t.id}
              active={tipoServicioId === t.id}
              onClick={() => setTipoServicioId(t.id)}
            >
              {t.nombre}
            </FilterPill>
          ))}
        </div>

        {error && <ErrorAlert message={error} />}

        {loading ? (
          <SkeletonGrid />
        ) : servicios.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {servicios.map((s) => (
              <ServiceCard key={s.idServicio} servicio={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-accent text-white shadow-sm"
          : "border border-gray-200 bg-white text-gray-600 hover:border-accent/40 hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          <div className="h-28 animate-pulse bg-gray-100" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-1/4 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-20 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h3 className="font-semibold text-foreground">
        No encontramos servicios con esos criterios
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Probá con otra búsqueda o cambiá el filtro de tipo.
      </p>
    </div>
  );
}
