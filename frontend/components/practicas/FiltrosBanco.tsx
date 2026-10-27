"use client";

// Filtros reales de la API del Banco de Turnos (carrera, tipo de paciente, desde y
// hasta). Es un GET plano a /practicas: cada combinación es un link compartible y
// funciona sin JavaScript. En escritorio va en una franja; en mobile, en una Hoja.

import { useState } from "react";
import Link from "next/link";
import type { FiltrosDisponibles } from "@/lib/practicas";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Field, Input, Select } from "@/components/ui";
import { Hoja } from "@/components/ds/Hoja";

interface Props {
  filtros: FiltrosDisponibles;
  carreras: [number, string][];
  /** Texto de resultados: "3 turnos disponibles". */
  resumen: string;
}

function Campos({ filtros, carreras, prefijo, enHoja }: Omit<Props, "resumen"> & { prefijo: string; enHoja?: boolean }) {
  return (
    <div className={`grid gap-4 ${enHoja ? "" : "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"}`}>
      <Field label="Carrera" htmlFor={`${prefijo}-carrera`}>
        <Select id={`${prefijo}-carrera`} name="carreraId" defaultValue={filtros.carreraId ?? ""}>
          <option value="">Todas</option>
          {carreras.map(([id, nombre]) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Paciente" htmlFor={`${prefijo}-paciente`}>
        <Select id={`${prefijo}-paciente`} name="tipoPaciente" defaultValue={filtros.tipoPaciente ?? ""}>
          <option value="">Persona o mascota</option>
          <option value="Humano">Persona</option>
          <option value="Animal">Mascota</option>
        </Select>
      </Field>
      <Field label="Desde" htmlFor={`${prefijo}-desde`}>
        <Input id={`${prefijo}-desde`} type="date" name="desde" defaultValue={filtros.desde} />
      </Field>
      <Field label="Hasta" htmlFor={`${prefijo}-hasta`}>
        <Input id={`${prefijo}-hasta`} type="date" name="hasta" defaultValue={filtros.hasta} />
      </Field>
    </div>
  );
}

export function FiltrosBanco({ filtros, carreras, resumen }: Props) {
  const [abierta, setAbierta] = useState(false);
  const hayFiltros = Object.values(filtros).some((v) => v !== undefined);
  const cantidad = Object.values(filtros).filter((v) => v !== undefined).length;

  return (
    <>
      {/* Escritorio: franja */}
      <form
        method="get"
        action="/practicas"
        aria-label="Filtrar turnos"
        className="hidden rounded-card bg-surface px-5 pt-4 pb-5 shadow-[0_0_0_1px_var(--color-line)] lg:block dark:shadow-none"
      >
        <Campos filtros={filtros} carreras={carreras} prefijo="f" />
        <div className="mt-4 flex items-center gap-2">
          <Boton type="submit" variante="tonal" tamano="sm">
            <Icono nombre="filter" />
            Filtrar
          </Boton>
          {hayFiltros && (
            <Link href="/practicas" className={clasesBoton({ variante: "fantasma", tamano: "sm" })}>
              Limpiar filtros
            </Link>
          )}
          <p className="ml-auto text-[15px] text-ink-2">{resumen}</p>
        </div>
      </form>

      {/* Mobile: resumen y la hoja */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <p className="text-[15px] text-ink-2">{resumen}</p>
        <Boton variante="secundario" tamano="sm" onClick={() => setAbierta(true)} aria-haspopup="dialog">
          <Icono nombre="filter" />
          Filtrar
          {cantidad > 0 && (
            <span className="inline-grid h-5.5 min-w-5.5 place-items-center rounded-pill bg-surface-2 px-1.5 text-[13px] font-bold tabular-nums">
              <span className="sr-only">, </span>
              {cantidad}
              <span className="sr-only"> {cantidad === 1 ? "filtro activo" : "filtros activos"}</span>
            </span>
          )}
        </Boton>
      </div>
      <Hoja abierto={abierta} onCerrar={() => setAbierta(false)} titulo="Filtrar turnos">
        <form method="get" action="/practicas">
          <Campos filtros={filtros} carreras={carreras} prefijo="h" enHoja />
          <div className="mt-5 flex gap-2.5">
            <Link href="/practicas" className={clasesBoton({ variante: "tonal", tamano: "lg", className: "flex-1" })}>
              Limpiar
            </Link>
            <Boton type="submit" tamano="lg" className="flex-[2]">
              Ver turnos
            </Boton>
          </div>
        </form>
      </Hoja>
    </>
  );
}
