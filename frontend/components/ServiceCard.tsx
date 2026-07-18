import Link from "next/link";
import { formatPrecio, type ServicioResponse } from "@/lib/servicios";
import { RatingBadge } from "@/components/Stars";
import { TipoBadge } from "@/components/TipoBadge";
import { ServiceCover } from "@/components/ServiceCover";

// Presentacional: no tiene interactividad propia, asi que puede renderizarse desde un
// Server Component (los hijos ServiceCover / RatingBadge son los que llevan "use client").
export default function ServiceCard({ servicio }: { servicio: ServicioResponse }) {
  return (
    <Link
      href={`/servicios/${servicio.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
    >
      {/* Portada: imagen del servicio o, si no hay / falla, el placeholder "LEX". */}
      <ServiceCover
        src={servicio.imagenUrl}
        alt={servicio.titulo}
        className="h-28 lg:h-36"
      />

      <div className="flex flex-1 flex-col p-4 lg:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <TipoBadge tipo={servicio.tipo} />
          <RatingBadge value={servicio.estudianteCalificacion} />
        </div>

        <h3 className="line-clamp-2 font-semibold text-foreground transition group-hover:text-accent lg:text-lg">
          {servicio.titulo}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          por <span className="font-medium">{servicio.estudianteNombre}</span>
        </p>

        <div className="mt-4 flex items-end justify-end border-t border-gray-100 pt-3">
          <span className="text-lg font-bold text-foreground lg:text-xl">
            {formatPrecio(servicio.precio)}
          </span>
        </div>
      </div>
    </Link>
  );
}
