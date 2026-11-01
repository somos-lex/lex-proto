import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  listarMaterias,
  listarPracticasDisponibles,
  type FiltrosDisponibles,
  type PracticaPublica,
} from "@/lib/practicas";
import type { TipoPaciente } from "@/lib/pacientes";
import { Chip } from "@/components/ds/Chip";
import { Aviso } from "@/components/ds/Aviso";
import { Vacio, Esqueleto } from "@/components/ds/Estados";
import { clasesBoton } from "@/components/Boton";
import { TurnoBanco, claveDia, diaDeTurno } from "@/components/practicas/PracticaCard";
import { FiltrosBanco } from "@/components/practicas/FiltrosBanco";
import { VacioBanco } from "@/components/practicas/VacioBanco";
import { ComoFuncionaBanco, ComparacionBanco } from "@/components/practicas/InfoBanco";

// Banco de Turnos: atención sin costo (Server Component).
//
// Los filtros viajan en la URL y el formulario es un GET plano: funciona sin JavaScript
// y cada combinación de filtros es un link compartible. Sin turnos y sin filtros, no se
// muestran filtros: no hay qué filtrar, y el vacío orienta con una acción por rol.

type Params = { carreraId?: string; tipoPaciente?: string; desde?: string; hasta?: string };

interface Props {
  searchParams: Promise<Params>;
}

export const metadata: Metadata = {
  title: "Banco de Turnos — LEX",
  description:
    "Turnos sin costo para prácticas clínicas supervisadas de Odontología, Medicina Veterinaria y Kinesiología en el NEA.",
  openGraph: {
    title: "Banco de Turnos — LEX",
    description: "Turnos sin costo para prácticas clínicas supervisadas en el NEA.",
    siteName: "LEX",
    locale: "es_AR",
    type: "website",
  },
};

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Un valor inválido en la URL se ignora en vez de reenviarlo al backend, que lo
// rechazaría con 400.
function parsearFiltros(p: Params): FiltrosDisponibles {
  const carreraId = Number.parseInt(p.carreraId ?? "", 10);
  return {
    carreraId: Number.isFinite(carreraId) && carreraId > 0 ? carreraId : undefined,
    tipoPaciente: p.tipoPaciente === "Humano" || p.tipoPaciente === "Animal" ? (p.tipoPaciente as TipoPaciente) : undefined,
    desde: p.desde && FECHA.test(p.desde) ? p.desde : undefined,
    hasta: p.hasta && FECHA.test(p.hasta) ? p.hasta : undefined,
  };
}

export default async function PracticasPage({ searchParams }: Props) {
  const params = await searchParams;
  const filtros = parsearFiltros(params);

  return (
    <div className="mx-auto max-w-lex px-4 md:px-6 lg:px-8">
      <section aria-labelledby="t-banco" className="pt-5 lg:pt-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 id="t-banco" className="text-title-1-mobile lg:text-title-1">
            Banco de Turnos
          </h1>
          <Chip tono="acento" icono="tag">
            Atención sin costo
          </Chip>
        </div>
        <p className="mt-2.5 max-w-[62ch] text-[17px] leading-[1.5] text-ink-2 lg:text-lead">
          Estudiantes de Odontología, Medicina Veterinaria y Kinesiología publican turnos para las prácticas de sus
          materias. Te inscribís sin costo, con vos, un familiar o tu mascota como paciente, y te atienden en la cátedra
          con supervisión docente.
        </p>
      </section>

      <section aria-label="Turnos disponibles" className="mt-6">
        <Suspense key={JSON.stringify(filtros)} fallback={<EsqueletoBanco />}>
          <Turnos filtros={filtros} />
        </Suspense>
      </section>

      <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-12">
        <ComoFuncionaBanco />
        <ComparacionBanco />
      </div>
    </div>
  );
}

async function Turnos({ filtros }: { filtros: FiltrosDisponibles }) {
  let practicas: PracticaPublica[];
  let materias;
  try {
    [practicas, materias] = await Promise.all([listarPracticasDisponibles(filtros), listarMaterias()]);
  } catch {
    return (
      <Aviso
        tono="danger"
        titulo="No pudimos cargar los turnos."
        acciones={
          <Link href="/practicas" className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
            Reintentar
          </Link>
        }
      >
        Puede ser un problema de conexión. Probá de nuevo en un momento.
      </Aviso>
    );
  }

  const hayFiltros = Object.values(filtros).some((v) => v !== undefined);

  // Vacío real: nadie publicó un turno. Sin filtros, porque no hay qué filtrar.
  if (practicas.length === 0 && !hayFiltros) return <VacioBanco />;

  // Solo las carreras que tienen materias con práctica clínica.
  const carreras = Array.from(new Map(materias.map((m) => [m.carreraId, m.carreraNombre]))).sort((a, b) =>
    a[1].localeCompare(b[1], "es"),
  );
  const resumen =
    practicas.length === 0 ? "Ningún turno con estos filtros" : `${practicas.length} ${practicas.length === 1 ? "turno disponible" : "turnos disponibles"}`;

  // Agrupados por día, como los movimientos de una app de pagos.
  const porDia = new Map<string, PracticaPublica[]>();
  for (const p of [...practicas].sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio))) {
    const clave = claveDia(p.fechaHoraInicio);
    porDia.set(clave, [...(porDia.get(clave) ?? []), p]);
  }

  return (
    <>
      <FiltrosBanco filtros={filtros} carreras={carreras} resumen={resumen} />
      {practicas.length === 0 ? (
        <Vacio
          icono="filter"
          titulo="No hay turnos con esos filtros"
          className="mt-4"
          acciones={
            <Link href="/practicas" className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
              Limpiar filtros
            </Link>
          }
        >
          Probá con otra carrera o con un rango de fechas más amplio.
        </Vacio>
      ) : (
        <div className="mt-4">
          {[...porDia].map(([clave, turnos]) => (
            <section key={clave} aria-labelledby={`dia-${clave}`}>
              <h2 id={`dia-${clave}`} className="px-1 pt-5 pb-2 text-[15px] font-[650] text-ink-2">
                {diaDeTurno(turnos[0].fechaHoraInicio)}
              </h2>
              <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
                {turnos.map((p) => (
                  <TurnoBanco key={p.id} practica={p} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

// El alto se mide contra el vacío real del Banco (sin turnos publicados): acá
// no hay catálogo poblado contra el que medir, así que esta es la forma más
// común de la sección en la base real y la que evita que el pie se corra.
function EsqueletoBanco() {
  return (
    <div aria-busy="true" aria-label="Cargando turnos" className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      <div className="grid justify-items-start gap-3 px-5 pt-6 pb-5">
        <Esqueleto className="size-11 rounded-control" />
        <Esqueleto className="h-5 w-56 max-w-full" />
        <Esqueleto className="h-4 w-full max-w-md" />
        <Esqueleto className="h-4 w-4/5 max-w-md" />
      </div>
      <div className="grid gap-px border-t border-line">
        <Esqueleto className="h-[173px] rounded-none" />
        <Esqueleto className="h-[194px] rounded-none" />
      </div>
    </div>
  );
}
