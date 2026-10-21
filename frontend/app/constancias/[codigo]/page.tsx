import Link from "next/link";
import { formatFechaAR, formatFechaHoraAR, verificarConstancia } from "@/lib/practicas";
import { ApiError } from "@/lib/api";

// Verificación pública de una constancia (Server Component), pensada para la cátedra.
// Muestra solo estudiante, materia, carrera, institución, fecha y asistencia: ningún dato
// del paciente, que es lo único que el backend tampoco expone por esta vía.

interface Props {
  params: Promise<{ codigo: string }>;
}

export default async function ConstanciaPublicaPage({ params }: Props) {
  const { codigo } = await params;
  const buscado = decodeURIComponent(codigo);

  let constancia;
  try {
    constancia = await verificarConstancia(buscado);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return <NoEncontrada codigo={buscado} />;
    throw err;
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">✓ Constancia auténtica emitida por LEX</p>
        <p className="mt-3 font-mono text-2xl font-bold tracking-wider text-slate-900">{constancia.codigo}</p>

        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
            constancia.asistenciaRegistrada ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
          }`}
        >
          {constancia.asistenciaRegistrada
            ? "Se registró la asistencia del paciente."
            : "Se registró que el paciente no se presentó."}
        </p>

        <dl className="mt-5 space-y-3 text-sm">
          <Dato label="Estudiante" valor={constancia.nombreEstudiante} />
          <Dato label="Materia" valor={constancia.nombreMateria} />
          <Dato label="Carrera" valor={`${constancia.nombreCarrera} · ${constancia.nombreInstitucion}`} />
          <Dato label="Fecha de la práctica" valor={formatFechaHoraAR(constancia.fechaPractica)} />
          <Dato label="Fecha de emisión" valor={formatFechaAR(constancia.fechaEmision)} />
        </dl>
      </div>
      <Link href="/constancias" className="mt-6 inline-block text-sm text-slate-500 hover:text-indigo-700">
        Verificar otro código
      </Link>
    </div>
  );
}

function NoEncontrada({ codigo }: { codigo: string }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6">
        <p className="font-semibold text-rose-800">No encontramos ninguna constancia con ese código.</p>
        <p className="mt-1 font-mono text-sm text-rose-700">{codigo}</p>
        <p className="mt-3 text-sm text-rose-700">Revisá que esté bien copiado (formato LEX-XXXX-XXXX).</p>
      </div>
      <Link href="/constancias" className="mt-6 inline-block text-sm text-slate-500 hover:text-indigo-700">
        Probar con otro código
      </Link>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-36 shrink-0 text-slate-400">{label}</dt>
      <dd className="text-slate-800 first-letter:uppercase">{valor}</dd>
    </div>
  );
}
