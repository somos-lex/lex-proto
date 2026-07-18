import Link from "next/link";
import {
  esClase,
  esProyectoCerrado,
  esSalud,
  formatFecha,
  type ServicioDetalleResponse,
} from "@/lib/servicios";
import { TipoBadge } from "@/components/TipoBadge";
import { ServiceCover } from "@/components/ServiceCover";
import { RatingBadge } from "@/components/Stars";

const FORMATO_ENTREGA: Record<string, string> = {
  Archivos: "Archivos",
  Link: "Enlace",
  Ambos: "Archivos y enlace",
};

export default function ServicioDetalle({
  servicio,
}: {
  servicio: ServicioDetalleResponse;
}) {
  return (
    <div>
      <ServiceCover
        src={servicio.imagenUrl}
        alt={servicio.titulo}
        className="mb-6 aspect-[16/9] w-full rounded-xl border border-slate-100"
      />

      <TipoBadge tipo={servicio.tipo} />
      <h1 className="mt-3 text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
        {servicio.titulo}
      </h1>

      <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
        <span>
          por{" "}
          <Link
            href={`/estudiantes/${servicio.estudianteId}`}
            className="font-semibold text-slate-900 transition hover:text-indigo-700 hover:underline"
          >
            {servicio.estudianteNombre}
          </Link>
        </span>
        <span className="text-slate-300">•</span>
        <RatingBadge value={servicio.estudianteCalificacion} />
        <span className="text-slate-300">•</span>
        <span>Publicado el {formatFecha(servicio.fechaPublicacion)}</span>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Sobre este servicio
        </h2>
        <p className="mt-2 whitespace-pre-line text-slate-600">
          {servicio.descripcion?.trim() ||
            "El estudiante no agregó una descripción."}
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Detalles</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 p-5">
          {esProyectoCerrado(servicio) && (
            <>
              <Dato label="Categoría" valor={servicio.detalle.catalogoServicioNombre} />
              <Dato
                label="Plazo de entrega"
                valor={`${servicio.detalle.plazoEntregaDias} día${servicio.detalle.plazoEntregaDias !== 1 ? "s" : ""}`}
              />
              <Dato
                label="Revisiones incluidas"
                valor={String(servicio.detalle.revisionesIncluidas)}
              />
              <Dato
                label="Formato de entrega"
                valor={
                  FORMATO_ENTREGA[servicio.detalle.formatoEntrega] ??
                  servicio.detalle.formatoEntrega
                }
              />
            </>
          )}

          {esClase(servicio) && (
            <>
              <Dato label="Materia" valor={servicio.detalle.materia} />
              <Dato label="Nivel" valor={servicio.detalle.nivel} />
              <Dato label="Modalidad" valor={servicio.detalle.modalidad} />
              <Dato
                label="Duración por sesión"
                valor={`${servicio.detalle.duracionMinutosSesion} min`}
              />
              <Dato
                label="Modalidad de contratación"
                valor={
                  servicio.detalle.esPaquete
                    ? `Paquete de ${servicio.detalle.cantidadSesionesPaquete} sesiones`
                    : "Sesión individual"
                }
              />
            </>
          )}

          {esSalud(servicio) && (
            <>
              <Dato label="Práctica" valor={servicio.detalle.catalogoServicioNombre} />
              <Dato
                label="Supervisor matriculado"
                valor={`${servicio.detalle.supervisorNombre} (Mat. ${servicio.detalle.supervisorMatricula})`}
              />
              <Dato label="Modalidad" valor={servicio.detalle.modalidad} />
              <Dato
                label="Duración por sesión"
                valor={`${servicio.detalle.duracionMinutosSesion} min`}
              />
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{valor}</dd>
    </div>
  );
}
