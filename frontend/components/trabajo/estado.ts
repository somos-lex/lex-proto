// Lectura de un trabajo según quién lo mira: de qué lado está la persona, si le
// toca actuar, el riel de pasos y la línea de "próximo paso". Las reglas (qué
// transición existe y quién la hace) son las de lib/transicionesTrabajo.ts y el
// backend; acá solo se decide cómo contarlas.

import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { EstadoPaso } from "@/components/ds/Riel";
import { relojAR } from "@/lib/fechas";
import { teToca as teTocaA } from "@/lib/pendientes";
import { formatFecha } from "@/lib/servicios";
import type { RolEnTrabajo } from "@/lib/transicionesTrabajo";
import type { EstadoTrabajo, TrabajoHistorialResponse, TrabajoResponse } from "@/lib/trabajos";

export const ETIQUETA_ESTADO: Record<EstadoTrabajo, string> = {
  Pendiente: "Pendiente",
  Aceptado: "Aceptado",
  EnCurso: "En curso",
  Entregado: "Entregado",
  Completado: "Completado",
  Cancelado: "Cancelado",
  Disputa: "En disputa",
};

/** Orden de los estados para los filtros. */
export const ORDEN_ESTADOS: EstadoTrabajo[] = ["Pendiente", "Aceptado", "EnCurso", "Entregado", "Completado", "Cancelado", "Disputa"];

export function esEstadoTrabajo(v: string | null): v is EstadoTrabajo {
  return !!v && (ORDEN_ESTADOS as string[]).includes(v);
}

export function rolEn(trabajo: TrabajoResponse, usuarioId: number | undefined): RolEnTrabajo | null {
  if (usuarioId === undefined) return null;
  if (trabajo.estudianteId === usuarioId) return "Estudiante";
  if (trabajo.clienteId === usuarioId) return "Cliente";
  return null;
}

/** Le toca actuar a esta persona, desde su lado del trabajo. Es la regla de
 *  lib/pendientes.ts (la del contador del menú y el Inicio del panel). */
export function teToca(trabajo: TrabajoResponse, rol: RolEnTrabajo | null): boolean {
  if (rol === "Estudiante") return teTocaA(trabajo, trabajo.estudianteId);
  if (rol === "Cliente") return teTocaA(trabajo, trabajo.clienteId);
  return false;
}

export type GrupoTrabajo = "teToca" | "enMarcha" | "terminados";

export function grupoDe(trabajo: TrabajoResponse, rol: RolEnTrabajo | null): GrupoTrabajo {
  if (teToca(trabajo, rol)) return "teToca";
  if (trabajo.estado === "Completado" || trabajo.estado === "Cancelado") return "terminados";
  return "enMarcha";
}

export const TITULO_GRUPO: Record<GrupoTrabajo, string> = {
  teToca: "Te toca",
  enMarcha: "En marcha",
  terminados: "Terminados",
};

// --- Riel ---------------------------------------------------------------------

/** Proyecto cerrado se entrega y se confirma; Clase y Salud avanzan por sesiones
 *  y se completan solas con la última, sin "Entregado". La API igual acepta
 *  entregar una Clase o un servicio de Salud: si el trabajo pasó por ahí, el
 *  paso aparece. */
export function pasosDe(tipo: TrabajoResponse["tipo"], estado?: EstadoTrabajo): EstadoTrabajo[] {
  return tipo === "ProyectoCerrado" || estado === "Entregado"
    ? ["Pendiente", "Aceptado", "EnCurso", "Entregado", "Completado"]
    : ["Pendiente", "Aceptado", "EnCurso", "Completado"];
}

/** Estado desde el que se canceló o se abrió la disputa, leído del historial.
 *  Sin historial, lo único seguro es que todo trabajo arranca en Pendiente y que
 *  `fechaInicio` existe solo si llegó a En curso. */
export function estadoPrevioAlCorte(trabajo: TrabajoResponse, historial: TrabajoHistorialResponse[] | null): EstadoTrabajo {
  if (historial) {
    const corte = [...historial].reverse().find((h) => h.estadoNuevo === trabajo.estado);
    // Disputa → Cancelado: el corte que importa es el de la disputa.
    let previo = corte?.estadoAnterior ?? null;
    if (previo === "Disputa") {
      const disputa = [...historial].reverse().find((h) => h.estadoNuevo === "Disputa");
      previo = disputa?.estadoAnterior ?? "EnCurso";
    }
    if (previo) return previo;
  }
  return trabajo.fechaInicio ? "EnCurso" : "Pendiente";
}

export function pasosRiel(
  trabajo: TrabajoResponse,
  historial: TrabajoHistorialResponse[] | null = null,
): { texto: string; estado: EstadoPaso }[] {
  const { estado } = trabajo;

  if (estado === "Cancelado" || estado === "Disputa") {
    // El riel se corta: los pasos hechos hasta el corte y, en el lugar del
    // siguiente, el nodo de Cancelado o En disputa.
    const previo = estadoPrevioAlCorte(trabajo, historial);
    const pasos = pasosDe(trabajo.tipo, previo);
    const hasta = Math.max(0, pasos.indexOf(previo));
    return [
      ...pasos.slice(0, hasta + 1).map((p) => ({ texto: ETIQUETA_ESTADO[p], estado: "hecho" as const })),
      { texto: ETIQUETA_ESTADO[estado], estado: "mal" as const },
    ];
  }

  const pasos = pasosDe(trabajo.tipo, estado);
  const actual = pasos.indexOf(estado);
  return pasos.map((p, i) => ({
    texto: ETIQUETA_ESTADO[p],
    estado:
      estado === "Completado" && i === actual
        ? "ok"
        : i < actual
          ? "hecho"
          : i === actual
            ? "actual"
            : "pendiente",
  }));
}

// --- Próximo paso ---------------------------------------------------------------

/** Qué sigue y quién lo hace, en una línea. `consentimientoPendiente` solo lo
 *  sabe el detalle (Salud). */
export function proximoPaso(
  trabajo: TrabajoResponse,
  rol: RolEnTrabajo,
  { consentimientoPendiente = false }: { consentimientoPendiente?: boolean } = {},
): string {
  const porSesiones = trabajo.tipo !== "ProyectoCerrado";
  const cliente = trabajo.clienteNombre;
  const estudiante = trabajo.estudianteNombre;
  const fin = trabajo.fechaFin ? ` el ${formatFecha(trabajo.fechaFin)}` : "";

  if (rol === "Estudiante") {
    switch (trabajo.estado) {
      case "Pendiente":
        return `Aceptalo o cancelalo. Si lo cancelás, ${cliente} recupera el pago.`;
      case "Aceptado":
        if (consentimientoPendiente) return `${cliente} todavía no firmó el consentimiento: sin la firma no podés empezar.`;
        return porSesiones ? "Arranca cuando marques la primera sesión como realizada." : "Empezalo cuando te pongas a trabajar.";
      case "EnCurso":
        return porSesiones ? "Marcá cada sesión cuando la des: el pago se libera sesión por sesión." : "Cuando lo termines, marcalo como entregado.";
      case "Entregado":
        return `${cliente} tiene que confirmar la entrega para que se libere tu pago.`;
      case "Completado":
        return `Terminado${fin}. Tu pago se liberó.`;
      case "Cancelado":
        return `Se canceló${fin}.`;
      case "Disputa":
        return "En disputa: el pago queda congelado hasta que se resuelva.";
    }
  }

  switch (trabajo.estado) {
    case "Pendiente":
      return `Falta que ${estudiante} lo acepte. Si no lo acepta, te devolvemos el pago.`;
    case "Aceptado":
      if (consentimientoPendiente) return `Firmá el consentimiento para que ${estudiante} pueda empezar.`;
      return porSesiones ? `${estudiante} lo aceptó. Arranca con la primera sesión.` : `${estudiante} lo aceptó y tiene que empezarlo.`;
    case "EnCurso":
      return porSesiones
        ? `El pago se libera a medida que ${estudiante} marca cada sesión.`
        : `${estudiante} está trabajando. Cuando lo entregue, te toca confirmarlo.`;
    case "Entregado":
      return `Revisá la entrega y confirmala: al confirmarla, se libera el pago a ${estudiante}.`;
    case "Completado":
      return `Terminado${fin}. El pago se liberó a ${estudiante}.`;
    case "Cancelado":
      return `Se canceló${fin}.`;
    case "Disputa":
      return "En disputa: el pago queda congelado hasta que se resuelva.";
  }
}

/** Texto de la acción que lleva al detalle cuando te toca. */
export function accionTeToca(estado: EstadoTrabajo): string {
  if (estado === "Pendiente") return "Revisar y responder";
  if (estado === "Aceptado") return "Ver cómo empezar";
  return "Revisar la entrega";
}

/** "23 de julio de 2026, 10:00", en hora argentina. */
export function fechaHora(iso: string) {
  return format(relojAR(iso), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
}

/** "Trabajo N.º 232" para el estudiante; "Contratación N.º 232" para el cliente. */
export function nombreDe(trabajo: TrabajoResponse, rol: RolEnTrabajo) {
  return `${rol === "Cliente" ? "Contratación" : "Trabajo"} N.º ${trabajo.id}`;
}
