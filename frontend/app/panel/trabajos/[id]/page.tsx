"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  cambiarEstadoTrabajo,
  listarHistorialTrabajo,
  obtenerTrabajo,
  type EstadoTrabajo,
  type Trabajo,
  type TrabajoHistorial,
} from "@/lib/trabajos";
import { formatPrecio } from "@/lib/servicios";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/RequireRole";
import { EstadoBadge } from "@/components/EstadoBadge";
import { ResenasTrabajo } from "@/components/ResenasTrabajo";
import { ErrorAlert } from "@/components/ui";

interface Accion {
  label: string;
  nuevoEstado: EstadoTrabajo;
  estilo: "primario" | "peligro";
}

// Acciones disponibles según mi rol en el trabajo y el estado actual.
// Refleja la máquina de estados del backend.
function accionesDisponibles(
  estado: EstadoTrabajo,
  soyEstudiante: boolean,
  soyCliente: boolean,
): Accion[] {
  const acciones: Accion[] = [];

  if (soyEstudiante && estado === "Pendiente")
    acciones.push({ label: "Aceptar trabajo", nuevoEstado: "Aceptado", estilo: "primario" });
  if (soyEstudiante && estado === "Aceptado")
    acciones.push({ label: "Iniciar trabajo", nuevoEstado: "EnCurso", estilo: "primario" });
  if (soyCliente && estado === "EnCurso")
    acciones.push({ label: "Dar por completado", nuevoEstado: "Completado", estilo: "primario" });

  // Cancelar: ambas partes, mientras esté Pendiente o Aceptado.
  if (estado === "Pendiente" || estado === "Aceptado")
    acciones.push({ label: "Cancelar", nuevoEstado: "Cancelado", estilo: "peligro" });

  return acciones;
}

function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TrabajoDetallePage() {
  return (
    <RequireRole roles={["Cliente", "Estudiante"]}>
      <TrabajoDetalle />
    </RequireRole>
  );
}

function TrabajoDetalle() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user } = useAuth();

  const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
  const [historial, setHistorial] = useState<TrabajoHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [ejecutando, setEjecutando] = useState<EstadoTrabajo | null>(null);
  const [supervisor, setSupervisor] = useState("");

  async function cargarHistorial() {
    try {
      setHistorial(await listarHistorialTrabajo(id));
    } catch {
      // si falla el historial, no rompemos el detalle
    }
  }

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("Trabajo no válido.");
      setLoading(false);
      return;
    }
    let cancelado = false;
    setLoading(true);
    setError(null);
    obtenerTrabajo(id)
      .then(async (t) => {
        if (cancelado) return;
        setTrabajo(t);
        await cargarHistorial();
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError ? err.message : "No pudimos cargar el trabajo.",
          );
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function ejecutarAccion(
    nuevoEstado: EstadoTrabajo,
    supervisorResponsable?: string,
  ) {
    setEjecutando(nuevoEstado);
    setAccionError(null);
    try {
      const actualizado = await cambiarEstadoTrabajo(
        id,
        nuevoEstado,
        supervisorResponsable,
      );
      setTrabajo(actualizado);
      await cargarHistorial();
    } catch (err) {
      // 400 (transición inválida) / 403 (rol no autorizado): mostramos el mensaje del backend.
      setAccionError(
        err instanceof ApiError ? err.message : "No se pudo cambiar el estado.",
      );
    } finally {
      setEjecutando(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (error || !trabajo) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorAlert message={error ?? "Trabajo no encontrado."} />
        <Link
          href="/panel/trabajos"
          className="mt-6 inline-block text-sm font-semibold text-accent hover:underline"
        >
          ← Volver a mis trabajos
        </Link>
      </div>
    );
  }

  const soyEstudiante = user?.usuarioId === trabajo.estudianteId;
  const soyCliente = user?.usuarioId === trabajo.clienteId;
  const acciones = accionesDisponibles(trabajo.estado, soyEstudiante, soyCliente);
  // El trabajo es de salud si tiene consentimiento asociado.
  const esSalud = trabajo.consentimiento !== null;

  // Resuelve el nombre de quién hizo cada movimiento del historial.
  const nombreDe = (usuarioId: number | null) =>
    usuarioId === trabajo.estudianteId
      ? trabajo.estudianteNombre
      : usuarioId === trabajo.clienteId
        ? trabajo.clienteNombre
        : "—";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/panel/trabajos"
        className="mb-6 inline-block text-sm font-medium text-gray-500 transition hover:text-accent"
      >
        ← Volver a mis trabajos
      </Link>

      {/* Encabezado */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-gray-400">
              Trabajo #{trabajo.idTrabajo}
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {trabajo.tipoServicioNombre ?? "Servicio"}
            </h1>
          </div>
          <EstadoBadge estado={trabajo.estado} />
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Cliente</dt>
            <dd className="font-medium text-foreground">{trabajo.clienteNombre}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Estudiante</dt>
            <dd className="font-medium text-foreground">{trabajo.estudianteNombre}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Monto</dt>
            <dd className="font-bold text-foreground">{formatPrecio(trabajo.monto)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Creado</dt>
            <dd className="font-medium text-foreground">
              {formatFechaHora(trabajo.fechaCreacion)}
            </dd>
          </div>
          {trabajo.idServicio && (
            <div>
              <dt className="text-gray-500">Servicio</dt>
              <dd>
                <Link
                  href={`/servicios/${trabajo.idServicio}`}
                  className="font-medium text-accent hover:underline"
                >
                  Ver publicación
                </Link>
              </dd>
            </div>
          )}
        </dl>

        {/* Acciones del ciclo de vida */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          {accionError && (
            <div className="mb-4">
              <ErrorAlert message={accionError} />
            </div>
          )}
          {acciones.length > 0 ? (
            <div className="flex flex-wrap items-end gap-3">
              {acciones.map((a) => {
                // Aceptar un trabajo de salud: el estudiante debe indicar el
                // supervisor responsable (profesional matriculado).
                if (a.nuevoEstado === "Aceptado" && esSalud) {
                  return (
                    <div
                      key="aceptar-salud"
                      className="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 p-4"
                    >
                      <label
                        htmlFor="supervisor"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Supervisor responsable (profesional matriculado)
                      </label>
                      <input
                        id="supervisor"
                        value={supervisor}
                        onChange={(e) => setSupervisor(e.target.value)}
                        maxLength={200}
                        placeholder="Ej: Lic. María González, M.N. 12345"
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 sm:max-w-md"
                      />
                      <button
                        onClick={() =>
                          ejecutarAccion("Aceptado", supervisor.trim())
                        }
                        disabled={ejecutando !== null || !supervisor.trim()}
                        className="mt-3 block rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-60"
                      >
                        {ejecutando === "Aceptado"
                          ? "Procesando…"
                          : "Aceptar trabajo"}
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    key={a.nuevoEstado}
                    onClick={() => ejecutarAccion(a.nuevoEstado)}
                    disabled={ejecutando !== null}
                    className={
                      a.estilo === "primario"
                        ? "rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-60"
                        : "rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    }
                  >
                    {ejecutando === a.nuevoEstado ? "Procesando…" : a.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No hay acciones disponibles en este estado
              {trabajo.estado === "Completado"
                ? " — el trabajo está finalizado."
                : trabajo.estado === "Cancelado"
                  ? " — el trabajo fue cancelado."
                  : " para tu rol."}
            </p>
          )}
        </div>
      </div>

      {/* Bloque de Salud: consentimiento informado + supervisor */}
      {esSalud && trabajo.consentimiento && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/40 p-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Servicio de salud
            </span>
            <h2 className="text-lg font-semibold text-foreground">
              Consentimiento informado
            </h2>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Paciente</dt>
              <dd className="font-medium text-foreground">
                {trabajo.consentimiento.pacienteNombre ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Estado del consentimiento</dt>
              <dd className="font-medium text-foreground">
                {trabajo.consentimiento.aceptado ? (
                  <span className="text-emerald-700">Aceptado</span>
                ) : (
                  <span className="text-gray-500">Pendiente</span>
                )}
                {trabajo.consentimiento.fechaAceptacion &&
                  ` · ${formatFechaHora(trabajo.consentimiento.fechaAceptacion)}`}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Supervisor responsable</dt>
              <dd className="font-medium text-foreground">
                {trabajo.consentimiento.supervisorResponsable ?? (
                  <span className="font-normal text-gray-400">
                    Lo asignará el estudiante al aceptar el trabajo.
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {trabajo.consentimiento.textoConsentimiento && (
            <p className="mt-4 rounded-lg border border-emerald-100 bg-white p-3.5 text-xs leading-relaxed text-gray-600">
              {trabajo.consentimiento.textoConsentimiento}
            </p>
          )}
        </div>
      )}

      {/* Reseñas: calificar + ver las del trabajo */}
      <ResenasTrabajo trabajo={trabajo} />

      {/* Historial */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">
          Historial de estados
        </h2>
        {historial.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Sin movimientos registrados.</p>
        ) : (
          <ol className="mt-4 space-y-4 border-l-2 border-gray-100 pl-5">
            {historial.map((h) => (
              <li key={h.idHistorial} className="relative">
                <span className="absolute -left-[1.7rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-accent" />
                <div className="flex flex-wrap items-center gap-2">
                  {h.estadoAnterior && (
                    <>
                      <EstadoBadge estado={h.estadoAnterior} />
                      <span className="text-gray-300">→</span>
                    </>
                  )}
                  <EstadoBadge estado={h.estadoNuevo} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formatFechaHora(h.fecha)} · por {nombreDe(h.usuarioId)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
