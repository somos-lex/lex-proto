// Piezas comunes de los flujos de contratar (Clase y Salud): la cabecera, cada paso
// numerado y el resumen con la confirmación. En escritorio el resumen es un aside fijo,
// como en la ficha; en mobile va después de los pasos.

import Link from "next/link";
import type { ReactNode } from "react";
import type { ServicioDetalleResponse } from "@/lib/servicios";
import { Icono } from "@/components/Icono";
import { PortadaMini } from "@/components/ds/Portada";
import { Precio } from "@/components/ds/Precio";
import { RielPagoProtegido } from "@/components/ds/Riel";
import { CredencialCompacta, SupervisorCompacto } from "@/components/ds/Credencial";
import { Esqueleto } from "@/components/ds/Estados";
import { credencialCompacta, temaDe, unidadDe } from "./presentacion";

export function LayoutFlujo({ cabecera, children, resumen }: { cabecera: ReactNode; children: ReactNode; resumen: ReactNode }) {
  return (
    <div className="mx-auto max-w-lex px-4 pb-6 md:px-6 lg:px-8">
      {cabecera}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_384px] lg:items-start lg:gap-12">
        <div className="grid min-w-0 gap-8">{children}</div>
        {resumen}
      </div>
    </div>
  );
}

export function CabeceraFlujo({ servicio }: { servicio: ServicioDetalleResponse }) {
  return (
    <div className="pt-2 lg:pt-3">
      <Link
        href={`/servicios/${servicio.id}`}
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-[15px] text-ink-2 no-underline hover:text-ink"
      >
        <Icono nombre="chev-r" className="size-4 rotate-180" />
        Volver al servicio
      </Link>
      <p className="mt-2 text-[15px] text-ink-2">Contratar</p>
      <h1 className="text-title-1-mobile text-balance lg:text-title-1">{servicio.titulo}</h1>
    </div>
  );
}

/** Un paso del flujo: número, título y contenido. */
export function Paso({ n, titulo, ayuda, children }: { n: number; titulo: string; ayuda?: ReactNode; children: ReactNode }) {
  const id = `paso-${n}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="flex items-center gap-3 text-title-3">
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-[15px] font-[650] tabular-nums">
          {n}
        </span>
        {titulo}
      </h2>
      {ayuda && <p className="mt-1 pl-11 text-[15px] text-ink-2">{ayuda}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Resumen de lo que se contrata y la confirmación (`children`). */
export function ResumenContratar({ servicio, children }: { servicio: ServicioDetalleResponse; children: ReactNode }) {
  const nombre = servicio.estudianteNombre.trim().split(/\s+/)[0];
  const paquete = servicio.tipo === "Clase" ? (servicio.detalle as { esPaquete?: boolean; cantidadSesionesPaquete?: number | null }) : null;
  return (
    <aside
      aria-label="Resumen"
      className="rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] lg:sticky lg:top-23 lg:rounded-[24px] lg:p-6 lg:shadow-float dark:shadow-none"
    >
      <div className="flex items-start gap-3.5">
        <PortadaMini tipo={servicio.tipo} tema={temaDe(servicio)} tamano={64} />
        <div className="grid min-w-0 gap-2">
          <p className="text-base leading-[1.3] font-[620]">{servicio.titulo}</p>
          {servicio.credencial ? (
            <CredencialCompacta nombre={servicio.estudianteNombre} detalle={credencialCompacta(servicio.credencial)} />
          ) : (
            <p className="text-[15px] font-semibold">{servicio.estudianteNombre}</p>
          )}
          {servicio.supervisor && <SupervisorCompacto nombre={servicio.supervisor.nombre} matricula={servicio.supervisor.matricula} />}
        </div>
      </div>
      <Precio monto={servicio.precio} unidad={unidadDe(servicio.tipo, paquete)} grande className="mt-5" />
      <div className="mt-4">{children}</div>
      <h2 className="mt-6 mb-3.5 text-title-3">Tu pago, protegido</h2>
      <RielPagoProtegido quien={nombre} liberacion="sesiones" conConsentimiento={servicio.tipo === "Salud"} />
    </aside>
  );
}

/** Lo que falta para confirmar, en una frase: "Te falta elegir el horario y aceptar el consentimiento." */
export function faltante(items: string[]) {
  if (items.length === 0) return null;
  const lista = items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
  return `Te falta ${lista}.`;
}

export function EsqueletoFlujo() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="mx-auto max-w-lex px-4 pt-4 md:px-6 lg:px-8">
      <Esqueleto className="h-4 w-36" />
      <Esqueleto className="mt-4 h-9 w-3/4 max-w-xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_384px] lg:gap-12">
        <div className="grid gap-4">
          <Esqueleto className="h-6 w-48" />
          <Esqueleto className="h-64 w-full rounded-card" />
        </div>
        <Esqueleto className="h-96 w-full rounded-card" />
      </div>
    </div>
  );
}
