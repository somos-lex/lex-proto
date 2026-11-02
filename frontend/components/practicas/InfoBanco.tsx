// "Cómo funciona" el Banco de Turnos y su diferencia con un servicio de Salud, que
// se paga. Los usan el Banco y la ficha de un turno.

import { Tesela } from "@/components/ds/Lista";
import { Pasos } from "@/components/publico/Datos";

export const PASOS_BANCO = [
  { titulo: "Elegís un turno", descripcion: "Ves la fecha, el lugar, el tipo de paciente y los requisitos." },
  { titulo: "Te inscribís con tu paciente", descripcion: "Vos, un familiar o tu mascota. Aceptás los requisitos antes de confirmar." },
  { titulo: "Vas a la cátedra el día del turno", descripcion: "Te atiende el estudiante, con un docente que supervisa." },
  {
    titulo: "Queda una constancia",
    descripcion: "El estudiante registra la asistencia y la constancia lleva un código que cualquiera puede verificar.",
  },
];

export function ComoFuncionaBanco({ nivel = "h2" }: { nivel?: "h2" | "h3" }) {
  const H = nivel;
  return (
    <section aria-labelledby="t-como-funciona">
      <H id="t-como-funciona" className="mb-2 text-title-2-mobile lg:text-title-2">
        Cómo funciona
      </H>
      <Pasos pasos={PASOS_BANCO} />
    </section>
  );
}

const FILAS: { rotulo: string; banco: string; salud: string }[] = [
  { rotulo: "Costo", banco: "Sin costo", salud: "Se paga, con pago protegido" },
  { rotulo: "Qué es", banco: "Un turno para la práctica de una materia", salud: "Un servicio que el estudiante ofrece en su agenda" },
  { rotulo: "Supervisa", banco: "Un docente de la cátedra", salud: "Un profesional con matrícula" },
  { rotulo: "Dónde", banco: "En la cátedra o la clínica de la facultad", salud: "En consultorio o a domicilio, según el servicio" },
];

export function ComparacionBanco() {
  return (
    <section aria-labelledby="t-comparacion">
      <h2 id="t-comparacion" className="mb-3 text-title-2-mobile lg:text-title-2">
        ¿Banco de Turnos o un servicio de Salud?
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Columna titulo="Banco de Turnos" icono="calendar" acento clave="banco" />
        <Columna titulo="Servicio de Salud" icono="steth" clave="salud" />
      </div>
    </section>
  );
}

function Columna({ titulo, icono, acento = false, clave }: { titulo: string; icono: "calendar" | "steth"; acento?: boolean; clave: "banco" | "salud" }) {
  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <Tesela icono={icono} tono={acento ? "acento" : "neutro"} />
        <h3 className="text-title-3">{titulo}</h3>
      </div>
      <dl>
        {FILAS.map((f) => (
          <div key={f.rotulo} className="relative px-4 py-3 before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-line">
            <dt className="text-[14px] text-ink-2">{f.rotulo}</dt>
            <dd className="text-[15px] font-[550] text-ink">{f[clave]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
