import Link from "next/link";
import { formatHoraAR, type PracticaPublica } from "@/lib/practicas";
import { clasesBoton } from "@/components/Boton";
import { CredencialCompacta, carreraCorta, institucionCorta } from "@/components/ds/Credencial";
import { SinCosto } from "@/components/ds/Precio";
import { ListaDatos } from "@/components/publico/Datos";

// Un turno del Banco de Turnos (componente "Turno" del sistema), para la lista agrupada
// por día. La hora es la pieza grande; "Sin costo" ocupa el lugar del precio (D6) y hay
// una sola acción, "Inscribirme", que lleva a la ficha del turno. Ningún dato del
// paciente en lo público. Sin hooks: se renderiza en el Server Component.

const OFFSET_AR_MS = 3 * 60 * 60 * 1000;

function mayuscula(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Clave del día en hora argentina ("2026-11-05"), para agrupar. */
export function claveDia(iso: string) {
  return new Date(new Date(iso).getTime() - OFFSET_AR_MS).toISOString().slice(0, 10);
}

/** "Jueves 5 de noviembre", en hora argentina. */
export function diaDeTurno(iso: string) {
  const d = new Date(new Date(iso).getTime() - OFFSET_AR_MS);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", ...o }).format(d);
  return mayuscula(`${f({ weekday: "long" })} ${f({ day: "numeric" })} de ${f({ month: "long" })}`);
}

/** "9:00", en hora argentina. */
export function horaDeTurno(iso: string) {
  return formatHoraAR(iso).replace(/^0(\d)/, "$1");
}

/** "Odontología, UNNE": la credencial corta del turno (la API no trae el año). */
export function credencialDeTurno(p: Pick<PracticaPublica, "carreraNombre" | "institucionNombre">) {
  return `${carreraCorta(p.carreraNombre)}, ${institucionCorta(p.institucionNombre)}`;
}

export function TurnoBanco({ practica: p }: { practica: PracticaPublica }) {
  const hora = horaDeTurno(p.fechaHoraInicio);
  return (
    <li className="relative grid grid-cols-[56px_minmax(0,1fr)] gap-x-3.5 gap-y-3 p-4 before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-line first:before:hidden lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:gap-x-5 lg:p-5">
      <p className="text-[20px] leading-[1.1] font-bold tracking-[-0.02em]">
        {hora}
        <span className="mt-1 block text-[14px] font-medium tracking-normal text-ink-2">{p.duracionMinutos} min</span>
      </p>

      <div className="grid min-w-0 content-start gap-2.5">
        <h3 className="text-title-3">{p.materiaNombre}</h3>
        <CredencialCompacta nombre={p.estudianteNombre} detalle={credencialDeTurno(p)} />
        <ListaDatos
          datos={[
            { icono: "pin", texto: p.lugar },
            {
              icono: p.tipoPacienteRequerido === "Animal" ? "paw" : "user",
              texto: (
                <>
                  Paciente: <b className="font-semibold">{p.tipoPacienteRequerido === "Animal" ? "Mascota" : "Persona"}</b>
                </>
              ),
            },
            ...(p.requisitosPrevios ? [{ icono: "info" as const, texto: <span className="line-clamp-2">{p.requisitosPrevios}</span> }] : []),
          ]}
        />
      </div>

      <div className="col-start-2 flex items-center justify-between gap-3 lg:col-start-3 lg:row-start-1 lg:grid lg:content-start lg:justify-items-end">
        <SinCosto />
        <Link
          href={`/practicas/${p.id}`}
          aria-label={`Inscribirme: ${p.materiaNombre}, ${diaDeTurno(p.fechaHoraInicio)}, ${hora}`}
          className={clasesBoton({ tamano: "sm" })}
        >
          Inscribirme
        </Link>
      </div>
    </li>
  );
}
