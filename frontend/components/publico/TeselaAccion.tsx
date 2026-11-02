// Tesela de acción del hub de la home (componente "Tesela" del sistema): una fila
// grande y tocable, 76 px en mobile y 104 desde 1024. Las secundarias van en
// `surface`; la principal ("Contratar un servicio") vive en HeroPublico.tsx porque lleva
// además los accesos a las verticales.

import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";
import { Tesela, type TonoTesela } from "@/components/ds/Lista";

export const CLASES_TESELA =
  "flex h-full min-h-19 w-full items-center gap-3.5 rounded-card bg-surface py-3 pr-3.5 pl-3 text-left text-ink no-underline shadow-[0_0_0_1px_var(--color-line)] hover:bg-surface-2 lg:min-h-26 lg:p-5 dark:shadow-none";

export function ContenidoTesela({
  icono,
  tono,
  titulo,
  descripcion,
}: {
  icono: NombreIcono;
  tono?: TonoTesela;
  titulo: string;
  descripcion: ReactNode;
}) {
  return (
    <>
      <Tesela icono={icono} tono={tono} />
      <span className="min-w-0 flex-1">
        <span className="block text-title-3">{titulo}</span>
        <span className="block text-[15px] leading-[1.4] text-ink-2">{descripcion}</span>
      </span>
      <Icono nombre="chev-r" className="size-5.5 text-ink-3" />
    </>
  );
}
