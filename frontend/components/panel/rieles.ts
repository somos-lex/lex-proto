// Los pasos de los rieles del panel, con los estados reales de la API.

import type { EstadoPaso } from "@/components/ds/Riel";
import type { EstadoVerificacion } from "@/lib/portafolio";
import type { EstadoTrabajo, TipoTrabajo } from "@/lib/trabajos";

const ETIQUETA_TRABAJO: Record<EstadoTrabajo, string> = {
  Pendiente: "Pendiente",
  Aceptado: "Aceptado",
  EnCurso: "En curso",
  Entregado: "Entregado",
  Completado: "Completado",
  Cancelado: "Cancelado",
  Disputa: "En disputa",
};

// Clases y Salud no usan Entregado: se completan al marcar la última sesión
// (README_ESTADOS_TRABAJO.md).
const CAMINO: Record<TipoTrabajo, EstadoTrabajo[]> = {
  ProyectoCerrado: ["Pendiente", "Aceptado", "EnCurso", "Entregado", "Completado"],
  Clase: ["Pendiente", "Aceptado", "EnCurso", "Completado"],
  Salud: ["Pendiente", "Aceptado", "EnCurso", "Completado"],
};

/** Riel de un trabajo activo. Cancelado y Disputa no están en el camino: los
 *  dice el chip de estado. */
export function pasosDeTrabajo(tipo: TipoTrabajo, estado: EstadoTrabajo): { texto: string; estado: EstadoPaso }[] {
  const camino = CAMINO[tipo];
  const i = camino.indexOf(estado);
  return camino.map((e, j) => ({
    texto: ETIQUETA_TRABAJO[e],
    estado: j < i ? "hecho" : j === i ? (e === "Completado" ? "ok" : "actual") : "pendiente",
  }));
}

/** Riel de la verificación de una carrera. No decimos "cargaste la
 *  constancia": es opcional y la API no le dice al estudiante si la cargó. */
export function pasosDeVerificacion(estado: EstadoVerificacion): { texto: string; estado: EstadoPaso }[] {
  return [
    { texto: "Pediste la verificación", estado: "hecho" },
    estado === "Pendiente"
      ? { texto: "LEX la revisa", estado: "actual" }
      : { texto: "LEX la revisó", estado: estado === "Rechazado" ? "mal" : "hecho" },
    { texto: "Verificada", estado: estado === "Verificado" ? "ok" : "pendiente" },
  ];
}

/** Qué significa el estado y qué podés hacer. */
export function textoDeVerificacion(estado: EstadoVerificacion, carrera: string) {
  switch (estado) {
    case "Verificado":
      return `Con ${carrera} verificada podés publicar los servicios habilitados para tu carrera y tu año. Tu credencial aparece en todo lo que publicás.`;
    case "Pendiente":
      return `Un admin de LEX está revisando que estudies ${carrera}. Mientras tanto podés explorar y contratar; para publicar, esperá la revisión.`;
    case "Rechazado":
      return `LEX no pudo verificar que estudies ${carrera}. Mientras no esté verificada, no podés publicar servicios ni turnos.`;
  }
}
