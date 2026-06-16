"use client";

// Flujo para que un Cliente Particular active su perfil de Estudiante.
//
// Pasos: completa carrera + bio + año → POST /api/perfil/activar-estudiante →
// refrescarSesion() vuelve a loguear para obtener un token con el rol Estudiante
// (el token viejo no lo tiene) → quedamos en vista Estudiante.
//
// Si no hay credenciales en memoria para refrescar (NO_CREDS), avisamos y
// ofrecemos cerrar sesión para que el usuario vuelva a entrar: la activación ya
// quedó hecha en el backend, así que al re-loguear verá el modo estudiante.

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import {
  activarEstudiante,
  listarCarreras,
  type Carrera,
} from "@/lib/perfil";
import { ErrorAlert, Field, Select } from "@/components/ui";

export function ActivarEstudianteModal({ onClose }: { onClose: () => void }) {
  const { refrescarSesion, cambiarVista, logout } = useAuth();

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [cargandoCarreras, setCargandoCarreras] = useState(true);

  const [carreraId, setCarreraId] = useState<string>("");
  const [bio, setBio] = useState("");
  const [anioCursado, setAnioCursado] = useState<string>("1");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Cuando la activación funcionó pero no pudimos refrescar el token.
  const [necesitaReLogin, setNecesitaReLogin] = useState(false);

  useEffect(() => {
    let cancelado = false;
    listarCarreras()
      .then((data) => {
        if (cancelado) return;
        setCarreras(data);
        if (data.length) setCarreraId(String(data[0].carreraId));
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar las carreras.",
          );
      })
      .finally(() => {
        if (!cancelado) setCargandoCarreras(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!carreraId) {
      setError("Elegí una carrera.");
      return;
    }

    setSubmitting(true);
    try {
      await activarEstudiante({
        carreraId: Number(carreraId),
        bio: bio.trim(),
        anioCursado: Number(anioCursado),
      });

      // Token fresco con el rol Estudiante.
      try {
        await refrescarSesion();
        cambiarVista("Estudiante");
        onClose();
      } catch (refreshErr) {
        if (refreshErr instanceof Error && refreshErr.message === "NO_CREDS") {
          // Activado, pero hay que re-loguear manualmente.
          setNecesitaReLogin(true);
        } else {
          throw refreshErr;
        }
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No pudimos activar tu perfil de estudiante.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {necesitaReLogin ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              ¡Perfil de estudiante activado!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Para terminar, volvé a iniciar sesión. Tu nuevo modo estudiante va a
              estar disponible al entrar.
            </p>
            <button
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Activá tu perfil de estudiante
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ofrecé tus servicios en LEX. Contanos qué estudiás.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {error && <ErrorAlert message={error} />}

              <Field label="Carrera" htmlFor="carrera">
                <Select
                  id="carrera"
                  required
                  disabled={cargandoCarreras}
                  value={carreraId}
                  onChange={(e) => setCarreraId(e.target.value)}
                >
                  {cargandoCarreras ? (
                    <option>Cargando carreras…</option>
                  ) : carreras.length === 0 ? (
                    <option value="">No hay carreras disponibles</option>
                  ) : (
                    carreras.map((c) => (
                      <option key={c.carreraId} value={c.carreraId}>
                        {c.nombre}
                      </option>
                    ))
                  )}
                </Select>
              </Field>

              <Field label="Año que cursás" htmlFor="anio">
                <Select
                  id="anio"
                  value={anioCursado}
                  onChange={(e) => setAnioCursado(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}º año
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Bio (opcional)" htmlFor="bio">
                <textarea
                  id="bio"
                  rows={3}
                  maxLength={500}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Contá en qué te especializás…"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </Field>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || cargandoCarreras}
                  className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Activando…" : "Activar perfil"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
