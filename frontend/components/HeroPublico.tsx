import Link from "next/link";
import { Icono } from "@/components/Icono";
import { Fila, Grupo } from "@/components/ds/Lista";
import { urlCatalogo } from "@/components/FiltrosVertical";
import { VERTICALES } from "@/components/publico/presentacion";
import { CLASES_TESELA, ContenidoTesela } from "@/components/publico/TeselaAccion";
import { TeselaEstudiante } from "@/components/publico/TeselaEstudiante";
import type { TipoServicio } from "@/lib/servicios";

// Cabecera de la home como hub (D3): el titular, los tres caminos y las dos
// garantías. En mobile las teselas van antes que las garantías, para que la acción
// principal entre en la primera pantalla; desde 1024, el titular a la izquierda, las
// garantías a la derecha y las teselas a todo el ancho.

const ICONO_VERTICAL: Record<TipoServicio, "briefcase" | "cap" | "steth"> = {
  ProyectoCerrado: "briefcase",
  Clase: "cap",
  Salud: "steth",
};

// Los colores de vertical solo viven en los accesos y en las portadas.
const TINTE_VERTICAL: Record<TipoServicio, string> = {
  ProyectoCerrado: "bg-v-proyecto-soft text-v-proyecto",
  Clase: "bg-v-clases-soft text-v-clases",
  Salud: "bg-v-salud-soft text-v-salud",
};

export default function HeroPublico() {
  return (
    <section
      aria-labelledby="titulo-home"
      className="mx-auto grid max-w-lex gap-7 px-4 pt-5 [grid-template-areas:'txt'_'hub'_'gar'] md:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-x-16 lg:gap-y-11 lg:px-8 lg:pt-13 lg:[grid-template-areas:'txt_gar'_'hub_hub']"
    >
      <div className="grid gap-3.5 [grid-area:txt]">
        <h1 id="titulo-home" className="text-display-mobile text-balance lg:text-display">
          Estudiantes universitarios del NEA, con la carrera verificada.
        </h1>
        <p className="max-w-[62ch] text-[17px] leading-[1.5] text-ink-2 lg:text-lead">
          Contratá proyectos, clases o atención de salud supervisada, con pago protegido. O atendete sin costo en
          el Banco de Turnos.
        </p>
      </div>

      <div className="[grid-area:hub]">
        <h2 className="mx-1 mb-2 text-[15px] font-semibold text-ink-2">
          ¿Qué venís a hacer?
        </h2>
        <ul className="grid gap-2.5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-4">
          <li>
            <TeselaContratar />
          </li>
          <li>
            <Link href="/practicas" className={CLASES_TESELA}>
              <ContenidoTesela
                icono="calendar"
                tono="acento"
                titulo="Atenderme sin costo"
                descripcion="Banco de Turnos: te atienden en la cátedra, con supervisión docente"
              />
            </Link>
          </li>
          <li>
            <TeselaEstudiante />
          </li>
        </ul>
      </div>

      <Grupo className="[grid-area:gar]">
        <Fila
          icono="id"
          tonoTesela="ok"
          titulo="Carrera verificada por LEX"
          descripcion="Antes de publicar, cada estudiante carga su constancia de alumno regular y un admin de LEX la revisa."
        />
        <Fila
          icono="shield"
          titulo="Pago protegido"
          descripcion="LEX guarda tu pago y se lo pasa al estudiante a medida que cumple. Si no acepta el trabajo, te lo devolvemos."
        />
      </Grupo>
    </section>
  );
}

// La única tesela principal (acento): el link cubre la tesela con su ::after y el
// foco se dibuja afuera, sobre el fondo. Los accesos a las verticales quedan por encima.
function TeselaContratar() {
  return (
    <div className="relative flex h-full min-h-19 flex-col justify-center gap-2.5 rounded-card bg-accent py-3 pr-3.5 pl-3 text-on-accent has-[a.tesela-principal:focus-visible]:outline-2 has-[a.tesela-principal:focus-visible]:outline-offset-2 has-[a.tesela-principal:focus-visible]:outline-focus has-[a.tesela-principal:hover]:bg-accent-hover lg:min-h-26 lg:p-5">
      <Link
        href="#servicios"
        className="tesela-principal flex items-center gap-3.5 text-on-accent no-underline after:absolute after:inset-0 after:rounded-card focus-visible:outline-none"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-control bg-surface text-ink">
          <Icono nombre="compass" className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-title-3">Contratar un servicio</span>
          <span className="block text-[15px] leading-[1.4]">Proyectos, clases y salud supervisada</span>
        </span>
        <Icono nombre="chev-r" className="size-5.5" />
      </Link>
      <div className="relative z-10 flex flex-wrap gap-2">
        {VERTICALES.map((v) => (
          <Link
            key={v.tipo}
            href={urlCatalogo(v.tipo)}
            className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-surface pr-3.5 pl-1.5 text-[15px] font-semibold text-ink no-underline hover:bg-surface-2 focus-visible:outline-on-accent"
          >
            <span className={`grid size-8 place-items-center rounded-pill ${TINTE_VERTICAL[v.tipo]}`}>
              <Icono nombre={ICONO_VERTICAL[v.tipo]} className="size-[18px]" />
            </span>
            {v.acceso}
          </Link>
        ))}
      </div>
    </div>
  );
}

