import Link from "next/link";
import type { TipoServicio } from "@/lib/servicios";

// Paginacion por Links (Server Component): conserva el filtro de vertical activo y solo
// pone `page` en la URL cuando es > 1, para que la pagina 1 quede en la URL limpia "/".
function construirUrl(page: number, tipo?: TipoServicio): string {
  const qs = new URLSearchParams();
  if (tipo) qs.set("tipo", tipo);
  if (page > 1) qs.set("page", String(page));
  return qs.toString() ? `/?${qs.toString()}` : "/";
}

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

  const anterior = page > 1;
  const siguiente = page < totalPages;

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-2"
      aria-label="Paginación"
    >
      {anterior ? (
        <Link
          href={construirUrl(page - 1, tipoActivo)}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
          rel="prev"
        >
          ← Anterior
        </Link>
      ) : (
        <span className="px-4 py-2 rounded-lg border border-slate-200 text-slate-400 text-sm font-medium cursor-not-allowed">
          ← Anterior
        </span>
      )}

      <span className="px-4 py-2 text-sm text-slate-600">
        Página {page} de {totalPages}
      </span>

      {siguiente ? (
        <Link
          href={construirUrl(page + 1, tipoActivo)}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
          rel="next"
        >
          Siguiente →
        </Link>
      ) : (
        <span className="px-4 py-2 rounded-lg border border-slate-200 text-slate-400 text-sm font-medium cursor-not-allowed">
          Siguiente →
        </span>
      )}
    </nav>
  );
}
