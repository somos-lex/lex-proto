import Link from "next/link";
import { formatFechaHoraAR, type PracticaPublica } from "@/lib/practicas";
import { SinCostoBadge, TipoPacienteBadge } from "./Badges";

// Tarjeta del listado público. Sin hooks: se renderiza en el Server Component.
export function PracticaCard({ practica }: { practica: PracticaPublica }) {
  return (
    <Link
      href={`/practicas/${practica.id}`}
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex flex-wrap gap-2">
        <TipoPacienteBadge tipo={practica.tipoPacienteRequerido} />
        <SinCostoBadge />
      </div>

      <h3 className="mt-3 text-lg font-semibold text-slate-900 group-hover:text-indigo-700">
        {practica.materiaNombre}
      </h3>
      <p className="text-sm text-slate-500">
        {practica.carreraNombre} · {practica.institucionNombre}
      </p>

      <dl className="mt-4 space-y-1.5 text-sm text-slate-700">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-slate-400">Cuándo</dt>
          <dd className="first-letter:uppercase">
            {formatFechaHoraAR(practica.fechaHoraInicio)} · {practica.duracionMinutos} min
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-slate-400">Dónde</dt>
          <dd>{practica.lugar}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-slate-400">Quién</dt>
          <dd>{practica.estudianteNombre}</dd>
        </div>
      </dl>

      {practica.requisitosPrevios && (
        <p className="mt-4 line-clamp-2 rounded-lg bg-amber-50/70 px-3 py-2 text-xs text-amber-800">
          Requisitos: {practica.requisitosPrevios}
        </p>
      )}
    </Link>
  );
}
