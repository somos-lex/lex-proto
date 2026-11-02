import Link from "next/link";
import type { TipoServicio } from "@/lib/servicios";
import { clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { urlCatalogo } from "@/components/FiltrosVertical";

// Paginación del catálogo por links (Server Component): conserva el filtro de
// vertical y vuelve al ancla del catálogo. En la primera y la última página, el
// botón que no aplica queda deshabilitado pero se ve, para que el lugar no salte.
export default function Paginacion({
  page,
  totalPages,
  tipoActivo,
}: {
  page: number;
  totalPages: number;
  tipoActivo?: TipoServicio;
}) {
  if (totalPages <= 1) return null;

  const clases = clasesBoton({ variante: "secundario", tamano: "sm" });
  return (
    <nav aria-label="Páginas del catálogo" className="mt-6 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={urlCatalogo(tipoActivo, page - 1)} rel="prev" className={clases}>
          <Icono nombre="chev-r" className="size-5 rotate-180" />
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={clases}>
          <Icono nombre="chev-r" className="size-5 rotate-180" />
          Anterior
        </span>
      )}

      <p className="px-2 text-center text-[15px] whitespace-nowrap text-ink-2">
        <span className="max-[479px]:sr-only">Página </span>
        {page} de {totalPages}
      </p>

      {page < totalPages ? (
        <Link href={urlCatalogo(tipoActivo, page + 1)} rel="next" className={clases}>
          Siguiente
          <Icono nombre="chev-r" className="size-5" />
        </Link>
      ) : (
        <span aria-disabled="true" className={clases}>
          Siguiente
          <Icono nombre="chev-r" className="size-5" />
        </span>
      )}
    </nav>
  );
}
