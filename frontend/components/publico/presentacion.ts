// Textos derivados de un servicio para las pantallas públicas (tarjeta, ficha y
// contratación). Una sola fuente para que la unidad del precio, la meta y la
// credencial digan lo mismo en todos lados.

import { carreraCorta, carreraYAnio, institucionCorta } from "@/components/ds/Credencial";
import type {
  CredencialEstudiante,
  ModalidadClase,
  ModalidadSalud,
  ServicioResponse,
  TipoServicio,
} from "@/lib/servicios";

/** Nombre corto de cada vertical, el mismo del segmentado y de la portada. */
export const VERTICALES: { tipo: TipoServicio; nombre: string; acceso: string }[] = [
  { tipo: "ProyectoCerrado", nombre: "Proyecto cerrado", acceso: "Proyectos" },
  { tipo: "Clase", nombre: "Clases", acceso: "Clases" },
  { tipo: "Salud", nombre: "Salud", acceso: "Salud" },
];

/** El tema de la portada: el catálogo sin el paréntesis de la carrera
 *  ("Aplicación de vacunas (Veterinaria)" → "Aplicación de vacunas"), o la materia. */
export function temaDe(s: Pick<ServicioResponse, "tema" | "titulo">): string {
  const tema = s.tema?.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return tema || s.titulo;
}

/** Unidad del precio. En un paquete de clases, el precio es del paquete entero. */
export function unidadDe(
  tipo: TipoServicio,
  paquete?: { esPaquete?: boolean | null; cantidadSesionesPaquete?: number | null } | null,
): string {
  if (tipo === "ProyectoCerrado") return "por proyecto";
  if (tipo === "Salud") return "por sesión";
  if (paquete?.esPaquete && paquete.cantidadSesionesPaquete)
    return `por paquete de ${paquete.cantidadSesionesPaquete} clases`;
  return "por clase";
}

const MODALIDAD: Record<ModalidadClase | ModalidadSalud, string> = {
  Online: "en línea",
  Presencial: "presencial",
  Ambas: "",
  Domicilio: "a domicilio",
  Consultorio: "en consultorio",
};

/** "a domicilio", "en línea o presencial"… según la vertical. */
export function modalidadTexto(tipo: TipoServicio, modalidad?: string | null): string | null {
  if (!modalidad) return null;
  if (modalidad === "Ambas")
    return tipo === "Salud" ? "a domicilio o en consultorio" : "en línea o presencial";
  return MODALIDAD[modalidad as ModalidadClase | ModalidadSalud] ?? null;
}

export function plazoTexto(dias: number) {
  return `Entrega en ${dias} ${dias === 1 ? "día" : "días"}`;
}

/** La línea de meta de la tarjeta: "30 min, a domicilio" o "Entrega en 21 días". */
export function metaDe(s: ServicioResponse): { texto: string; icono: "clock" | "calendar" } | null {
  const c = s.condiciones;
  if (!c) return null;
  if (s.tipo === "ProyectoCerrado")
    return c.plazoEntregaDias ? { texto: plazoTexto(c.plazoEntregaDias), icono: "calendar" } : null;
  const partes = [
    c.duracionMinutosSesion ? `${c.duracionMinutosSesion} min` : null,
    modalidadTexto(s.tipo, c.modalidad),
  ].filter(Boolean);
  return partes.length ? { texto: partes.join(", "), icono: "clock" } : null;
}

/** "Odontología, 5.º año, UNNE": la forma corta de las tarjetas y los turnos. */
export function credencialCompacta(c: CredencialEstudiante): string {
  return `${carreraYAnio(carreraCorta(c.carrera), c.anioCursado)}, ${institucionCorta(c.institucion)}`;
}

/** "4,0": formato argentino, un decimal. */
export function formatCalificacion(valor: number): string {
  return valor.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
