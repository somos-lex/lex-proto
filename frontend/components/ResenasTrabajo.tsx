"use client";

// Reseñas de un trabajo: lista las reseñas mutuas y, si corresponde, deja que
// el usuario autenticado califique la experiencia.
//
// Reglas (las valida el backend, las reflejamos en la UI):
//   - Solo se puede reseñar un trabajo Completado.
//   - Solo las partes del trabajo, una sola vez cada una.
// Detectamos si el usuario ya reseñó mirando si figura como autor en
// GET /api/trabajos/{id}/resenas; igual manejamos el 400 "Ya dejaste una reseña".

import { useEffect, useState, type FormEvent } from "react";
import {
  crearResenaTrabajo,
  formatFecha,
  listarResenasTrabajo,
  type Resena,
} from "@/lib/servicios";
import type { Trabajo } from "@/lib/trabajos";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { StarsInput, StarsRow } from "@/components/Stars";
import { ErrorAlert } from "@/components/ui";

export function ResenasTrabajo({ trabajo }: { trabajo: Trabajo }) {
  const { user } = useAuth();

  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const idTrabajo = trabajo.idTrabajo;

  async function cargarResenas() {
    const data = await listarResenasTrabajo(idTrabajo);
    setResenas(data);
    return data;
  }

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setLoadError(null);
    listarResenasTrabajo(idTrabajo)
      .then((data) => {
        if (!cancelado) setResenas(data);
      })
      .catch((err) => {
        if (!cancelado)
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar las reseñas.",
          );
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [idTrabajo]);

  // Nombre del receptor de una reseña, resuelto contra las partes del trabajo.
  function nombreReceptor(r: Resena): string {
    if (r.receptorUsuarioId === trabajo.estudianteId)
      return trabajo.estudianteNombre;
    if (r.receptorUsuarioId === trabajo.clienteId) return trabajo.clienteNombre;
    return "la otra parte";
  }

  const completado = trabajo.estado === "Completado";
  const esParte =
    user?.usuarioId === trabajo.estudianteId ||
    user?.usuarioId === trabajo.clienteId;
  const miResena = resenas.find((r) => r.autorUsuarioId === user?.usuarioId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (puntaje < 1 || puntaje > 5) {
      setSubmitError("Elegí un puntaje de 1 a 5 estrellas.");
      return;
    }

    setSubmitting(true);
    try {
      await crearResenaTrabajo(idTrabajo, {
        puntaje,
        comentario: comentario.trim() || null,
      });
      // Refrescamos para que aparezca la reseña recién dejada.
      await cargarResenas();
      setExito(true);
      setPuntaje(0);
      setComentario("");
    } catch (err) {
      // 400 "Ya dejaste una reseña" / "no completado", 403 "no sos parte":
      // mostramos el mensaje del backend y refrescamos por si ya existe la reseña.
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "No pudimos enviar la reseña.",
      );
      if (err instanceof ApiError && err.status === 400) {
        try {
          await cargarResenas();
        } catch {
          // si el refresh falla, igual mostramos el mensaje de error
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">Reseñas del trabajo</h2>

      {/* Zona para calificar (solo partes) */}
      {esParte && (
        <div className="mt-4">
          {!completado ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-5 text-sm text-gray-500">
              Podrás calificar cuando el trabajo esté completado.
            </div>
          ) : miResena ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Tu reseña
                </h3>
                <StarsRow value={miResena.puntaje} />
              </div>
              {miResena.comentario && (
                <p className="mt-2 text-sm text-gray-600">
                  {miResena.comentario}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {formatFecha(miResena.fecha)} · calificaste a{" "}
                {nombreReceptor(miResena)}
              </p>
            </div>
          ) : exito ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              ¡Gracias por tu reseña!
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <h3 className="font-semibold text-foreground">
                Calificá esta experiencia
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Tu reseña es para{" "}
                <span className="font-medium text-foreground">
                  {user?.usuarioId === trabajo.clienteId
                    ? trabajo.estudianteNombre
                    : trabajo.clienteNombre}
                </span>
                .
              </p>

              <div className="mt-4 space-y-4">
                {submitError && <ErrorAlert message={submitError} />}

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    Puntaje
                  </span>
                  <StarsInput value={puntaje} onChange={setPuntaje} />
                </div>

                <div>
                  <label
                    htmlFor="comentario"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Comentario (opcional)
                  </label>
                  <textarea
                    id="comentario"
                    rows={3}
                    maxLength={1000}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Contá cómo fue tu experiencia…"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Enviando…" : "Enviar reseña"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Listado de reseñas del trabajo */}
      <div className="mt-6">
        {loading ? (
          <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ) : loadError ? (
          <ErrorAlert message={loadError} />
        ) : resenas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center text-sm text-gray-500">
            Este trabajo todavía no tiene reseñas.
          </p>
        ) : (
          <ul className="space-y-4">
            {resenas.map((r) => (
              <li
                key={r.idResena}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-foreground">
                      {r.autorNombre}
                    </span>{" "}
                    calificó a{" "}
                    <span className="font-semibold text-foreground">
                      {nombreReceptor(r)}
                    </span>
                  </span>
                  <StarsRow value={r.puntaje} />
                </div>
                {r.comentario && (
                  <p className="mt-2 text-sm text-gray-600">{r.comentario}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {formatFecha(r.fecha)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
