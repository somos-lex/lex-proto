// Marco de las páginas del área de cliente y admin dentro del panel: ancho de
// contenido (el lateral lo pone app/panel/layout.tsx), título y bajada.

import type { ReactNode } from "react";

export function Pagina({ children, angosta = false }: { children: ReactNode; angosta?: boolean }) {
  return (
    <div className={`mx-auto w-full px-4 pt-6 pb-14 md:px-6 lg:px-8 lg:pt-10 ${angosta ? "max-w-[880px]" : "max-w-[1040px]"}`}>
      {children}
    </div>
  );
}

export function EncabezadoPagina({
  titulo,
  bajada,
  acciones,
  antes,
}: {
  titulo: ReactNode;
  bajada?: ReactNode;
  /** A la derecha en escritorio, debajo en mobile. */
  acciones?: ReactNode;
  /** Arriba del título: el link para volver. */
  antes?: ReactNode;
}) {
  return (
    <header className="grid gap-4 sm:flex sm:items-end sm:justify-between">
      <div className="min-w-0">
        {antes}
        <h1 className="text-title-1-mobile text-balance lg:text-title-1">{titulo}</h1>
        {bajada && <p className="mt-2 max-w-[62ch] text-[17px] leading-[1.5] text-ink-2 lg:text-lead">{bajada}</p>}
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
    </header>
  );
}

/** Título de sección (title-2) con un final opcional (contador, link). */
export function TituloSeccion({
  id,
  children,
  fin,
  como: Etiqueta = "h2",
}: {
  id?: string;
  children: ReactNode;
  fin?: ReactNode;
  como?: "h2" | "h3";
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
      <Etiqueta id={id} className="text-title-2-mobile lg:text-title-2">
        {children}
      </Etiqueta>
      {fin}
    </div>
  );
}
