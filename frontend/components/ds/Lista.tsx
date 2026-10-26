// Lista agrupada, Fila y Tesela (componente "ListaAgrupada" del sistema).
// La lista agrupada es LA forma de mostrar una lista en LEX.

import Link from "next/link";
import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";

export type TonoTesela = "neutro" | "acento" | "ok";

const TONOS_TESELA: Record<TonoTesela, string> = {
  neutro: "bg-surface-2 text-ink",
  acento: "bg-accent-soft text-on-accent-soft",
  ok: "bg-ok-soft text-ok-ink",
};

/** Ícono en un cuadrado de 44 px. En el Banco de Turnos, tono "acento". */
export function Tesela({ icono, tono = "neutro" }: { icono: NombreIcono; tono?: TonoTesela }) {
  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-control ${TONOS_TESELA[tono]}`}>
      <Icono nombre={icono} className="size-6" />
    </span>
  );
}

/** Grupo de filas: superficie con filete en claro, sin filete en oscuro. */
export function Grupo({ titulo, children, className = "" }: { titulo?: string; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      {titulo && <h2 className="mx-1 mb-2 text-[15px] font-semibold text-ink-2">{titulo}</h2>}
      <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
        {children}
      </ul>
    </section>
  );
}

/** Una fila de 64 px o más. Con `href` es un link; con `onClick`, un botón;
 *  sin ninguno, solo muestra. */
export function Fila({
  titulo,
  descripcion,
  icono,
  tonoTesela,
  fin,
  href,
  onClick,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  icono?: NombreIcono;
  tonoTesela?: TonoTesela;
  /** Lo que va a la derecha: un valor, un contador o un chip. El chevron va solo si hay destino. */
  fin?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const interactiva = !!href || !!onClick;
  const contenido = (
    <>
      {icono && <Tesela icono={icono} tono={tonoTesela} />}
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-[1.35] font-semibold">{titulo}</span>
        {descripcion && <span className="block text-[15px] leading-[1.4] text-ink-2">{descripcion}</span>}
      </span>
      {(fin || interactiva) && (
        <span className="ml-auto flex shrink-0 items-center gap-2 text-[15px] text-ink-3">
          {fin}
          {interactiva && <Icono nombre="chev-r" />}
        </span>
      )}
    </>
  );
  const clases = `flex min-h-16 w-full items-center gap-3.5 px-4 py-3 text-left text-ink no-underline ${interactiva ? "hover:bg-surface-2" : ""}`;
  // Separador con sangría: arranca alineado al texto (74 px con tesela, 16 sin ella).
  const separador = `relative before:absolute before:top-0 before:right-0 before:h-px before:bg-line first:before:hidden ${icono ? "before:left-[74px]" : "before:left-4"}`;
  return (
    <li className={separador}>
      {href ? (
        <Link href={href} className={clases}>
          {contenido}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={clases}>
          {contenido}
        </button>
      ) : (
        <div className={clases}>{contenido}</div>
      )}
    </li>
  );
}
