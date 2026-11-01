import { Cargando, Esqueleto } from "@/components/ds/Estados";

// Carga de la ficha de un servicio. Reemplaza la genérica de app/loading.tsx
// (pensada para una página pública cualquiera): esta reserva el alto real de
// la ficha (medido contra un servicio activo) para que el pie no se corra
// cuando entra el contenido. Pocos bloques grandes en vez de muchas líneas:
// cuesta menos reconciliar al reemplazarla por el contenido real.
export default function Loading() {
  return (
    <Cargando etiqueta="Cargando el servicio">
      <div className="mx-auto max-w-lex px-4 md:px-6 lg:px-8">
        <div aria-hidden="true" className="mt-2 mb-2 h-11 lg:mt-3 lg:mb-4" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_384px] lg:items-start lg:gap-12">
          <div className="min-w-0">
            <Esqueleto className="aspect-[21/8] w-full rounded-card" />
            <Esqueleto className="mt-5 h-[94px] w-full max-w-md rounded-card" />
            <Esqueleto className="mt-9 h-[330px] w-full max-w-xl rounded-card" />
            <Esqueleto className="mt-9 h-[261px] w-full max-w-xl rounded-card" />
            <Esqueleto className="mt-9 h-[247px] w-full max-w-xl rounded-card" />
          </div>
          <Esqueleto className="sticky top-23 hidden h-[420px] w-full rounded-[24px] lg:block" />
        </div>
      </div>

      <div aria-hidden="true" className="sticky bottom-0 mt-8 h-[87px] rounded-t-sheet bg-surface shadow-sheet lg:hidden" />
    </Cargando>
  );
}
