// La agenda semanal del estudiante en una frase: "los sábados de 9 a 12" o "los martes
// y jueves de 19 a 22". Sale de los bloques públicos de disponibilidad.

import type { BloqueDisponibilidadResponse, DiaSemana } from "@/lib/disponibilidad";

const ORDEN: DiaSemana[] = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const PLURAL: Record<DiaSemana, string> = {
  Lunes: "lunes",
  Martes: "martes",
  Miercoles: "miércoles",
  Jueves: "jueves",
  Viernes: "viernes",
  Sabado: "sábados",
  Domingo: "domingos",
};

/** "09:00:00" → "9"; "09:30:00" → "9:30". */
function hora(h: string) {
  const [hh, mm] = h.split(":");
  return mm === "00" ? String(Number(hh)) : `${Number(hh)}:${mm}`;
}

function enumerar(partes: string[]) {
  return partes.length < 2 ? partes.join("") : `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

/** null si no cargó horarios. */
export function textoAgenda(bloques: BloqueDisponibilidadResponse[]): string | null {
  if (bloques.length === 0) return null;
  // Días con el mismo horario van juntos: "los martes y jueves de 19 a 22".
  const porRango = new Map<string, DiaSemana[]>();
  for (const b of [...bloques].sort((a, c) => ORDEN.indexOf(a.diaSemana) - ORDEN.indexOf(c.diaSemana) || a.horaInicio.localeCompare(c.horaInicio))) {
    const rango = `de ${hora(b.horaInicio)} a ${hora(b.horaFin)}`;
    const dias = porRango.get(rango) ?? [];
    if (!dias.includes(b.diaSemana)) dias.push(b.diaSemana);
    porRango.set(rango, dias);
  }
  return enumerar([...porRango].map(([rango, dias]) => `los ${enumerar(dias.map((d) => PLURAL[d]))} ${rango}`));
}
