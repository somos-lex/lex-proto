"use client";

// Acciones de un trabajo según su estado y el rol de la persona (las reglas son
// las de lib/transicionesTrabajo.ts; el backend valida cada una). Dos zonas:
//   - "principal": la acción que hace avanzar el trabajo (aceptar, empezar,
//     entregar, confirmar), en primario, dentro de "Próximo paso".
//   - "problemas": cancelar y abrir una disputa, en peligro y aparte, para que
//     no queden al lado del primario.
// Las que mueven plata o no se deshacen piden confirmación en un diálogo que dice
// qué pasa con el pago.

import { useState } from "react";
import {
  aceptarTrabajo,
  cancelarTrabajo,
  completarTrabajo,
  disputarTrabajo,
  entregarTrabajo,
  iniciarTrabajo,
  type TrabajoResponse,
} from "@/lib/trabajos";
import { accionesDisponibles, type AccionTrabajo, type RolEnTrabajo } from "@/lib/transicionesTrabajo";
import { formatPrecio } from "@/lib/servicios";
import { Boton } from "@/components/Boton";
import { Aviso } from "@/components/ds/Aviso";
import { Field, Textarea } from "@/components/ui";
import { Dialogo } from "@/components/ds/Dialogo";
import { mensajeDeError } from "@/components/trabajo/errores";
import { nombreDe } from "@/components/trabajo/estado";

const PRINCIPALES: AccionTrabajo[] = ["aceptar", "iniciar", "entregar", "completar"];
const PROBLEMAS: AccionTrabajo[] = ["cancelar", "disputar"];

interface Copia {
  boton: string;
  /** Sin confirmación: se ejecuta al tocar (igual que antes). */
  confirmar?: { titulo: string; texto: string; boton: string };
  exito: string;
}

function copiaDe(accion: AccionTrabajo, t: TrabajoResponse, rol: RolEnTrabajo): Copia {
  const nombre = nombreDe(t, rol);
  const enMinuscula = nombre.charAt(0).toLowerCase() + nombre.slice(1);
  const laOtraParte = rol === "Cliente" ? t.estudianteNombre : t.clienteNombre;
  switch (accion) {
    case "aceptar":
      return { boton: "Aceptar trabajo", exito: `Aceptaste el ${enMinuscula}.` };
    case "iniciar":
      return { boton: "Empezar el trabajo", exito: `Empezaste el ${enMinuscula}.` };
    case "entregar":
      return {
        boton: "Marcar como entregado",
        confirmar: {
          titulo: "¿Marcás el trabajo como entregado?",
          texto: `${t.clienteNombre} va a revisarlo. Cuando confirme la entrega, LEX te paga lo que te corresponde.`,
          boton: "Marcar como entregado",
        },
        exito: `Marcaste como entregado el ${enMinuscula}.`,
      };
    case "completar":
      return {
        boton: "Confirmar la entrega",
        confirmar: {
          titulo: "¿Confirmás que recibiste el trabajo?",
          texto: `Al confirmarlo, LEX le paga a ${t.estudianteNombre} y el trabajo queda completado. Hacelo solo si la entrega está bien: no se puede deshacer.`,
          boton: "Confirmar y liberar el pago",
        },
        exito: `Confirmaste la entrega: le pagamos a ${t.estudianteNombre}.`,
      };
    case "cancelar":
      return {
        boton: rol === "Cliente" ? "Cancelar la contratación" : "Cancelar el trabajo",
        confirmar: {
          titulo: rol === "Cliente" ? "¿Cancelás la contratación?" : "¿Cancelás el trabajo?",
          texto:
            rol === "Cliente"
              ? `LEX te devuelve el pago (${formatPrecio(t.precioAcordado)}) y ${t.estudianteNombre} deja de trabajar en esto. No se puede deshacer.`
              : `LEX le devuelve el pago (${formatPrecio(t.precioAcordado)}) a ${t.clienteNombre}. No se puede deshacer.`,
          boton: rol === "Cliente" ? "Sí, cancelar la contratación" : "Sí, cancelar el trabajo",
        },
        exito: `Cancelaste ${rol === "Cliente" ? "la" : "el"} ${enMinuscula}.`,
      };
    case "disputar":
      return {
        boton: "Abrir una disputa",
        confirmar: {
          titulo: "¿Abrís una disputa?",
          texto: `Mientras dure, el pago queda congelado: no se libera ni se devuelve. Contá qué pasó con ${laOtraParte}.`,
          boton: "Abrir la disputa",
        },
        exito: `Abriste una disputa por ${rol === "Cliente" ? "la" : "el"} ${enMinuscula}.`,
      };
  }
}

async function ejecutar(accion: AccionTrabajo, id: number, motivo?: string) {
  switch (accion) {
    case "aceptar":
      return aceptarTrabajo(id);
    case "iniciar":
      return iniciarTrabajo(id);
    case "entregar":
      return entregarTrabajo(id);
    case "completar":
      return completarTrabajo(id);
    case "cancelar":
      return cancelarTrabajo(id);
    case "disputar":
      return disputarTrabajo(id, motivo ?? "");
  }
}

export function accionesDeZona(t: TrabajoResponse, rol: RolEnTrabajo, zona: "principal" | "problemas") {
  const todas = accionesDisponibles(t.estado, rol, t.tipo);
  return todas.filter((a) => (zona === "principal" ? PRINCIPALES : PROBLEMAS).includes(a));
}

export function AccionesTrabajo({
  trabajo,
  rolUsuario,
  zona,
  onAccionCompletada,
}: {
  trabajo: TrabajoResponse;
  rolUsuario: RolEnTrabajo;
  zona: "principal" | "problemas";
  /** Recibe el mensaje de éxito para el toast. */
  onAccionCompletada: (mensaje: string) => void;
}) {
  const [ejecutando, setEjecutando] = useState<AccionTrabajo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<AccionTrabajo | null>(null);
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);

  const acciones = accionesDeZona(trabajo, rolUsuario, zona);
  if (acciones.length === 0) return null;

  async function hacer(accion: AccionTrabajo, motivoDisputa?: string) {
    setEjecutando(accion);
    setError(null);
    try {
      await ejecutar(accion, trabajo.id, motivoDisputa);
      setConfirmando(null);
      onAccionCompletada(copiaDe(accion, trabajo, rolUsuario).exito);
    } catch (err) {
      setConfirmando(null);
      setError(mensajeDeError(err, "No pudimos hacerlo. Revisá tu conexión y probá de nuevo."));
    } finally {
      setEjecutando(null);
    }
  }

  function tocar(accion: AccionTrabajo) {
    if (ejecutando !== null) return; // aria-disabled no frena el click
    if (copiaDe(accion, trabajo, rolUsuario).confirmar) {
      setMotivo("");
      setErrorMotivo(null);
      setConfirmando(accion);
      return;
    }
    hacer(accion);
  }

  function confirmar() {
    if (!confirmando || ejecutando !== null) return;
    if (confirmando === "disputar" && !motivo.trim()) {
      setErrorMotivo("Contá qué pasó: sin el motivo no se puede abrir la disputa.");
      return;
    }
    hacer(confirmando, confirmando === "disputar" ? motivo.trim() : undefined);
  }

  const copiaConfirmando = confirmando ? copiaDe(confirmando, trabajo, rolUsuario) : null;

  const botones = acciones.map((a) => {
    const c = copiaDe(a, trabajo, rolUsuario);
    const cargando = ejecutando === a && !c.confirmar;
    return (
      <Boton
        key={a}
        variante={zona === "principal" ? "primario" : "peligro"}
        tamano={zona === "principal" ? "md" : "sm"}
        className={zona === "principal" ? "max-sm:w-full" : ""}
        onClick={() => tocar(a)}
        aria-disabled={ejecutando !== null || undefined}
        aria-busy={cargando || undefined}
      >
        {cargando && <Giro />}
        {cargando ? "Guardando…" : c.boton}
      </Boton>
    );
  });

  return (
    <div className="grid gap-3">
      {error && (
        <Aviso tono="danger" titulo="No se pudo completar la acción.">
          {error}
        </Aviso>
      )}
      <div className="flex flex-wrap gap-2">{botones}</div>

      <Dialogo
        abierto={confirmando !== null}
        onCerrar={() => setConfirmando(null)}
        titulo={copiaConfirmando?.confirmar?.titulo}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setConfirmando(null)} className="max-sm:w-full">
              Volver
            </Boton>
            <Boton
              variante={confirmando === "cancelar" || confirmando === "disputar" ? "peligro" : "primario"}
              onClick={confirmar}
              aria-busy={ejecutando !== null || undefined}
              aria-disabled={ejecutando !== null || undefined}
              className="max-sm:w-full"
            >
              {ejecutando !== null && <Giro />}
              {ejecutando !== null ? "Guardando…" : copiaConfirmando?.confirmar?.boton}
            </Boton>
          </>
        }
      >
        <p>{copiaConfirmando?.confirmar?.texto}</p>
        {confirmando === "disputar" && (
          <Field label="Qué pasó" htmlFor={`motivo-disputa-${trabajo.id}`} error={errorMotivo}>
            <Textarea
              id={`motivo-disputa-${trabajo.id}`}
              rows={4}
              maxLength={500}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (errorMotivo) setErrorMotivo(null);
              }}
              aria-invalid={!!errorMotivo || undefined}
              aria-describedby={errorMotivo ? `motivo-disputa-${trabajo.id}-error` : undefined}
              placeholder="Por ejemplo: la entrega no incluye lo que acordamos."
            />
          </Field>
        )}
      </Dialogo>
    </div>
  );
}

function Giro() {
  return <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />;
}

