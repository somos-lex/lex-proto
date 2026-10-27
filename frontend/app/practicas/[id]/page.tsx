import Link from "next/link";
import { notFound } from "next/navigation";
import { formatHoraAR, obtenerPractica } from "@/lib/practicas";
import { ApiError } from "@/lib/api";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Carnet } from "@/components/ds/Credencial";
import { EstadoPracticaBadge, SinCostoBadge, TipoPacienteBadge } from "@/components/practicas/Badges";
import { diaDeTurno, horaDeTurno } from "@/components/practicas/PracticaCard";
import { ComoFuncionaBanco } from "@/components/practicas/InfoBanco";
import { ListaDatos } from "@/components/publico/Datos";
import { AsideInscripcion, HojaInscripcion } from "./InscripcionPanel";

// Ficha de un turno del Banco (Server Component). Los requisitos previos se muestran
// ANTES de cualquier acción: la persona tiene que poder leerlos sin registrarse.
//
// El fetch lleva la sesión si existe: las partes ven también un turno cubierto o
// realizado; para cualquier otro, el backend responde 404 si ya no está abierto.

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
  const nombre = p.estudianteNombre.trim().split(/\s+/)[0];
  const props = { detalle, nombre };

  return (
    <div>
      <div className="mx-auto max-w-lex px-4 md:px-6 lg:px-8">
        <nav aria-label="Estás en" className="mt-2 mb-2 flex items-center text-[15px] lg:mt-3 lg:mb-4">
          <ol className="flex min-w-0 items-center">
            <li className="flex items-center">
              <Link href="/practicas" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-ink-2 no-underline hover:text-ink">
                <Icono nombre="chev-r" className="size-4 rotate-180 lg:hidden" />
                Banco de Turnos
              </Link>
              <Icono nombre="chev-r" className="hidden size-4 text-ink-3 lg:block" />
            </li>
            <li aria-current="page" className="hidden min-w-0 truncate px-2 text-ink lg:block">
              {p.materiaNombre}
            </li>
          </ol>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_384px] lg:items-start lg:gap-12">
          <article className="min-w-0">
            <ul className="flex flex-wrap gap-2" aria-label="En breve">
              <li>
                <SinCostoBadge />
              </li>
              <li>
                <TipoPacienteBadge tipo={p.tipoPacienteRequerido} />
              </li>
              <li>
                <EstadoPracticaBadge estado={p.estado} />
              </li>
            </ul>
            <h1 className="mt-3.5 text-title-1-mobile text-balance lg:text-title-1">{p.materiaNombre}</h1>
            <p className="mt-1.5 text-[17px] text-ink-2">
              Turno para la práctica de la materia, de {p.carreraNombre}.
            </p>

            <section aria-labelledby="t-cuando" className="mt-8">
              <h2 id="t-cuando" className="mb-3 text-title-2-mobile lg:text-title-2">
                Cuándo y dónde
              </h2>
              <ListaDatos
                className="gap-2.5 text-base"
                datos={[
                  {
                    icono: "calendar",
                    texto: `${diaDeTurno(p.fechaHoraInicio)}, de ${horaDeTurno(p.fechaHoraInicio)} a ${formatHoraAR(p.fechaHoraFin).replace(/^0(\d)/, "$1")} (${p.duracionMinutos} min)`,
                  },
                  { icono: "pin", texto: p.lugar },
                  {
                    icono: p.tipoPacienteRequerido === "Animal" ? "paw" : "user",
                    texto: `El paciente es ${p.tipoPacienteRequerido === "Animal" ? "una mascota" : "una persona"}`,
                  },
                ]}
              />
            </section>

            <Aviso tono="info" titulo="Requisitos previos." className="mt-6">
              <span className="whitespace-pre-line">{p.requisitosPrevios ?? "Este turno no tiene requisitos especiales."}</span>
            </Aviso>

            <section aria-labelledby="t-quien" className="mt-9">
              <h2 id="t-quien" className="mb-3 text-title-2-mobile lg:text-title-2">
                Quién te atiende
              </h2>
              <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                <Carnet nombre={p.estudianteNombre} carrera={p.carreraNombre} institucion={p.institucionNombre} />
                <div className="grid content-start gap-1 rounded-card bg-surface-2 px-[22px] pt-5 pb-[22px]">
                  <div className="mb-3.5 flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-control bg-surface text-ink">
                      <Icono nombre="steth" className="size-6" />
                    </span>
                    <span className="text-[15px] font-semibold text-ink-2">Supervisa</span>
                  </div>
                  <p className="text-[19px] leading-[1.2] font-semibold text-ink">Un docente de la cátedra</p>
                  <p className="text-[15px] leading-[1.4] text-ink-2">
                    El turno es parte de la práctica de la materia y lo supervisa la cátedra.
                  </p>
                </div>
              </div>
              <Link href={`/estudiantes/${p.estudianteId}`} className="-ml-1 mt-2 inline-flex min-h-11 items-center gap-1 rounded-control px-1 font-semibold">
                Ver el perfil de {nombre}
                <Icono nombre="chev-r" className="size-[18px]" />
              </Link>
            </section>

            <div className="mt-9">
              <ComoFuncionaBanco />
            </div>
          </article>
          <AsideInscripcion {...props} />
        </div>
      </div>
      <HojaInscripcion {...props} />
    </div>
  );
}
