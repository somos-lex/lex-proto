"use client";

// Filtro por estado con la forma del "Segmentado" del sistema: links (cada
// opción es una URL), la actual con aria-current y sin violeta (es un estado, no
// una acción). Hasta cinco opciones; con más, en mobile pasa a una Hoja con la
// misma lista, porque un segmentado de ocho no se puede recorrer en 390 px.

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Hoja } from "@/components/ds/Hoja";

export interface OpcionFiltro {
  valor: string;
  etiqueta: string;
  /** Cantidad de trabajos con ese estado. */
  n: number;
}

export function FiltroEstado({
  opciones,
  actual,
  hrefDe,
  etiqueta = "Filtrar por estado",
}: {
  opciones: OpcionFiltro[];
  actual: string;
  hrefDe: (valor: string) => string;
  etiqueta?: string;
}) {
  const muchas = opciones.length > 5;
  return (
    <>
      <div className={muchas ? "max-lg:hidden" : ""}>
        <Segmentado opciones={opciones} actual={actual} hrefDe={hrefDe} etiqueta={etiqueta} />
      </div>
      {muchas && (
        <div className="lg:hidden">
          <FiltroEnHoja opciones={opciones} actual={actual} hrefDe={hrefDe} etiqueta={etiqueta} />
        </div>
      )}
    </>
  );
}

function Segmentado({
  opciones,
  actual,
  hrefDe,
  etiqueta,
}: {
  opciones: OpcionFiltro[];
  actual: string;
  hrefDe: (valor: string) => string;
  etiqueta: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [desborda, setDesborda] = useState(false);

  // En 390 px se desliza en horizontal y avisa con un fundido en el borde derecho,
  // que desaparece al llegar al final.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setDesborda(el.scrollWidth - el.clientWidth - el.scrollLeft > 2);
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      ro.disconnect();
    };
  }, [opciones.length]);

  // La opción actual queda a la vista aunque esté al final.
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [actual]);

  return (
    <nav aria-label={etiqueta}>
      <div
        ref={ref}
        className={`flex w-max max-w-full gap-0.5 overflow-x-auto rounded-pill bg-surface-2 p-[3px] [scrollbar-width:none] ${desborda ? "[mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]" : ""}`}
      >
        {opciones.map((o) => {
          const activa = o.valor === actual;
          return (
            <Link
              key={o.valor}
              href={hrefDe(o.valor)}
              replace
              scroll={false}
              aria-current={activa ? "true" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill px-4 text-[15px] whitespace-nowrap no-underline ${
                activa
                  ? "bg-surface font-[620] text-ink shadow-thumb dark:bg-surface-3"
                  : "font-[550] text-ink-2 hover:text-ink"
              }`}
            >
              {o.etiqueta}
              <span className={`tabular-nums ${activa ? "text-ink-2" : "text-ink-3"}`}>{o.n}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function FiltroEnHoja({
  opciones,
  actual,
  hrefDe,
  etiqueta,
}: {
  opciones: OpcionFiltro[];
  actual: string;
  hrefDe: (valor: string) => string;
  etiqueta: string;
}) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [elegida, setElegida] = useState(actual);
  const nombre = useId();
  const actualOpcion = opciones.find((o) => o.valor === actual) ?? opciones[0];

  function abrir() {
    setElegida(actual);
    setAbierta(true);
  }

  return (
    <>
      <Boton variante="tonal" tamano="sm" onClick={abrir} aria-haspopup="dialog">
        <Icono nombre="filter" />
        Estado: {actualOpcion.etiqueta}
      </Boton>
      <Hoja abierto={abierta} onCerrar={() => setAbierta(false)} titulo={etiqueta}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAbierta(false);
            router.replace(hrefDe(elegida), { scroll: false });
          }}
        >
          <fieldset>
            <legend className="sr-only">{etiqueta}</legend>
            <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:bg-surface-2 dark:shadow-none">
              {opciones.map((o) => (
                <li key={o.valor} className="relative before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-line first:before:hidden">
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 text-base has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-focus">
                    <input
                      type="radio"
                      name={nombre}
                      value={o.valor}
                      checked={elegida === o.valor}
                      onChange={() => setElegida(o.valor)}
                      className="size-5 accent-link focus-visible:outline-none"
                    />
                    <span className="flex-1 font-medium">{o.etiqueta}</span>
                    <span className="text-[15px] text-ink-2 tabular-nums">{o.n}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <Boton type="submit" tamano="lg" bloque className="mt-4">
            Mostrar {opciones.find((o) => o.valor === elegida)?.n ?? 0} trabajos
          </Boton>
        </form>
      </Hoja>
    </>
  );
}
