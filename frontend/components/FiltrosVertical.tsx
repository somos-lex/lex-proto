import Link from "next/link";
import { TIPOS_SERVICIO, type TipoServicio } from "@/lib/servicios";

// Pills de filtro por vertical. Navega con Links (cambian el query param `tipo`), asi que
// no necesita estado de cliente: funciona como Server Component.
export default function FiltrosVertical({
  tipoActivo,
}: {
  tipoActivo?: TipoServicio;
}) {
  return (
    <nav className="border-b border-slate-200 bg-white sticky top-16 z-10">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
        <Link
          href="/"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            !tipoActivo
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Todos
        </Link>
        {TIPOS_SERVICIO.map((t) => (
          <Link
            key={t.valor}
            href={`/?tipo=${t.valor}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              tipoActivo === t.valor
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t.etiqueta}
          </Link>
        ))}
      </div>
    </nav>
  );
}
