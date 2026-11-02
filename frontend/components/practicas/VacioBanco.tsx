"use client";

// El vacío real del Banco de Turnos (D6 y "una acción por rol"): no es un "no hay
// resultados", es que todavía nadie publicó un turno. Explica qué va a aparecer y da
// una acción a cada lado: quien se quiere atender y quien estudia una carrera de salud.
// La acción llena es la del rol de quien mira.

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { clasesBoton } from "@/components/Boton";
import { Tesela } from "@/components/ds/Lista";

export function VacioBanco() {
  const { isAuthenticated, roles, identidad } = useAuth();
  const esEstudiante = !!identidad?.esEstudiante || roles.includes("Estudiante");
  const esCliente = roles.includes("Cliente");

  const atenderme = !isAuthenticated
    ? { href: "/registro?volver=%2Fpracticas", texto: "Crear cuenta", detalle: "Creá tu cuenta y cargá a tu paciente: vos, un familiar o tu mascota. Así te podés inscribir apenas aparezca un turno." }
    : esCliente
      ? { href: "/panel/pacientes", texto: "Cargar persona o mascota", detalle: "Dejá cargado a tu paciente: vos, un familiar o tu mascota. Así te podés inscribir apenas aparezca un turno." }
      : null;

  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      <div className="grid justify-items-start gap-3 px-5 pt-6 pb-5">
        <Tesela icono="calendar" tono="acento" />
        <h2 className="text-title-2-mobile lg:text-title-2">Todavía no hay turnos publicados</h2>
        <p className="max-w-[56ch] text-[15px] leading-[1.45] text-ink-2">
          Cuando un estudiante publique un turno, lo vas a ver acá con la fecha, el lugar y los requisitos.
        </p>
      </div>
      <ul>
        {atenderme && (
          <Fila
            icono="user"
            titulo="Quiero atenderme"
            detalle={atenderme.detalle}
            accion={
              <Link href={atenderme.href} className={clasesBoton({ variante: esEstudiante ? "secundario" : "primario", tamano: "sm" })}>
                {atenderme.texto}
              </Link>
            }
          />
        )}
        <Fila
          icono="cap"
          titulo="Soy estudiante de una carrera de salud"
          detalle="Publicá un turno para la práctica de tu materia. Necesitás la carrera verificada por LEX."
          accion={
            <Link href="/panel/practicas" className={clasesBoton({ variante: esEstudiante ? "primario" : "secundario", tamano: "sm" })}>
              Publicar un turno
            </Link>
          }
        />
      </ul>
    </div>
  );
}

function Fila({ icono, titulo, detalle, accion }: { icono: "user" | "cap"; titulo: string; detalle: string; accion: React.ReactNode }) {
  return (
    <li className="relative flex flex-wrap items-center gap-x-3.5 gap-y-3 px-5 py-4 before:absolute before:top-0 before:right-0 before:left-5 before:h-px before:bg-line">
      <Tesela icono={icono} />
      <div className="min-w-[200px] flex-1">
        <p className="text-base leading-[1.35] font-semibold">{titulo}</p>
        <p className="text-[15px] leading-[1.4] text-ink-2">{detalle}</p>
      </div>
      <div className="w-full pl-[58px] sm:w-auto sm:pl-0">{accion}</div>
    </li>
  );
}
