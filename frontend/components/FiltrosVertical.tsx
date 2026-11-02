import Link from "next/link";
import type { TipoServicio } from "@/lib/servicios";
import { VERTICALES } from "@/components/publico/presentacion";

// Filtro por vertical del catálogo (componente "Segmentado" del sistema): una sola
// opción entre pocas. Son links que cambian `?tipo=` (sin estado de cliente) y llevan
// al ancla del catálogo. La opción actual NO es violeta: es un estado, no una acción.
// En 390 px se desliza en horizontal y avisa con un fundido en el borde derecho.

export function urlCatalogo(tipo?: TipoServicio, page = 1) {
  const qs = new URLSearchParams();
  if (tipo) qs.set("tipo", tipo);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return `/${s ? `?${s}` : ""}#servicios`;
}

export default function FiltrosVertical({ tipoActivo }: { tipoActivo?: TipoServicio }) {
  const opciones = [{ tipo: undefined, nombre: "Todos" }, ...VERTICALES];
  return (
    <nav
      aria-label="Filtrar por tipo de servicio"
      className="flex w-max max-w-full gap-0.5 overflow-x-auto rounded-pill bg-surface-2 p-[3px] [scrollbar-width:none] max-[719px]:[mask-image:linear-gradient(to_right,black_82%,transparent)]"
    >
      {opciones.map((o) => {
        const actual = o.tipo === tipoActivo;
        return (
          <Link
            key={o.nombre}
            href={urlCatalogo(o.tipo)}
            aria-current={actual ? "true" : undefined}
            className={`flex min-h-11 shrink-0 items-center rounded-pill px-4 text-[15px] whitespace-nowrap no-underline focus-visible:-outline-offset-2 ${
              actual
                ? "bg-surface font-[620] text-ink shadow-thumb dark:bg-surface-3"
                : "font-[550] text-ink-2 hover:text-ink"
            }`}
          >
            {o.nombre}
          </Link>
        );
      })}
    </nav>
  );
}
