"use client";

import { useEffect, useRef, useState } from "react";
import {
  listarServicios,
  TIPOS_SERVICIO,
  type Servicio,
} from "@/lib/servicios";
import { ApiError } from "@/lib/api";
import { ServiceCard } from "@/components/ServiceCard";
import { ErrorAlert } from "@/components/ui";

// ---------- helpers ----------

const TOP_N_DESTACADOS = 8;
const MIN_CALIFICACION = 0.01; // excluye estudiantes sin reseñas

function getDestacados(servicios: Servicio[]): Servicio[] {
  return [...servicios]
    .filter((s) => s.estudianteCalificacion >= MIN_CALIFICACION)
    .sort((a, b) => b.estudianteCalificacion - a.estudianteCalificacion)
    .slice(0, TOP_N_DESTACADOS);
}

function agruparPorTipo(
  servicios: Servicio[],
): { tipo: (typeof TIPOS_SERVICIO)[number]; items: Servicio[] }[] {
  return TIPOS_SERVICIO.map((tipo) => ({
    tipo,
    items: servicios.filter((s) => s.tipoServicioId === tipo.id),
  })).filter((g) => g.items.length > 0);
}

// ---------- Carrusel ----------

function Carrusel({ items }: { items: Servicio[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const SCROLL_STEP = 280 * 2;

  function checkScroll() {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [items]);

  function scroll(dir: "left" | "right") {
    ref.current?.scrollBy({
      left: dir === "left" ? -SCROLL_STEP : SCROLL_STEP,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative group/carrusel">
      <button
        onClick={() => scroll("left")}
        aria-label="Anterior"
        className={`
          absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-3
          flex h-9 w-9 items-center justify-center rounded-full
          border border-gray-200 bg-white shadow-md
          text-gray-600 hover:text-accent hover:border-accent/40
          transition-all duration-200
          ${canLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        ref={ref}
        className="flex items-stretch gap-5 overflow-x-auto scroll-smooth pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((s) => (
          <div
            key={s.idServicio}
            className="w-64 shrink-0 sm:w-72 flex flex-col"
          >
            <div className="flex flex-col flex-1 [&>a]:flex-1 [&>a]:flex [&>a]:flex-col">
              <ServiceCard servicio={s} />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        aria-label="Siguiente"
        className={`
          absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-3
          flex h-9 w-9 items-center justify-center rounded-full
          border border-gray-200 bg-white shadow-md
          text-gray-600 hover:text-accent hover:border-accent/40
          transition-all duration-200
          ${canRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

// ---------- Skeleton ----------

function SkeletonCarrusel() {
  return (
    <div className="space-y-10">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="mb-4 h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="flex gap-5">
            {Array.from({ length: 4 }).map((_, j) => (
              <div
                key={j}
                className="w-64 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white sm:w-72"
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
        </div>
      ))}
    </div>
  );
}

// ---------- Encabezado de sección ----------

function SeccionHeader({
  titulo,
  cantidad,
  destacado = false,
}: {
  titulo: string;
  cantidad: number;
  destacado?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {destacado && (
        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 ring-1 ring-inset ring-amber-100">
          <svg
            className="h-3.5 w-3.5 text-amber-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.97 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.354 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
          </svg>
          Destacados
        </span>
      )}
      <h2 className="text-lg font-bold text-foreground">{titulo}</h2>
      <span className="text-sm text-gray-400">
        {cantidad} servicio{cantidad !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

// ---------- Page ----------

export default function Home() {
  const [texto, setTexto] = useState("");
  const [debouncedTexto, setDebouncedTexto] = useState("");
  const [tipoServicioId, setTipoServicioId] = useState<number | null>(null);

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTexto(texto), 350);
    return () => clearTimeout(t);
  }, [texto]);

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

  const grupos = agruparPorTipo(servicios);

  // Solo mostramos destacados cuando no hay filtro activo de tipo ni búsqueda
  // de texto, para que no compita con resultados filtrados.
  const mostrarDestacados = !tipoServicioId && !debouncedTexto.trim();
  const destacados = mostrarDestacados ? getDestacados(servicios) : [];

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
        <div className="mb-10 flex flex-wrap gap-2">
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
          <SkeletonCarrusel />
        ) : servicios.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-12">
            {/* Sección destacados */}
            {mostrarDestacados && destacados.length > 0 && (
              <div>
                <SeccionHeader
                  titulo="Mejor calificados"
                  cantidad={destacados.length}
                  destacado
                />
                <Carrusel items={destacados} />
              </div>
            )}

            {/* Divisor solo si hay destacados y hay secciones por tipo debajo */}
            {mostrarDestacados &&
              destacados.length > 0 &&
              grupos.length > 0 && <hr className="border-gray-100" />}

            {/* Secciones por tipo */}
            {grupos.map(({ tipo, items }) => (
              <div key={tipo.id}>
                <SeccionHeader titulo={tipo.nombre} cantidad={items.length} />
                <Carrusel items={items} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------- FilterPill ----------

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

// ---------- EmptyState ----------

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
