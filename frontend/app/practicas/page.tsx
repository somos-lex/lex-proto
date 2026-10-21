import Link from "next/link";
import {
  listarMaterias,
  listarPracticasDisponibles,
  type FiltrosDisponibles,
} from "@/lib/practicas";
import type { TipoPaciente } from "@/lib/pacientes";
import { PracticaCard } from "@/components/practicas/PracticaCard";

// Banco de Turnos — explorar prácticas abiertas (Server Component).
//
// Los filtros viajan en la URL y el formulario es un GET plano: funciona sin JavaScript
// y cada combinación de filtros es un link compartible.

interface Props {
  searchParams: Promise<{ carreraId?: string; tipoPaciente?: string; desde?: string; hasta?: string }>;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Un valor inválido en la URL se ignora en vez de reenviarlo al backend, que lo
// rechazaría con 400.
function parsearFiltros(p: Awaited<Props["searchParams"]>): FiltrosDisponibles {
  const carreraId = Number.parseInt(p.carreraId ?? "", 10);
  return {
    carreraId: Number.isFinite(carreraId) && carreraId > 0 ? carreraId : undefined,
    tipoPaciente:
      p.tipoPaciente === "Humano" || p.tipoPaciente === "Animal"
        ? (p.tipoPaciente as TipoPaciente)
        : undefined,
    desde: p.desde && FECHA.test(p.desde) ? p.desde : undefined,
    hasta: p.hasta && FECHA.test(p.hasta) ? p.hasta : undefined,
  };
}

export default async function PracticasPage({ searchParams }: Props) {
  const filtros = parsearFiltros(await searchParams);

  const [practicas, materias] = await Promise.all([
    listarPracticasDisponibles(filtros),
    listarMaterias(),
  ]);

  // Solo se ofrecen las carreras que tienen materias con práctica clínica.
  const carreras = Array.from(
    new Map(materias.map((m) => [m.carreraId, `${m.carreraNombre} (${m.institucionNombre})`])),
  ).sort((a, b) => a[1].localeCompare(b[1], "es"));

  const hayFiltros = Object.values(filtros).some((v) => v !== undefined);

  return (
    <div className="min-h-screen">
      <section className="border-b border-slate-100 bg-gradient-to-b from-emerald-50/60 to-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Banco de Turnos
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Prácticas clínicas sin costo con estudiantes de la UNNE
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Estudiantes de Odontología, Medicina Veterinaria y Kinesiología necesitan pacientes para
            sus prácticas obligatorias. La atención se hace en la cátedra, bajo supervisión
            docente, y no se cobra nada.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <form method="get" className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Carrera</span>
            <select
              name="carreraId"
              defaultValue={filtros.carreraId ?? ""}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {carreras.map(([id, nombre]) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Paciente</span>
            <select
              name="tipoPaciente"
              defaultValue={filtros.tipoPaciente ?? ""}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Humano o animal</option>
              <option value="Humano">Humano</option>
              <option value="Animal">Animal</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Desde</span>
            <input
              type="date"
              name="desde"
              defaultValue={filtros.desde}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Hasta</span>
            <input
              type="date"
              name="hasta"
              defaultValue={filtros.hasta}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Filtrar
            </button>
            {hayFiltros && (
              <Link
                href="/practicas"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        {practicas.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 py-16 text-center">
            <p className="text-slate-600">No hay prácticas abiertas que coincidan con los filtros.</p>
            <p className="mt-1 text-sm text-slate-500">
              Probá con otra carrera o un rango de fechas más amplio.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {practicas.length} práctica{practicas.length === 1 ? "" : "s"} buscando paciente
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {practicas.map((p) => (
                <PracticaCard key={p.id} practica={p} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
