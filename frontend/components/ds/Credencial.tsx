// Credencial, Sello y Supervisor (componentes de "Confianza" del sistema de diseño).
//
// - Sello: la ÚNICA forma de "verificado" del sistema. Solo al lado de un
//   estudiante cuya carrera verificó LEX.
// - Carnet: la pieza de firma, solo del estudiante (ficha, hoja, panel).
// - CredencialCompacta: para tarjetas y turnos.
// - Supervisor: mismo tamaño y lugar que el carnet, pero neutro: sin tinte,
//   sin sello y sin "LEX" (LEX no verifica matrículas).
//
// En público la credencial siempre está verificada: los estados "En revisión"
// y "No verificada" existen solo en el panel del propio estudiante (prop `pie`).

import type { ReactNode } from "react";
import { Icono } from "@/components/Icono";

export function Sello({ grande = false }: { grande?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Carrera verificada por LEX"
      className={`shrink-0 text-ok ${grande ? "size-6" : "size-[18px]"}`}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="6.5" fill="currentColor" />
      <path d="m7.8 12.2 2.9 2.9 5.5-5.8" fill="none" stroke="var(--color-surface)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "Odontología, 5.º año". */
export function carreraYAnio(carrera: string, anio?: number | null) {
  return anio ? `${carrera}, ${anio}.º año` : carrera;
}

export function Carnet({
  rol = "Atiende",
  nombre,
  carrera,
  anio,
  institucion,
  pie,
  chico = false,
  nombreComo: Nombre = "p",
}: {
  /** "Atiende" en la ficha, "Tu credencial" en el panel. */
  rol?: string;
  nombre: string;
  carrera: string;
  anio?: number | null;
  /** Completa: "Universidad Nacional del Nordeste (UNNE)". */
  institucion: string;
  /** Reemplaza "Carrera verificada por LEX" (estados del panel). */
  pie?: ReactNode;
  chico?: boolean;
  /** Etiqueta del nombre, por si el carnet encabeza una sección. */
  nombreComo?: "p" | "h2" | "h3";
}) {
  return (
    <div
      className={`relative isolate grid content-start gap-1 overflow-hidden rounded-card bg-cred ${chico ? "px-[18px] pt-4 pb-[18px]" : "px-[22px] pt-5 pb-[22px]"}`}
    >
      <div className="mb-3.5 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-control bg-surface text-link">
          <Icono nombre="cap" className="size-6" />
        </span>
        <span className="text-[15px] font-semibold text-link">{rol}</span>
        <span aria-hidden="true" className="ml-auto text-base font-[760] tracking-[0.04em] text-link">
          LEX
        </span>
      </div>
      <Nombre className={`leading-[1.2] font-semibold tracking-[-0.012em] text-ink ${chico ? "text-[19px]" : "text-[22px]"}`}>
        {nombre}
      </Nombre>
      <p className="text-base leading-[1.4] text-ink">{carreraYAnio(carrera, anio)}</p>
      <p className="text-[15px] leading-[1.4] text-ink-2">{institucion}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
        {pie ?? (
          <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-ok-ink">
            <Sello grande />
            Carrera verificada por LEX
          </span>
        )}
      </div>
      {/* Marca de agua: el mismo sello, grande. Decorativa. */}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute -right-[30px] -bottom-10 -z-10 size-[168px] text-cred-mark">
        <rect x="2.5" y="2.5" width="19" height="19" rx="6.5" fill="currentColor" />
      </svg>
    </div>
  );
}

/** Sello y nombre, y debajo "Carrera, año, institución". En tarjetas usá la
 *  sigla de la institución cuando el nombre la trae entre paréntesis. */
export function CredencialCompacta({ nombre, detalle }: { nombre: string; detalle: string }) {
  return (
    <div className="grid min-w-0 gap-px">
      <p className="flex items-center gap-1.5 text-[15px] leading-[1.35] font-semibold text-ink">
        <Sello />
        <span className="min-w-0">{nombre}</span>
      </p>
      <p className="pl-6 text-[14px] leading-[1.4] text-ink-2">{detalle}</p>
    </div>
  );
}

export function Supervisor({
  nombre,
  matricula,
  nota = "Profesional matriculado que supervisa la práctica.",
}: {
  nombre: string;
  matricula: string;
  nota?: string;
}) {
  return (
    <div className="grid content-start gap-1 rounded-card bg-surface-2 px-[22px] pt-5 pb-[22px]">
      <div className="mb-3.5 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-control bg-surface text-ink">
          <Icono nombre="steth" className="size-6" />
        </span>
        <span className="text-[15px] font-semibold text-ink-2">Supervisa</span>
      </div>
      <p className="text-[19px] leading-[1.2] font-semibold tracking-[-0.012em] text-ink">{nombre}</p>
      <p className="text-base leading-[1.4] text-ink">Matrícula {matricula}</p>
      <p className="text-[15px] leading-[1.4] text-ink-2">{nota}</p>
    </div>
  );
}

export function SupervisorCompacto({ nombre, matricula }: { nombre: string; matricula: string }) {
  return (
    <div className="grid min-w-0 gap-px">
      <p className="flex items-center gap-1.5 text-[15px] leading-[1.35] font-semibold text-ink">
        <Icono nombre="steth" className="size-[18px] text-ink-2" />
        <span className="min-w-0">
          <span className="font-medium text-ink-2">Supervisa</span> {nombre}
        </span>
      </p>
      <p className="pl-6 text-[14px] leading-[1.4] text-ink-2">Mat. {matricula}</p>
    </div>
  );
}

/** Institución corta para tarjetas: la sigla si el nombre la trae entre
 *  paréntesis ("Universidad Nacional del Nordeste (UNNE)" → "UNNE"). */
export function institucionCorta(institucion: string) {
  const m = /\(([^)]+)\)\s*$/.exec(institucion);
  return m ? m[1] : institucion;
}

/** "Licenciatura en X" → "Lic. en X", para tarjetas. */
export function carreraCorta(carrera: string) {
  return carrera.replace(/^Licenciatura en /, "Lic. en ");
}
