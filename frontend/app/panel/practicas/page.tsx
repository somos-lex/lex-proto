"use client";

// Panel del estudiante en el Banco de Turnos: publicar prácticas, ver quién se inscribió,
// registrar la asistencia (que emite la constancia) y cancelar.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  cancelarInscripcion,
  cancelarPractica,
  formatFechaHoraAR,
  formatHoraAR,
  listarMisPracticas,
  registrarAsistencia,
  type EstadoPractica,
  type PracticaDetalle,
} from "@/lib/practicas";
import { ApiError } from "@/lib/api";
import { useAhora } from "@/lib/useAhora";
import { RequireRole } from "@/components/RequireRole";
import { ErrorAlert } from "@/components/ui";
import { EstadoPracticaBadge, TipoPacienteBadge } from "@/components/practicas/Badges";
import { PublicarPracticaForm } from "@/components/practicas/PublicarPracticaForm";
import { ConstanciaModal } from "@/components/practicas/ConstanciaModal";

// Orden de las secciones: primero lo que pide acción.
const SECCIONES: { estado: EstadoPractica; titulo: string }[] = [
  { estado: "Cubierta", titulo: "Con paciente inscripto" },
  { estado: "Publicada", titulo: "Buscando paciente" },
  { estado: "Realizada", titulo: "Realizadas" },
  { estado: "Vencida", titulo: "Vencidas sin paciente" },
  { estado: "Cancelada", titulo: "Canceladas" },
];

export default function MisPracticasPage() {
  return (
    <RequireRole roles={["Estudiante"]} vista="Estudiante">
      <MisPracticas />
    </RequireRole>
  );
}

function MisPracticas() {
  const [practicas, setPracticas] = useState<PracticaDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [formAbierto, setFormAbierto] = useState(false);
  const [constanciaDe, setConstanciaDe] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarMisPracticas()
      .then((data) => {
        if (!cancelado) {
          setPracticas(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelado)
          setError(err instanceof ApiError ? err.message : "No pudimos cargar tus prácticas.");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [version]);

  const recargar = () => setVersion((v) => v + 1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis prácticas clínicas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Publicá la necesidad de un paciente para tus materias. La inscripción es sin costo.
          </p>
        </div>
        <button
          onClick={() => setFormAbierto(true)}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Publicar práctica
        </button>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorAlert message={error} />
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
          ))}
        </div>
      ) : practicas.length === 0 && !error ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-slate-200 px-6 py-14 text-center">
          <p className="text-slate-600">Todavía no publicaste ninguna práctica.</p>
          <p className="mt-1 text-sm text-slate-500">
            Elegí una materia de tu carrera, la fecha y el lugar, y las personas interesadas se inscriben.
          </p>
        </div>
      ) : (
        SECCIONES.map(({ estado, titulo }) => {
          const delEstado = practicas.filter((p) => p.practica.estado === estado);
          if (delEstado.length === 0) return null;
          return (
            <section key={estado} className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {titulo} ({delEstado.length})
              </h2>
              <ul className="mt-3 space-y-3">
                {delEstado.map((p) => (
                  <PracticaEstudianteItem
                    key={p.practica.id}
                    detalle={p}
                    onCambio={recargar}
                    onVerConstancia={() => setConstanciaDe(p.practica.id)}
                  />
                ))}
              </ul>
            </section>
          );
        })
      )}

      {formAbierto && (
        <PublicarPracticaForm
          onCerrar={() => setFormAbierto(false)}
          onPublicada={() => {
            setFormAbierto(false);
            recargar();
          }}
        />
      )}

      {constanciaDe !== null && (
        <ConstanciaModal practicaId={constanciaDe} onCerrar={() => setConstanciaDe(null)} />
      )}
    </div>
  );
}

type Accion = "ninguna" | "asistencia" | "cancelarPractica" | "rechazarPaciente";

function PracticaEstudianteItem({
  detalle,
  onCambio,
  onVerConstancia,
}: {
  detalle: PracticaDetalle;
  onCambio: () => void;
  onVerConstancia: () => void;
}) {
  const ahora = useAhora();
  const p = detalle.practica;
  const inscripcion = detalle.inscripcion;

  const [accion, setAccion] = useState<Accion>("ninguna");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inicio = new Date(p.fechaHoraInicio).getTime();
  // null mientras hidrata: las acciones dependientes del horario quedan deshabilitadas.
  const yaEmpezo = ahora !== null && ahora >= inicio;
  const esFutura = ahora !== null && ahora < inicio;

  async function ejecutar(fn: () => Promise<unknown>) {
    setEnviando(true);
    setError(null);
    try {
      await fn();
      setAccion("ninguna");
      setTexto("");
      onCambio();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar la acción.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <EstadoPracticaBadge estado={p.estado} />
            <TipoPacienteBadge tipo={p.tipoPacienteRequerido} />
          </div>
          <Link href={`/practicas/${p.id}`} className="mt-2 block font-semibold text-slate-900 hover:text-indigo-700">
            {p.materiaNombre}
          </Link>
          <p className="text-sm text-slate-600 first-letter:uppercase">
            {formatFechaHoraAR(p.fechaHoraInicio)} a {formatHoraAR(p.fechaHoraFin)} · {p.lugar}
          </p>
          {detalle.motivoCancelacion && (
            <p className="mt-1 text-xs text-slate-500">Motivo: {detalle.motivoCancelacion}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {p.estado === "Cubierta" && (
            <button
              onClick={() => setAccion("asistencia")}
              disabled={!yaEmpezo}
              title={yaEmpezo ? undefined : "Se habilita a partir del horario de inicio"}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Registrar asistencia
            </button>
          )}
          {p.estado === "Cubierta" && esFutura && (
            <button
              onClick={() => setAccion("rechazarPaciente")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Rechazar paciente
            </button>
          )}
          {(p.estado === "Publicada" || p.estado === "Cubierta") && esFutura && (
            <button
              onClick={() => setAccion("cancelarPractica")}
              className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Cancelar práctica
            </button>
          )}
          {p.estado === "Realizada" && (
            <button
              onClick={onVerConstancia}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver constancia
            </button>
          )}
        </div>
      </div>

      {inscripcion && (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <p className="font-medium text-slate-900">
            Paciente: {inscripcion.paciente.nombreCompleto}
            {inscripcion.paciente.especie &&
              ` (${inscripcion.paciente.especie}${inscripcion.paciente.raza ? `, ${inscripcion.paciente.raza}` : ""})`}
          </p>
          <p className="text-slate-600">Inscripto por {inscripcion.clienteNombre}</p>
          {inscripcion.paciente.notasRelevantes && (
            <p className="mt-1 text-slate-600">Notas: {inscripcion.paciente.notasRelevantes}</p>
          )}
          {inscripcion.paciente.contactoEmergenciaNombre && (
            <p className="mt-1 text-slate-500">
              Contacto de emergencia: {inscripcion.paciente.contactoEmergenciaNombre}
              {inscripcion.paciente.contactoEmergenciaTelefono && ` · ${inscripcion.paciente.contactoEmergenciaTelefono}`}
            </p>
          )}
        </div>
      )}

      {p.estado === "Cubierta" && !yaEmpezo && ahora !== null && (
        <p className="mt-2 text-xs text-slate-500">
          La asistencia se registra a partir del horario de inicio: una constancia emitida antes de
          la práctica no sirve como evidencia ante la cátedra.
        </p>
      )}

      {accion !== "ninguna" && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor={`texto-${p.id}`}>
            {accion === "asistencia" ? "Observaciones (opcional)" : "Motivo (opcional)"}
          </label>
          <textarea
            id={`texto-${p.id}`}
            rows={2}
            maxLength={accion === "asistencia" ? 2000 : 1000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-focus/20"
          />
          {error && <ErrorAlert message={error} />}
          <div className="flex flex-wrap gap-2">
            {accion === "asistencia" && (
              <>
                <button
                  disabled={enviando}
                  onClick={() => ejecutar(() => registrarAsistencia(p.id, true, texto))}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  El paciente asistió
                </button>
                <button
                  disabled={enviando}
                  onClick={() => ejecutar(() => registrarAsistencia(p.id, false, texto))}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                >
                  No se presentó
                </button>
              </>
            )}
            {accion === "rechazarPaciente" && inscripcion && (
              <button
                disabled={enviando}
                onClick={() => ejecutar(() => cancelarInscripcion(inscripcion.id, texto))}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
              >
                Confirmar: la práctica vuelve a buscar paciente
              </button>
            )}
            {accion === "cancelarPractica" && (
              <button
                disabled={enviando}
                onClick={() => ejecutar(() => cancelarPractica(p.id, texto))}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                Confirmar cancelación
              </button>
            )}
            <button
              disabled={enviando}
              onClick={() => {
                setAccion("ninguna");
                setError(null);
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
