// Piezas de lectura del área Público: los datos de un servicio con ícono, una lista
// de rótulo y valor, y los pasos numerados de un proceso real.

import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "@/components/Icono";
import {
  esClase,
  esProyectoCerrado,
  esSalud,
  type ServicioDetalleResponse,
} from "@/lib/servicios";
import { modalidadTexto, plazoTexto } from "./presentacion";

export interface Dato {
  icono: NombreIcono;
  texto: ReactNode;
  /** El que va también como chip debajo del título. */
  chip?: boolean;
}

const FORMATO_ENTREGA: Record<string, string> = {
  Archivos: "Entrega en archivos",
  Link: "Entrega con un enlace",
  Ambos: "Entrega en archivos y con un enlace",
};

function mayuscula(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Los datos de un servicio según su vertical. `agenda` es la frase de horarios
 *  ("los sábados de 9 a 12"), o null si no se pudo consultar o no cargó ninguno. */
export function datosDe(s: ServicioDetalleResponse, agenda: string | null, nombre: string): Dato[] {
  if (esProyectoCerrado(s)) {
    const d = s.detalle;
    return [
      { icono: "calendar", texto: plazoTexto(d.plazoEntregaDias), chip: true },
      {
        icono: "refresh",
        texto: d.revisionesIncluidas === 1 ? "1 revisión incluida" : `${d.revisionesIncluidas} revisiones incluidas`,
      },
      { icono: "file-check", texto: FORMATO_ENTREGA[d.formatoEntrega] ?? d.formatoEntrega },
    ];
  }
  if (esClase(s)) {
    const d = s.detalle;
    const modalidad = modalidadTexto("Clase", d.modalidad);
    return [
      { icono: "clock", texto: `${d.duracionMinutosSesion} min por clase`, chip: true },
      ...(d.esPaquete && d.cantidadSesionesPaquete
        ? [{ icono: "calendar-plus" as const, texto: `Paquete de ${d.cantidadSesionesPaquete} clases`, chip: true }]
        : []),
      ...(modalidad ? [{ icono: d.modalidad === "Online" ? ("browser" as const) : ("pin" as const), texto: mayuscula(modalidad), chip: true }] : []),
      ...(agenda ? [{ icono: "calendar" as const, texto: `${nombre} da clases ${agenda}` }] : []),
    ];
  }
  if (esSalud(s)) {
    const d = s.detalle;
    const modalidad = modalidadTexto("Salud", d.modalidad);
    return [
      { icono: "clock", texto: `${d.duracionMinutosSesion} min por sesión`, chip: true },
      ...(modalidad ? [{ icono: "pin" as const, texto: mayuscula(modalidad), chip: true }] : []),
      ...(agenda ? [{ icono: "calendar" as const, texto: `${nombre} atiende ${agenda}` }] : []),
    ];
  }
  return [];
}

export function ListaDatos({ datos, className = "" }: { datos: Dato[]; className?: string }) {
  return (
    <ul className={`grid gap-1.5 ${className}`}>
      {datos.map((d, i) => (
        <li key={i} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2 text-[15px] leading-[1.4] text-ink">
          <Icono nombre={d.icono} className="mt-px size-[18px] text-ink-2" />
          <span>{d.texto}</span>
        </li>
      ))}
    </ul>
  );
}

/** Rótulo y valor, en un grupo con filetes con sangría. */
export function Definiciones({ filas }: { filas: { rotulo: string; valor: ReactNode }[] }) {
  return (
    <dl className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      {filas.map((f) => (
        <div
          key={f.rotulo}
          className="relative grid gap-0.5 px-4 py-3 before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-line first:before:hidden sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4"
        >
          <dt className="text-[15px] text-ink-2">{f.rotulo}</dt>
          <dd className="text-base text-ink">{f.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Pasos numerados: solo para secuencias reales ("Cómo es contratar", "Cómo funciona"). */
export function Pasos({ pasos }: { pasos: { titulo: string; descripcion?: ReactNode }[] }) {
  return (
    <ol className="grid gap-1">
      {pasos.map((p, i) => (
        <li key={p.titulo} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 py-2">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-surface-2 text-[15px] font-[650] text-ink tabular-nums">
            {i + 1}
          </span>
          <div className="pt-1">
            <p className="text-base leading-[1.35] font-semibold">{p.titulo}</p>
            {p.descripcion && <p className="text-[15px] leading-[1.45] text-ink-2">{p.descripcion}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
