"use client";

// Reseñas de un trabajo: las dos partes se califican cuando el trabajo está
// Completado, una vez cada una (el backend lo valida). La propia se muestra una
// sola vez, como "Tu reseña", y no se repite en la lista.

import { useEffect, useState, type FormEvent } from "react";
import { crearResenaTrabajo, listarResenasTrabajo, type ResenaResponse } from "@/lib/resenas";
import { formatFecha } from "@/lib/servicios";
import type { TrabajoResponse } from "@/lib/trabajos";
import { useAuth } from "@/contexts/AuthContext";
import { StarsInput, StarsRow } from "@/components/Stars";
import { Boton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Esqueleto } from "@/components/ds/Estados";
import { Field, Textarea } from "@/components/ui";
import { mensajeDeError } from "@/components/trabajo/errores";
import { TituloSeccion } from "@/components/trabajo/Pagina";

export function ResenasTrabajo({ trabajo, onEnviada }: { trabajo: TrabajoResponse; onEnviada?: (mensaje: string) => void }) {
  const { user } = useAuth();
  const [resenas, setResenas] = useState<ResenaResponse[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [errorPuntaje, setErrorPuntaje] = useState<string | null>(null);

  const idTrabajo = trabajo.id;

  useEffect(() => {
    let vigente = true;
    listarResenasTrabajo(idTrabajo)
      .then((data) => {
        if (!vigente) return;
        setResenas(data);
        setErrorCarga(null);
      })
      .catch((err) => vigente && setErrorCarga(mensajeDeError(err)));
    return () => {
      vigente = false;
    };
  }, [idTrabajo, intento]);

  const soyCliente = user?.usuarioId === trabajo.clienteId;
  const esParte = soyCliente || user?.usuarioId === trabajo.estudianteId;
  const destinatario = soyCliente ? trabajo.estudianteNombre : trabajo.clienteNombre;

  function nombreReceptor(r: ResenaResponse): string {
    if (r.receptorUsuarioId === user?.usuarioId) return "vos";
    if (r.receptorUsuarioId === trabajo.estudianteId) return trabajo.estudianteNombre;
    if (r.receptorUsuarioId === trabajo.clienteId) return trabajo.clienteNombre;
    return "la otra parte";
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setErrorEnvio(null);
    if (puntaje < 1 || puntaje > 5) {
      setErrorPuntaje("Elegí de 1 a 5 estrellas.");
      return;
    }
    setEnviando(true);
    try {
      await crearResenaTrabajo(idTrabajo, { puntaje, comentario: comentario.trim() || undefined });
      setResenas(await listarResenasTrabajo(idTrabajo));
      setPuntaje(0);
      setComentario("");
      onEnviada?.(`Calificaste a ${destinatario}.`);
    } catch (err) {
      setErrorEnvio(mensajeDeError(err, "No pudimos enviar la reseña. Revisá tu conexión y probá de nuevo."));
      // Si ya existía (400), la recarga la muestra como "Tu reseña".
      listarResenasTrabajo(idTrabajo).then(setResenas).catch(() => {});
    } finally {
      setEnviando(false);
    }
  }

  const caja = "rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none";

  let cuerpo;
  if (errorCarga) {
    cuerpo = (
      <Aviso
        tono="danger"
        titulo="No pudimos cargar las reseñas."
        acciones={
          <Boton variante="secundario" tamano="sm" onClick={() => setIntento((i) => i + 1)}>
            <Icono nombre="refresh" />
            Reintentar
          </Boton>
        }
      >
        {errorCarga}
      </Aviso>
    );
  } else if (resenas === null) {
    cuerpo = (
      <div className={`${caja} grid gap-2.5`} aria-busy="true">
        <span className="sr-only">Cargando las reseñas</span>
        <Esqueleto className="h-4 w-40" />
        <Esqueleto className="h-3 w-4/5" />
        <Esqueleto className="h-3 w-3/5" />
      </div>
    );
  } else {
    const mia = resenas.find((r) => r.autorUsuarioId === user?.usuarioId);
    const otras = resenas.filter((r) => r.id !== mia?.id);
    cuerpo = (
      <div className="grid gap-3">
        {esParte &&
          (mia ? (
            <article className={caja} aria-labelledby="titulo-mi-resena">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="titulo-mi-resena" className="text-title-3">
                  Tu reseña
                </h3>
                <StarsRow value={mia.puntaje} />
              </div>
              {mia.comentario && <p className="mt-2 text-base leading-[1.5]">{mia.comentario}</p>}
              <p className="mt-2 text-[15px] text-ink-2">
                Calificaste a {nombreReceptor(mia)} el {formatFecha(mia.fecha)}.
              </p>
            </article>
          ) : (
            <form onSubmit={enviar} noValidate className={`${caja} grid gap-4`} aria-labelledby="titulo-calificar">
              <div>
                <h3 id="titulo-calificar" className="text-title-3">
                  Calificá a {destinatario}
                </h3>
                <p className="mt-1 text-secondary text-ink-2">Tu reseña ayuda a otras personas a decidir. Se publica con tu nombre.</p>
              </div>
              {errorEnvio && (
                <Aviso tono="danger" titulo="No se envió la reseña.">
                  {errorEnvio}
                </Aviso>
              )}
              <fieldset className="grid gap-1.5" aria-describedby={errorPuntaje ? "puntaje-error" : undefined}>
                <legend className="mb-1.5 text-[15px] font-semibold text-ink">Puntaje</legend>
                <StarsInput
                  value={puntaje}
                  onChange={(p) => {
                    setPuntaje(p);
                    setErrorPuntaje(null);
                  }}
                />
                {errorPuntaje && (
                  <p id="puntaje-error" className="flex items-start gap-1.5 text-[14px] font-medium text-danger">
                    <Icono nombre="alert-circle" className="size-[18px]" />
                    {errorPuntaje}
                  </p>
                )}
              </fieldset>
              <Field label="Comentario (opcional)" htmlFor={`comentario-${idTrabajo}`}>
                <Textarea
                  id={`comentario-${idTrabajo}`}
                  rows={3}
                  maxLength={1000}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Contá cómo fue: qué salió bien y qué se puede mejorar."
                />
              </Field>
              <div>
                <Boton type="submit" aria-busy={enviando || undefined} aria-disabled={enviando || undefined} className="max-sm:w-full">
                  {enviando ? "Enviando…" : "Enviar reseña"}
                </Boton>
              </div>
            </form>
          ))}

        {otras.length > 0 ? (
          <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
            {otras.map((r) => (
              <li key={r.id} className="relative px-5 py-4 before:absolute before:top-0 before:right-0 before:left-5 before:h-px before:bg-line first:before:hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base leading-[1.35]">
                    <span className="font-semibold">{r.autorNombre}</span>
                    <span className="text-ink-2"> calificó a {nombreReceptor(r)}</span>
                  </p>
                  <StarsRow value={r.puntaje} />
                </div>
                {r.comentario && <p className="mt-1.5 text-base leading-[1.5]">{r.comentario}</p>}
                <p className="mt-1.5 text-[15px] text-ink-2">{formatFecha(r.fecha)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 text-[15px] text-ink-2">
            {esParte ? `${destinatario} todavía no dejó su reseña.` : "Este trabajo todavía no tiene reseñas."}
          </p>
        )}
      </div>
    );
  }

  return (
    <section aria-labelledby="titulo-resenas">
      <TituloSeccion id="titulo-resenas">Reseñas</TituloSeccion>
      {cuerpo}
    </section>
  );
}
