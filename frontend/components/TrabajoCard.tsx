"use client";

// Un trabajo en la lista: qué es, con quién, el riel de pasos y qué sigue.
// Toda la fila lleva al detalle (el título es el link y se estira sobre la
// fila). Cuando te toca actuar, la acción se ve como el primario del sistema:
// es una lista de pendientes del mismo tipo, por eso se permite repetirlo.

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChipEstadoTrabajo } from "@/components/ds/Chip";
import { PortadaMini } from "@/components/ds/Portada";
import { Precio } from "@/components/ds/Precio";
import { Riel } from "@/components/ds/Riel";
import { Icono } from "@/components/Icono";
import { clasesBoton } from "@/components/Boton";
import { formatFecha } from "@/lib/servicios";
import { listarHistorialTrabajo, type TrabajoHistorialResponse, type TrabajoResponse } from "@/lib/trabajos";
import type { RolEnTrabajo } from "@/lib/transicionesTrabajo";
import { accionTeToca, grupoDe, nombreDe, pasosRiel, proximoPaso } from "@/components/trabajo/estado";

export function TrabajoCard({
  trabajo,
  rol,
  titulo: Titulo = "h3",
}: {
  trabajo: TrabajoResponse;
  rol: RolEnTrabajo;
  titulo?: "h3" | "h4";
}) {
  const grupo = grupoDe(trabajo, rol);
  // Lo terminado no lleva riel (el chip ya lo dice); por eso el historial solo
  // se pide para una disputa, que sigue en marcha y corta el riel.
  const conRiel = grupo !== "terminados";
  const historial = useHistorialDelCorte(trabajo, conRiel);
  const pasos = pasosRiel(trabajo, historial === "cargando" ? null : historial);
  const meToca = grupo === "teToca";
  // En marcha, el nodo actual ya dice el estado: el chip queda para lo que no
  // está en el riel como paso (te toca, terminado, disputa).
  const conChip = grupo !== "enMarcha" || trabajo.estado === "Disputa";
  const nombre = nombreDe(trabajo, rol);
  const quien =
    rol === "Estudiante"
      ? `Te contrató ${trabajo.clienteNombre} el ${formatFecha(trabajo.fechaCreacion)}.`
      : `Contrataste a ${trabajo.estudianteNombre} el ${formatFecha(trabajo.fechaCreacion)}.`;

  return (
    <li className="group relative px-4 py-4 before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-line first:before:hidden hover:bg-surface-2 sm:px-5">
      <article aria-labelledby={`trabajo-${trabajo.id}`} className="grid gap-3.5">
        <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[44px_minmax(0,1fr)_auto]">
          <PortadaMini tipo={trabajo.tipo} tema={trabajo.tituloSnapshot} tamano={44} />
          <div className="min-w-0">
            <Titulo id={`trabajo-${trabajo.id}`} className="text-title-3 [overflow-wrap:anywhere]">
              <Link
                href={`/panel/trabajos/${trabajo.id}`}
                className="text-ink no-underline outline-none before:absolute before:inset-0 before:z-0 before:rounded-[inherit] focus-visible:before:outline-2 focus-visible:before:-outline-offset-2 focus-visible:before:outline-focus"
              >
                {trabajo.tituloSnapshot}
                <span className="sr-only">
                  , {nombre}
                  {meToca ? `. ${accionTeToca(trabajo.estado)}` : ""}
                </span>
              </Link>
            </Titulo>
            <p className="mt-0.5 text-secondary text-ink-2">
              {quien} {nombre}.
            </p>
          </div>
          <Precio monto={trabajo.precioAcordado} unidad="en total" className="col-start-2 sm:col-start-auto sm:justify-end sm:text-right" />
        </div>

        {conRiel &&
          (historial === "cargando" ? (
            <div aria-hidden="true" className="h-[42px]" />
          ) : (
            // Cada paso mide lo mismo en todas las filas: los nodos quedan alineados
            // de una fila a la otra aunque el riel tenga cuatro o cinco pasos.
            <div style={{ width: `min(100%, ${pasos.length * 136}px)` }}>
              <Riel pasos={pasos} etiqueta={`Estado de ${nombre.toLowerCase()}`} />
            </div>
          ))}

        <div className="grid gap-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="grid min-w-0 justify-items-start gap-1.5">
            {conChip && <ChipEstadoTrabajo estado={trabajo.estado} teToca={meToca} />}
            <p className="text-secondary text-ink-2">{proximoPaso(trabajo, rol)}</p>
          </div>
          {meToca ? (
            // La fila entera ya es el link: esto es su afordancia, no un segundo destino.
            <span aria-hidden="true" className={clasesBoton({ variante: "primario", tamano: "sm", className: "pointer-events-none group-hover:bg-accent-hover max-sm:w-full" })}>
              {accionTeToca(trabajo.estado)}
            </span>
          ) : (
            <Icono nombre="chev-r" className="size-5 shrink-0 text-ink-3 max-sm:hidden" />
          )}
        </div>
      </article>
    </li>
  );
}

/** Solo para un riel cortado (en la lista, la disputa): el historial dice en qué paso se cortó. */
function useHistorialDelCorte(trabajo: TrabajoResponse, conRiel: boolean): TrabajoHistorialResponse[] | null | "cargando" {
  const cortado = conRiel && (trabajo.estado === "Cancelado" || trabajo.estado === "Disputa");
  const [historial, setHistorial] = useState<TrabajoHistorialResponse[] | null | "cargando">(cortado ? "cargando" : null);
  useEffect(() => {
    if (!cortado) return;
    let cancelado = false;
    listarHistorialTrabajo(trabajo.id)
      .then((h) => !cancelado && setHistorial(h))
      .catch(() => !cancelado && setHistorial(null));
    return () => {
      cancelado = true;
    };
  }, [cortado, trabajo.id]);
  return historial;
}
