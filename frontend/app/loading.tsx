import { Cargando, Esqueleto } from "@/components/ds/Estados";

// Carga de una página que todavía no tiene la suya: la forma general de una página
// pública (título, bajada y un bloque de contenido), sin spinner.
export default function Loading() {
  return (
    <Cargando etiqueta="Cargando la página">
      <div className="mx-auto max-w-lex px-4 pt-8 md:px-6 lg:px-8 lg:pt-12">
        <Esqueleto className="h-9 w-2/3 max-w-xl" />
        <Esqueleto className="mt-4 h-4 w-full max-w-2xl" />
        <Esqueleto className="mt-2.5 h-4 w-4/5 max-w-xl" />
        <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_384px] lg:gap-12">
          <Esqueleto className="h-64 w-full rounded-card" />
          <Esqueleto className="hidden h-72 w-full rounded-card lg:block" />
        </div>
      </div>
    </Cargando>
  );
}
