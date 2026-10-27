"use client";

// Turnos del cliente en el Banco de Turnos (prácticas clínicas sin costo):
// próximas, pasadas y canceladas, con la constancia de asistencia cuando corresponda.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  cancelarInscripcion,
  formatFechaHoraAR,
  listarMisInscripciones,
  type EstadoInscripcion,
  type Inscripcion,
} from "@/lib/practicas";
import { ApiError } from "@/lib/api";
import { useAhora } from "@/lib/useAhora";
import { RequireRole } from "@/components/RequireRole";
import { Boton, clasesBoton } from "@/components/Boton";
import { Aviso } from "@/components/ds/Aviso";
import { Chip, type TonoChip } from "@/components/ds/Chip";
import { Dialogo } from "@/components/ds/Dialogo";
import { Cargando, Esqueleto, Vacio } from "@/components/ds/Estados";
import { Toast } from "@/components/ds/Toast";
import { Field, Textarea } from "@/components/ui";
import { ConstanciaModal } from "@/components/practicas/ConstanciaModal";
import { EncabezadoPagina, Pagina, TituloSeccion } from "@/components/trabajo/Pagina";

export default function MisInscripcionesPage() {
  return (
    <RequireRole roles={["Cliente"]} vista="Cliente">
      <MisInscripciones />
    </RequireRole>
  );
}

function MisInscripciones() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [constanciaDe, setConstanciaDe] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<Inscripcion | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [enviandoCancelacion, setEnviandoCancelacion] = useState(false);
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const ahora = useAhora();

  useEffect(() => {
    let cancelado = false;
    listarMisInscripciones()
      .then((data) => {
        if (!cancelado) {
          setInscripciones(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar tus turnos del Banco.",
          );
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [version]);

  function recargar() {
    setLoading(true);
    setError(null);
    setVersion((v) => v + 1);
  }

  async function handleConfirmarCancelar() {
    if (!cancelando) return;
    setEnviandoCancelacion(true);
    setErrorCancelacion(null);
    try {
      await cancelarInscripcion(cancelando.id, motivoCancelacion);
      setCancelando(null);
      setMotivoCancelacion("");
      setToast("El turno fue cancelado y el lugar quedó libre en el Banco.");
      recargar();
    } catch (err) {
      setErrorCancelacion(
        err instanceof ApiError
          ? err.message
          : "No pudimos cancelar el turno. Probá de nuevo.",
      );
    } finally {
      setEnviandoCancelacion(false);
    }
  }

  const esFuturo = (i: Inscripcion) =>
    ahora !== null && ahora < new Date(i.practica.fechaHoraInicio).getTime();

  const proximos = inscripciones.filter((i) => i.estado === "Inscripta" && esFuturo(i));
  const anteriores = inscripciones.filter((i) => !(i.estado === "Inscripta" && esFuturo(i)));

  return (
    <Pagina>
      <EncabezadoPagina
        titulo="Mis turnos del Banco"
        bajada="Turnos de prácticas clínicas sin costo para las personas o mascotas a tu cargo."
        acciones={
          inscripciones.length > 0 && !loading ? (
            <Link
              href="/practicas"
              className={clasesBoton({ variante: "secundario" })}
            >
              Buscar en el Banco
            </Link>
          ) : null
        }
      />

      {error && (
        <div className="mt-6">
          <Aviso
            tono="danger"
            titulo="No pudimos cargar tus turnos"
            acciones={
              <Boton variante="secundario" onClick={recargar}>
                Reintentar
              </Boton>
            }
          >
            {error}
          </Aviso>
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <Cargando etiqueta="Cargando tus turnos del Banco">
            <div className="space-y-4">
              <EsqueletoTurno />
              <EsqueletoTurno />
            </div>
          </Cargando>
        ) : inscripciones.length === 0 ? (
          <Vacio
            icono="calendar"
            titulo="Todavía no tenés turnos reservados"
            acciones={
              <Link
                href="/practicas"
                className={clasesBoton({ variante: "primario" })}
              >
                Buscar prácticas en el Banco
              </Link>
            }
          >
            Encontrá turnos de atención clínica sin costo realizados por estudiantes avanzados y supervisados por docentes.
          </Vacio>
        ) : (
          <div className="space-y-10">
            {proximos.length > 0 && (
              <section>
                <TituloSeccion
                  fin={
                    <span className="text-[15px] font-normal text-ink-3">
                      ({proximos.length})
                    </span>
                  }
                >
                  Próximos turnos
                </TituloSeccion>
                <ul className="space-y-4">
                  {proximos.map((i) => (
                    <TurnoCard
                      key={i.id}
                      inscripcion={i}
                      esFuturo={true}
                      onVerConstancia={() => setConstanciaDe(i.practica.id)}
                      onPedirCancelar={() => {
                        setCancelando(i);
                        setMotivoCancelacion("");
                        setErrorCancelacion(null);
                      }}
                    />
                  ))}
                </ul>
              </section>
            )}

            {anteriores.length > 0 && (
              <section>
                <TituloSeccion
                  fin={
                    <span className="text-[15px] font-normal text-ink-3">
                      ({anteriores.length})
                    </span>
                  }
                >
                  {proximos.length > 0 ? "Turnos anteriores" : "Historial de turnos"}
                </TituloSeccion>
                <ul className="space-y-4">
                  {anteriores.map((i) => (
                    <TurnoCard
                      key={i.id}
                      inscripcion={i}
                      esFuturo={false}
                      onVerConstancia={() => setConstanciaDe(i.practica.id)}
                      onPedirCancelar={() => {
                        setCancelando(i);
                        setMotivoCancelacion("");
                        setErrorCancelacion(null);
                      }}
                    />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Diálogo de cancelación modal */}
      {cancelando && (
        <Dialogo
          abierto={true}
          onCerrar={() => setCancelando(null)}
          titulo="Cancelar turno"
          pie={
            <>
              <Boton
                variante="secundario"
                onClick={() => setCancelando(null)}
                disabled={enviandoCancelacion}
              >
                Volver
              </Boton>
              <Boton
                variante="peligro"
                onClick={handleConfirmarCancelar}
                disabled={enviandoCancelacion}
              >
                {enviandoCancelacion ? "Cancelando…" : "Confirmar cancelación"}
              </Boton>
            </>
          }
        >
          <div className="grid gap-4">
            <p>
              ¿Querés cancelar el turno de{" "}
              <strong className="text-ink font-semibold">
                {cancelando.practica.materiaNombre}
              </strong>{" "}
              para{" "}
              <strong className="text-ink font-semibold">
                {cancelando.paciente.nombreCompleto}
              </strong>
              ? El lugar va a quedar liberado para otra persona en el Banco de Turnos.
            </p>

            <Field
              label="Motivo (opcional)"
              htmlFor="motivo-cancelar"
              ayuda="Si querés, dejale un mensaje al estudiante explicando por qué no podés asistir."
            >
              <Textarea
                id="motivo-cancelar"
                rows={2}
                maxLength={1000}
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Ej: Tuve un imprevisto…"
              />
            </Field>

            {errorCancelacion && (
              <Aviso tono="danger" titulo="No pudimos cancelar">
                {errorCancelacion}
              </Aviso>
            )}
          </div>
        </Dialogo>
      )}

      {constanciaDe !== null && (
        <ConstanciaModal
          practicaId={constanciaDe}
          onCerrar={() => setConstanciaDe(null)}
        />
      )}

      <Toast mensaje={toast} onCerrar={() => setToast(null)} conLateral />
    </Pagina>
  );
}

function TurnoCard({
  inscripcion: i,
  esFuturo,
  onVerConstancia,
  onPedirCancelar,
}: {
  inscripcion: Inscripcion;
  esFuturo: boolean;
  onVerConstancia: () => void;
  onPedirCancelar: () => void;
}) {
  const cancelable = i.estado === "Inscripta" && esFuturo;

  const META_ESTADO: Record<
    EstadoInscripcion,
    { etiqueta: string; tono: TonoChip; icono: "calendar" | "check" | "alert" | "x" }
  > = {
    Inscripta: { etiqueta: "Inscripta", tono: "info", icono: "calendar" },
    Asistio: { etiqueta: "Asistió", tono: "ok", icono: "check" },
    NoAsistio: { etiqueta: "No asistió", tono: "warn", icono: "alert" },
    Cancelada: { etiqueta: "Cancelada", tono: "neutro", icono: "x" },
  };

  const estado = META_ESTADO[i.estado] ?? {
    etiqueta: i.estado,
    tono: "neutro" as TonoChip,
    icono: "calendar" as const,
  };

  return (
    <li className="flex flex-col justify-between gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tono={estado.tono} icono={estado.icono}>
              {estado.etiqueta}
            </Chip>
            <Chip
              tono="neutro"
              icono={i.paciente.tipo === "Animal" ? "paw" : "user"}
            >
              {i.paciente.nombreCompleto}
            </Chip>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {i.codigoConstancia && (
              <Boton
                variante="secundario"
                tamano="sm"
                onClick={onVerConstancia}
              >
                Ver constancia
              </Boton>
            )}
            {cancelable && (
              <Boton
                variante="peligro"
                tamano="sm"
                onClick={onPedirCancelar}
              >
                Cancelar turno
              </Boton>
            )}
          </div>
        </div>

        <h3 className="mt-3 text-base font-semibold text-ink sm:text-[17px]">
          {i.practica.materiaNombre}
        </h3>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[15px] text-ink-2">
          <span className="font-medium text-ink first-letter:uppercase">
            {formatFechaHoraAR(i.practica.fechaHoraInicio)}
          </span>
          <span className="text-ink-3">·</span>
          <span>{i.practica.lugar}</span>
        </p>

        <p className="mt-1 text-[14px] text-ink-3">
          Con {i.practica.estudianteNombre} ({i.practica.carreraNombre} · {i.practica.institucionNombre})
        </p>

        {i.estado === "Inscripta" && i.practica.requisitosPrevios && (
          <div className="mt-3.5 rounded-control bg-surface-2 p-3 text-[14px] text-ink-2">
            <span className="font-semibold text-ink">Requisitos aceptados: </span>
            <span>{i.practica.requisitosPrevios}</span>
          </div>
        )}

        {i.motivoCancelacion && (
          <p className="mt-3 text-[14px] text-ink-3">
            <span className="font-medium text-ink-2">Motivo de cancelación: </span>
            {i.motivoCancelacion}
          </p>
        )}
      </div>
    </li>
  );
}

function EsqueletoTurno() {
  return (
    <div
      aria-hidden="true"
      className="rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Esqueleto className="h-7 w-24 rounded-pill" />
          <Esqueleto className="h-7 w-28 rounded-pill" />
        </div>
        <Esqueleto className="h-10 w-28 rounded-control" />
      </div>
      <div className="mt-4 space-y-2">
        <Esqueleto className="h-5 w-2/5" />
        <Esqueleto className="h-4 w-3/5" />
        <Esqueleto className="h-3.5 w-1/3" />
      </div>
    </div>
  );
}
