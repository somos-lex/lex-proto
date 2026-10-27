// Textos cortos de "Lo tuyo en LEX": qué tenés publicado, cuándo atendés y qué
// turnos del Banco tenés. Solo con datos que trae la API.

import { DIAS_SEMANA, type BloqueDisponibilidadResponse, type DiaSemana } from "@/lib/disponibilidad";
import type { PracticaDetalle } from "@/lib/practicas";
import { tipoEtiqueta, type ServicioResponse } from "@/lib/servicios";

/** "Martes y jueves" */
export function enumerar(xs: string[]) {
  return xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}

function capitalizar(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "09:00:00" → "9"; "09:30:00" → "9:30". */
function hora(h: string) {
  const [hh, mm] = h.split(":");
  return mm === "00" ? String(Number(hh)) : `${Number(hh)}:${mm}`;
}

const ORDEN = new Map(DIAS_SEMANA.map((d, i) => [d.valor, i]));
const NOMBRE = new Map(DIAS_SEMANA.map((d) => [d.valor, d.etiqueta.toLowerCase()]));

/** "Martes y jueves de 9 a 13". Con muchos horarios distintos, la cuenta. */
export function resumenAgenda(bloques: BloqueDisponibilidadResponse[]): string | null {
  if (bloques.length === 0) return null;
  const grupos = new Map<string, DiaSemana[]>();
  for (const b of bloques) {
    const k = `${b.horaInicio}|${b.horaFin}`;
    grupos.set(k, [...(grupos.get(k) ?? []), b.diaSemana]);
  }
  if (grupos.size > 2) {
    const dias = new Set(bloques.map((b) => b.diaSemana)).size;
    return `${bloques.length} horarios en ${dias === 1 ? "1 día" : `${dias} días`} de la semana`;
  }
  const partes = [...grupos].map(([k, dias]) => {
    const [ini, fin] = k.split("|");
    const nombres = [...new Set(dias)].sort((a, b) => ORDEN.get(a)! - ORDEN.get(b)!).map((d) => NOMBRE.get(d)!);
    return `${enumerar(nombres)} de ${hora(ini)} a ${hora(fin)}`;
  });
  return capitalizar(partes.join("; "));
}

/** "2 publicados, los dos de Salud". */
export function resumenServicios(servicios: ServicioResponse[]): string | null {
  const n = servicios.length;
  if (n === 0) return null;
  const base = n === 1 ? "1 publicado" : `${n} publicados`;
  const tipos = new Set(servicios.map((s) => s.tipo));
  if (tipos.size !== 1) return base;
  const t = tipoEtiqueta(servicios[0].tipo);
  return n === 1 ? `${base}, de ${t}` : n === 2 ? `${base}, los dos de ${t}` : `${base}, todos de ${t}`;
}

/** "1 buscando paciente y 2 con paciente". Solo los turnos que todavía no pasaron. */
export function resumenTurnos(practicas: PracticaDetalle[]): string | null {
  if (practicas.length === 0) return null;
  const buscando = practicas.filter((p) => p.practica.estado === "Publicada").length;
  const cubiertos = practicas.filter((p) => p.practica.estado === "Cubierta").length;
  const partes = [buscando && `${buscando} buscando paciente`, cubiertos && `${cubiertos} con paciente`].filter(Boolean) as string[];
  return partes.length ? capitalizar(enumerar(partes)) : "No tenés turnos próximos";
}
