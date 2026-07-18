import {
  listarServicios,
  TIPOS_SERVICIO,
  type TipoServicio,
} from "@/lib/servicios";
import ServiceCard from "@/components/ServiceCard";
import Paginacion from "@/components/Paginacion";
import HeroPublico from "@/components/HeroPublico";
import FiltrosVertical from "@/components/FiltrosVertical";

interface Props {
  searchParams: Promise<{ tipo?: string; page?: string }>;
}

const TIPOS_VALIDOS = TIPOS_SERVICIO.map((t) => t.valor);

// Un `?tipo=` desconocido se ignora (se muestran todos), en vez de reenviarlo al
// backend, que rechazaria un valor de enum invalido con 400.
function parsearTipo(valor?: string): TipoServicio | undefined {
  return valor && TIPOS_VALIDOS.includes(valor as TipoServicio)
    ? (valor as TipoServicio)
    : undefined;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const tipo = parsearTipo(params.tipo);
  const pageParsed = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;

  const resultado = await listarServicios({
    tipo,
    activo: true,
    page,
    pageSize: 12,
  });

  return (
    <div className="min-h-screen">
      <HeroPublico />
      <FiltrosVertical tipoActivo={tipo} />

      <section className="max-w-7xl mx-auto px-6 py-8">
        {resultado.items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resultado.items.map((servicio) => (
                <ServiceCard key={servicio.id} servicio={servicio} />
              ))}
            </div>
            <Paginacion
              page={resultado.page}
              totalPages={resultado.totalPages}
              tipoActivo={tipo}
            />
          </>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg">
      <p className="text-slate-600 mb-2">
        No hay servicios que coincidan con los filtros.
      </p>
      <p className="text-sm text-slate-500">
        Probá con otro tipo o volvé a la home.
      </p>
    </div>
  );
}
