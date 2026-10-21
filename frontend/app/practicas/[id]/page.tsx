import Link from "next/link";
import { notFound } from "next/navigation";
import { formatFechaHoraAR, formatHoraAR, obtenerPractica } from "@/lib/practicas";
import { ApiError } from "@/lib/api";
import { EstadoPracticaBadge, SinCostoBadge, TipoPacienteBadge } from "@/components/practicas/Badges";
import { InscripcionPanel } from "./InscripcionPanel";

// Detalle de una práctica (Server Component). Los requisitos previos se muestran ANTES
// de cualquier acción: la persona tiene que poder leerlos sin registrarse.
//
// El fetch lleva la sesión si existe: las partes ven también una práctica Cubierta o
// Realizada; para cualquier otro, el backend responde 404 si ya no está abierta.

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PracticaPage({ params }: Props) {
  const { id } = await params;
  const practicaId = Number.parseInt(id, 10);
  if (Number.isNaN(practicaId)) notFound();

  let detalle;
  try {
    detalle = await obtenerPractica(practicaId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const p = detalle.practica;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link href="/practicas" className="text-sm text-slate-500 transition hover:text-indigo-700">
        ← Todas las prácticas
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <EstadoPracticaBadge estado={p.estado} />
            <TipoPacienteBadge tipo={p.tipoPacienteRequerido} />
            <SinCostoBadge />
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{p.materiaNombre}</h1>
          <p className="mt-1 text-slate-500">
            {p.carreraNombre} · {p.institucionNombre}
          </p>

          <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
            <Dato label="Fecha y hora">
              <span className="first-letter:uppercase">{formatFechaHoraAR(p.fechaHoraInicio)}</span>
              <span className="text-slate-500"> a {formatHoraAR(p.fechaHoraFin)} ({p.duracionMinutos} min)</span>
            </Dato>
            <Dato label="Lugar">{p.lugar}</Dato>
            <Dato label="Estudiante">
              <Link href={`/estudiantes/${p.estudianteId}`} className="font-medium text-indigo-700 hover:underline">
                {p.estudianteNombre}
              </Link>
            </Dato>
            <Dato label="Paciente que se necesita">{p.tipoPacienteRequerido}</Dato>
          </dl>

          <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
              Requisitos previos
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm text-amber-900">
              {p.requisitosPrevios ?? "La práctica no tiene requisitos previos especiales."}
            </p>
          </section>

          <section className="mt-6 text-sm text-slate-600">
            <h2 className="font-semibold text-slate-900">Cómo funciona</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Te inscribís con un paciente a tu cargo (vos mismo, un familiar o tu mascota).</li>
              <li>El día y la hora indicados se encuentran en el lugar de la práctica.</li>
              <li>La atención la hace el estudiante bajo supervisión docente de la cátedra.</li>
              <li>No se cobra nada, ni a vos ni al estudiante.</li>
            </ol>
          </section>
        </article>

        <aside className="lg:col-span-1">
          <InscripcionPanel detalle={detalle} />
        </aside>
      </div>
    </div>
  );
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{children}</dd>
    </div>
  );
}
