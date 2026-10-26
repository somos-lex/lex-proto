import { Esqueleto } from "@/components/ds/Estados";

// Esqueleto de una tarjeta del catálogo con la misma forma que ServiceCard: fila con
// la portada mini en mobile y tarjeta con portada 16:10 desde 720 px.
export function EsqueletoServicio() {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-3.5 rounded-card bg-surface p-3 shadow-[0_0_0_1px_var(--color-line)] min-[720px]:flex min-[720px]:flex-col min-[720px]:gap-3 min-[720px]:px-2 min-[720px]:pt-2 min-[720px]:pb-4 dark:shadow-none">
      <Esqueleto className="size-22 rounded-button min-[720px]:hidden" />
      <Esqueleto className="hidden aspect-[16/10] w-full rounded-button min-[720px]:block" />
      <div className="grid w-full content-start gap-2.5 pt-1.5 min-[720px]:px-2">
        <Esqueleto className="h-4 w-4/5" />
        <Esqueleto className="h-3.5 w-3/5" />
        <Esqueleto className="h-3.5 w-2/3" />
        <Esqueleto className="mt-2 h-5 w-2/5" />
      </div>
    </div>
  );
}

export const CLASES_GRILLA = "grid gap-2.5 min-[720px]:grid-cols-2 min-[720px]:gap-4 lg:grid-cols-4";

export function EsqueletoGrilla({ cantidad = 8, etiqueta }: { cantidad?: number; etiqueta: string }) {
  return (
    <div aria-busy="true" aria-label={etiqueta} className={CLASES_GRILLA}>
      {Array.from({ length: cantidad }, (_, i) => (
        <EsqueletoServicio key={i} />
      ))}
    </div>
  );
}
