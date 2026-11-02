// Estados de pantalla (componentes "Esqueleto" y "Vacio" del sistema).
// Cada pantalla diseña carga, vacío, error (Aviso) y éxito (Toast/Aviso).

import type { ReactNode } from "react";
import type { NombreIcono } from "@/components/Icono";
import { Tesela } from "@/components/ds/Lista";

/** Un bloque de carga. Armá el esqueleto con la misma forma que el contenido final. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none ${className}`} />;
}

/** Contenedor de una zona que está cargando. */
export function Cargando({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div aria-busy="true" aria-label={etiqueta}>
      {children}
    </div>
  );
}

/** Esqueleto de una tarjeta o fila de servicio. */
export function EsqueletoTarjeta() {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3.5 rounded-card bg-surface p-3 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      <Esqueleto className="size-22 rounded-button" />
      <div className="grid content-start gap-2.5 pt-1.5">
        <Esqueleto className="h-3 w-4/5" />
        <Esqueleto className="h-3 w-3/5" />
        <Esqueleto className="h-3 w-2/5" />
      </div>
    </div>
  );
}

/** Vacío: dice por qué no hay nada y ofrece una acción por rol. Si hay datos
 *  pero no con esos filtros, decilo así y ofrecé "Limpiar filtros". */
export function Vacio({
  icono,
  titulo,
  children,
  acciones,
  className = "",
}: {
  icono: NombreIcono;
  titulo: string;
  children?: ReactNode;
  acciones?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid justify-items-start gap-3 rounded-card bg-surface px-5 py-6 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none ${className}`}>
      <Tesela icono={icono} tono="acento" />
      <p className="text-title-3">{titulo}</p>
      {children && <div className="max-w-[62ch] text-[15px] leading-[1.45] text-ink-2">{children}</div>}
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}
