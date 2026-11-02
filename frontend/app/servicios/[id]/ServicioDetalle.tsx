import Link from "next/link";
import {
  esClase,
  esProyectoCerrado,
  esSalud,
  type NivelClase,
  type ServicioDetalleResponse,
} from "@/lib/servicios";
import { Portada } from "@/components/ds/Portada";
import { Carnet, Supervisor } from "@/components/ds/Credencial";
import { Chip } from "@/components/ds/Chip";
import { Aviso } from "@/components/ds/Aviso";
import { Icono } from "@/components/Icono";
import { RatingBadge } from "@/components/Stars";
import { Definiciones, Pasos, type Dato } from "@/components/publico/Datos";
import { VERTICALES, plazoTexto, temaDe } from "@/components/publico/presentacion";

// Ficha de un servicio: lo que se lee para decidir. El precio y la acción viven en el
// aside (escritorio) o en la hoja (mobile), así el precio va una sola vez por pantalla.

const ICONO_VERTICAL = { ProyectoCerrado: "briefcase", Clase: "cap", Salud: "steth" } as const;

const NIVEL: Record<NivelClase, string> = {
  Primario: "Primario",
  Secundario: "Secundario",
  Universitario: "Universitario",
  Adulto: "Adultos",
  Idioma: "Idioma",
  Otro: "Otro",
};

export default function ServicioDetalle({
  servicio,
  datos,
  nombre,
  agenda,
}: {
  servicio: ServicioDetalleResponse;
  datos: Dato[];
  /** Nombre de pila del estudiante. */
  nombre: string;
  agenda: string | null;
}) {
  const vertical = VERTICALES.find((v) => v.tipo === servicio.tipo)!;
  const cred = servicio.credencial;
  const supervisor = esSalud(servicio) ? servicio.detalle : null;

  return (
    <article className="min-w-0">
      <Portada tipo={servicio.tipo} tema={temaDe(servicio)} ficha />

      <div className="mt-5 grid gap-3.5">
        <h1 className="text-title-1-mobile text-balance lg:text-title-1">{servicio.titulo}</h1>
        <ul className="flex flex-wrap gap-2" aria-label="En breve">
          <li>
            <Chip icono={ICONO_VERTICAL[servicio.tipo]}>{vertical.nombre}</Chip>
          </li>
          {datos
            .filter((d) => d.chip)
            .map((d, i) => (
              <li key={i}>
                <Chip icono={d.icono}>{d.texto}</Chip>
              </li>
            ))}
        </ul>
      </div>

      <section aria-labelledby="t-quien" className="mt-9">
        <h2 id="t-quien" className="mb-3 text-title-2-mobile lg:text-title-2">
          Quién te atiende
        </h2>
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {cred ? (
            <Carnet
              nombre={servicio.estudianteNombre}
              carrera={cred.carrera}
              anio={cred.anioCursado}
              institucion={cred.institucion}
            />
          ) : (
            // Sin carrera verificada hoy (por ejemplo, se venció la constancia): sin sello ni carnet.
            <div className="grid content-start gap-1 rounded-card bg-surface-2 px-[22px] pt-5 pb-[22px]">
              <p className="text-[15px] font-semibold text-ink-2">Atiende</p>
              <p className="text-[19px] leading-[1.2] font-semibold text-ink">{servicio.estudianteNombre}</p>
              <p className="text-[15px] text-ink-2">Su carrera no está verificada en este momento.</p>
            </div>
          )}
          {supervisor && (
            <Supervisor
              nombre={supervisor.supervisorNombre}
              matricula={supervisor.supervisorMatricula}
              nota="Profesional con matrícula que supervisa este servicio."
            />
          )}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3">
          <Link
            href={`/estudiantes/${servicio.estudianteId}`}
            className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-control px-1 font-semibold"
          >
            Ver el perfil de {nombre}
            <Icono nombre="chev-r" className="size-[18px]" />
          </Link>
          <RatingBadge value={servicio.estudianteCalificacion} />
        </p>
      </section>

      <section aria-labelledby="t-sobre" className="mt-9">
        <h2 id="t-sobre" className="mb-2 text-title-2-mobile lg:text-title-2">
          Sobre el servicio
        </h2>
        <p className="max-w-[62ch] whitespace-pre-line">
          {servicio.descripcion?.trim() || `${nombre} todavía no agregó una descripción.`}
        </p>
        <div className="mt-4 max-w-xl">
          <Definiciones filas={definicionesDe(servicio)} />
        </div>
      </section>

      <section aria-labelledby="t-como" className="mt-9">
        <h2 id="t-como" className="mb-2 text-title-2-mobile lg:text-title-2">
          Cómo es contratar
        </h2>
        <Pasos pasos={pasosDe(servicio, nombre, agenda)} />
      </section>

      {esSalud(servicio) && (
        <Aviso
          tono="info"
          titulo="¿Buscás atención sin costo?"
          className="mt-7"
          acciones={
            <Link href="/practicas" className="-my-2.5 inline-flex min-h-11 items-center">
              Ver el Banco de Turnos
            </Link>
          }
        >
          En el Banco de Turnos te atienden estudiantes en la cátedra, para las prácticas de sus materias, con
          supervisión docente. Este servicio, en cambio, se paga y lo supervisa un profesional con matrícula.
        </Aviso>
      )}
    </article>
  );
}

function definicionesDe(s: ServicioDetalleResponse) {
  if (esProyectoCerrado(s)) return [{ rotulo: "Categoría", valor: temaDe(s) }];
  if (esClase(s))
    return [
      { rotulo: "Materia", valor: s.detalle.materia },
      { rotulo: "Nivel", valor: NIVEL[s.detalle.nivel] ?? s.detalle.nivel },
    ];
  if (esSalud(s)) return [{ rotulo: "Práctica", valor: temaDe(s) }];
  return [];
}

// Los pasos reales de cada vertical (README_ESTADOS_TRABAJO): el estudiante acepta, el
// pago queda guardado y se libera con la entrega aprobada (Proyecto cerrado) o sesión
// por sesión (Clases y Salud).
function pasosDe(s: ServicioDetalleResponse, nombre: string, agenda: string | null) {
  const acepta = { titulo: `${nombre} acepta el trabajo`, descripcion: "Si no lo acepta, te devolvemos el pago." };
  if (esProyectoCerrado(s))
    return [
      { titulo: "Contratás y pagás", descripcion: "LEX guarda el pago mientras tanto." },
      acepta,
      { titulo: `${nombre} hace el trabajo y te lo entrega`, descripcion: `${plazoTexto(s.detalle.plazoEntregaDias)}.` },
      { titulo: "Revisás la entrega y la aprobás", descripcion: `Cuando la aprobás, LEX le pasa el pago a ${nombre}.` },
    ];
  if (esClase(s)) {
    const n = s.detalle.esPaquete ? s.detalle.cantidadSesionesPaquete : null;
    return [
      {
        titulo: n ? `Elegís los ${n} horarios del paquete y pagás` : "Elegís el horario y pagás",
        descripcion: `${agenda ? `${nombre} da clases ${agenda}. ` : ""}LEX guarda el pago mientras tanto.`,
      },
      acepta,
      n
        ? { titulo: "Se dan las clases", descripcion: "Cada clase que se marca como realizada libera su parte del pago." }
        : { titulo: "Se da la clase", descripcion: `Cuando se marca como realizada, LEX le pasa el pago a ${nombre}.` },
    ];
  }
  if (esSalud(s))
    return [
      {
        titulo: "Elegís el horario y cargás al paciente",
        descripcion: `${agenda ? `${nombre} atiende ${agenda}. ` : ""}Según el servicio, el paciente es una persona o una mascota.`,
      },
      { titulo: "Firmás el consentimiento y pagás", descripcion: "LEX guarda el pago mientras tanto." },
      acepta,
      {
        titulo: `Se hace la sesión, con la supervisión de ${s.detalle.supervisorNombre}`,
        descripcion: `Cuando se marca como realizada, LEX le pasa el pago a ${nombre}.`,
      },
    ];
  return [];
}
