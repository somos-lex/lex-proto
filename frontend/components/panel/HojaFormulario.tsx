"use client";

// Hoja para formularios y elecciones del panel (publicar un servicio, cargar un
// horario, activar el perfil de estudiante). Es un diálogo modal de verdad
// (useDialogoModal: fondo inerte, Escape, foco que vuelve):
//   - en mobile sube desde abajo, como la Hoja del sistema;
//   - desde 768 px entra por la derecha, como el Cajón, con el ancho de un
//     formulario (un formulario a lo ancho de la pantalla no se lee).
//
// Si hay cambios sin guardar, cerrar (Escape, el velo, la X o Cancelar) no
// los tira: pide confirmación. Un toque en el velo sin cambios cierra.

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { Boton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { useDialogoModal } from "@/lib/useDialogoModal";

export function HojaFormulario({
  titulo,
  descripcion,
  onCerrar,
  onSubmit,
  enviar,
  enviando = false,
  deshabilitado = false,
  error,
  children,
}: {
  titulo: string;
  descripcion?: ReactNode;
  onCerrar: () => void;
  /** Con onSubmit, el contenido va en un <form> con "Cancelar" y `enviar` abajo. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  /** El nombre de la acción: "Publicar", "Guardar cambios". */
  enviar?: string;
  enviando?: boolean;
  /** La acción no se puede usar todavía (por ejemplo, mientras carga una lista). */
  deshabilitado?: boolean;
  /** Qué falló al enviar y cómo arreglarlo. Va pegado a la acción. */
  error?: string | null;
  children: ReactNode;
}) {
  const { ref, cerrar } = useDialogoModal(true, onCerrar);
  const idTitulo = useId();
  const [sucio, setSucio] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  // Escape: con cambios, primero pregunta. Se ataja en el keydown, antes de que
  // el navegador pida cerrar (en un input de hora, Chrome manda un segundo
  // pedido que no se puede cancelar), y también en "cancel", por si el pedido
  // llega por otra vía (el botón Atrás de Android).
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const alCancelar = (e: Event) => {
      if (sucio && !confirmando) {
        e.preventDefault();
        setConfirmando(true);
      }
    };
    d.addEventListener("cancel", alCancelar);
    return () => d.removeEventListener("cancel", alCancelar);
  }, [ref, sucio, confirmando]);

  function intentarCerrar() {
    if (sucio) setConfirmando(true);
    else cerrar();
  }

  const cuerpo = (
    <>
      <div className={`min-h-0 flex-1 overflow-y-auto px-5 pt-1 md:px-6 ${onSubmit ? "pb-6" : "pb-[calc(24px+env(safe-area-inset-bottom))]"}`}>{children}</div>
      {onSubmit && (
        <div className="border-t border-line bg-surface px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] md:px-6 md:pb-5">
          {confirmando ? (
            <Aviso
              tono="warn"
              titulo="Tenés cambios sin guardar."
              acciones={
                <>
                  <Boton variante="secundario" tamano="sm" onClick={() => setConfirmando(false)}>
                    Seguir editando
                  </Boton>
                  <Boton variante="peligro" tamano="sm" onClick={cerrar}>
                    Descartar los cambios
                  </Boton>
                </>
              }
            >
              Si cerrás, se pierden.
            </Aviso>
          ) : (
            <>
              {error && (
                <Aviso tono="danger" className="mb-3">
                  {error}
                </Aviso>
              )}
              <div className="flex gap-2">
                <Boton variante="secundario" tamano="lg" onClick={intentarCerrar} disabled={enviando}>
                  Cancelar
                </Boton>
                <Boton type="submit" tamano="lg" className="flex-1" disabled={enviando || deshabilitado} aria-busy={enviando || undefined}>
                  {enviando && (
                    <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
                  )}
                  {enviando ? "Guardando…" : enviar}
                </Boton>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClick={(e) => {
        if (e.target === e.currentTarget) intentarCerrar();
      }}
      onKeyDownCapture={(e) => {
        if (e.key === "Escape" && sucio && !confirmando) {
          e.preventDefault();
          setConfirmando(true);
        }
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-scrim open:flex open:flex-col open:justify-end md:open:flex-row"
    >
      <div className="flex max-h-[92dvh] w-full flex-col rounded-t-sheet bg-surface text-ink shadow-sheet transition-transform duration-[280ms] ease-out starting:translate-y-full motion-reduce:transition-none md:h-full md:max-h-none md:w-[min(520px,100vw)] md:rounded-none md:rounded-l-sheet md:shadow-float md:starting:translate-x-full md:starting:translate-y-0">
        <span aria-hidden="true" className="mx-auto mt-2 block h-[5px] w-10 shrink-0 rounded-[3px] bg-line-strong md:hidden" />
        <div className="flex shrink-0 items-start gap-3 px-5 pt-3 pb-4 md:px-6 md:pt-6">
          <div className="min-w-0 flex-1">
            <h2 id={idTitulo} className="text-title-2-mobile text-balance md:text-title-2">
              {titulo}
            </h2>
            {descripcion && <div className="mt-1 text-[15px] leading-[1.45] text-ink-2">{descripcion}</div>}
          </div>
          <button
            type="button"
            onClick={intentarCerrar}
            aria-label="Cerrar"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-ink hover:bg-surface-3"
          >
            <Icono nombre="x" />
          </button>
        </div>
        {onSubmit ? (
          <form
            onSubmit={onSubmit}
            onInput={() => setSucio(true)}
            className="flex min-h-0 flex-1 flex-col"
          >
            {cuerpo}
          </form>
        ) : (
          cuerpo
        )}
      </div>
    </dialog>
  );
}
