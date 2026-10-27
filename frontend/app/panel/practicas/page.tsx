"use client";

// Turnos que publico: los turnos del Banco de Turnos del estudiante. Publicar,
// ver quién se inscribió, registrar la asistencia (que emite la constancia) y
// cancelar. Primero lo que pide acción.

import { useState } from "react";
import Link from "next/link";
import {
  cancelarInscripcion,
  cancelarPractica,
  formatHoraAR,
  listarMisPracticas,
  registrarAsistencia,
  type EstadoPractica,
  type PracticaDetalle,
} from "@/lib/practicas";
import { useAhora } from "@/lib/useAhora";
import { RequireRole } from "@/components/RequireRole";
import { Boton } from "@/components/Boton";
import { Icono, type NombreIcono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Cargando, Esqueleto, Vacio } from "@/components/ds/Estados";
import { Toast } from "@/components/ds/Toast";
import { Field, Textarea } from "@/components/ui";
import { EstadoPracticaBadge, TipoPacienteBadge } from "@/components/practicas/Badges";
import { PublicarPracticaForm } from "@/components/practicas/PublicarPracticaForm";
import { ConstanciaModal } from "@/components/practicas/ConstanciaModal";
import { ErrorDeCarga } from "@/components/panel/Reintentar";
import { mensajeDeError, useCarga } from "@/components/panel/useCarga";

const SECCIONES: { estado: EstadoPractica; titulo: string }[] = [
  { estado: "Cubierta", titulo: "Con paciente" },
  { estado: "Publicada", titulo: "Buscando paciente" },
  { estado: "Realizada", titulo: "Realizados" },
  { estado: "Vencida", titulo: "Vencidos sin paciente" },
  { estado: "Cancelada", titulo: "Cancelados" },
];

const fechaDia = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  weekday: "long",
  day: "numeric",
  month: "long",
});

function dia(iso: string) {
  const t = fechaDia.format(new Date(iso)).replace(",", "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function MisPracticasPage() {
  return (
    <RequireRole roles={["Estudiante"]} vista="Estudiante">
      <MisPracticas />
    </RequireRole>
  );
}

function MisPracticas() {
  const carga = useCarga("mis-turnos", () => listarMisPracticas());
  const [formAbierto, setFormAbierto] = useState(false);
  const [constanciaDe, setConstanciaDe] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const practicas = (carga.datos ?? []).toSorted((a, b) => a.practica.fechaHoraInicio.localeCompare(b.practica.fechaHoraInicio));

  const publicar = (
    <Boton
      onClick={() => {
        setFormAbierto(true);
      }}
    >
      <Icono nombre="plus" />
      Publicar un turno
    </Boton>
  );

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 pt-6 pb-12 md:px-6 lg:px-8 lg:pt-9">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="max-w-[62ch]">
          <h1 className="text-title-1-mobile text-balance md:text-title-1">Turnos que publico</h1>
          <p className="mt-2 text-[17px] leading-normal text-ink-2 md:text-lead">
            Tus turnos del Banco de Turnos: cuando una materia necesita un paciente, publicás el turno y quien se inscribe se atiende
            sin costo.
          </p>
        </div>
        {practicas.length > 0 && publicar}
      </div>

      <div className="mt-8">
        {carga.cargando ? (
          <Cargando etiqueta="Cargando tus turnos">
            <Esqueleto className="mx-1 mb-2 h-4 w-32" />
            <div className="grid gap-4 rounded-card bg-surface p-4 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
              {[0, 1].map((i) => (
                <div key={i} className="grid grid-cols-[56px_minmax(0,1fr)] gap-3.5">
                  <Esqueleto className="h-6 w-14" />
                  <div className="grid gap-2.5">
                    <Esqueleto className="h-4 w-3/5" />
                    <Esqueleto className="h-3.5 w-4/5" />
                    <Esqueleto className="h-3.5 w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          </Cargando>
        ) : carga.error ? (
          <ErrorDeCarga que="No pudimos cargar tus turnos." motivo={carga.error} onReintentar={carga.reintentar} />
        ) : practicas.length === 0 ? (
          <Vacio icono="calendar-plus" titulo="Todavía no publicaste turnos" acciones={publicar}>
            Elegí una materia de tu carrera, la fecha y el lugar. Quien necesita atenderse se inscribe sin costo, y al registrar la
            asistencia LEX emite la constancia.
          </Vacio>
        ) : (
          <div className="grid gap-8">
            {SECCIONES.map(({ estado, titulo }) => {
              const delEstado = practicas.filter((p) => p.practica.estado === estado);
              if (delEstado.length === 0) return null;
              return (
                <section key={estado} aria-labelledby={`sec-${estado}`}>
                  <h2 id={`sec-${estado}`} className="mx-1 mb-2 text-[15px] font-semibold text-ink-2">
                    {titulo} ({delEstado.length})
                  </h2>
                  <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
                    {delEstado.map((p) => (
                      <TurnoPropio
                        key={p.practica.id}
                        detalle={p}
                        onCambio={(texto) => {
                          setToast(texto);
                          carga.recargar();
                        }}
                        onVerConstancia={() => setConstanciaDe(p.practica.id)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {formAbierto && (
        <PublicarPracticaForm
          onCerrar={() => setFormAbierto(false)}
          onPublicada={(p) => {
            setFormAbierto(false);
            setToast(`Publicaste el turno de ${p.practica.materiaNombre}. Ya aparece en el Banco de Turnos.`);
            carga.recargar();
          }}
        />
      )}

      {constanciaDe !== null && <ConstanciaModal practicaId={constanciaDe} onCerrar={() => setConstanciaDe(null)} />}

      <Toast mensaje={toast} onCerrar={() => setToast(null)} conLateral />
    </div>
  );
}

type Accion = "ninguna" | "asistencia" | "cancelarPractica" | "rechazarPaciente";

function Dato({ icono, children }: { icono: NombreIcono; children: React.ReactNode }) {
  return (
    <p className="grid grid-cols-[18px_minmax(0,1fr)] gap-2 text-[15px] leading-[1.4] text-ink">
      <Icono nombre={icono} className="mt-px size-[18px] text-ink-2" />
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </p>
  );
}

function TurnoPropio({
  detalle,
  onCambio,
  onVerConstancia,
}: {
  detalle: PracticaDetalle;
  onCambio: (exito: string) => void;
  onVerConstancia: () => void;
}) {
  const ahora = useAhora();
  const p = detalle.practica;
  const inscripcion = detalle.inscripcion;

  const [accion, setAccion] = useState<Accion>("ninguna");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La asistencia solo se puede marcar cuando el turno ya empezó o pasó.
  const yaEmpezo = ahora !== null && ahora >= new Date(p.fechaHoraInicio).getTime();

  const acciones: React.ReactNode[] = [];
  if (p.estado === "Cubierta") {
    acciones.push(
      <Boton
        key="asistencia"
        tamano="sm"
        disabled={!yaEmpezo}
        aria-describedby={!yaEmpezo ? `espera-${p.id}` : undefined}
        onClick={() => {
          setAccion("asistencia");
          setError(null);
        }}
      >
        Registrar asistencia<span className="sr-only"> del turno de {p.materiaNombre}</span>
      </Boton>,
    );
    acciones.push(
      <Boton
        key="rechazar"
        variante="secundario"
        tamano="sm"
        onClick={() => {
          setAccion("rechazarPaciente");
          setError(null);
        }}
      >
        Rechazar paciente<span className="sr-only"> del turno de {p.materiaNombre}</span>
      </Boton>,
    );
  }
  if (p.estado === "Publicada") {
    acciones.push(
      <Boton
        key="cancelar"
        variante="texto"
        tamano="sm"
        className="text-danger-ink"
        onClick={() => {
          setAccion("cancelarPractica");
          setError(null);
        }}
      >
        Cancelar turno<span className="sr-only"> de {p.materiaNombre}</span>
      </Boton>,
    );
  }
  if (p.estado === "Realizada") {
    acciones.push(
      <Boton key="constancia" variante="secundario" tamano="sm" onClick={onVerConstancia}>
        Ver constancia<span className="sr-only"> del turno de {p.materiaNombre}</span>
      </Boton>,
    );
  }

  async function ejecutar(fn: () => Promise<unknown>, mensajeOk: string) {
    setEnviando(true);
    setError(null);
    try {
      await fn();
      setAccion("ninguna");
      setTexto("");
      onCambio(mensajeOk);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <li className="relative before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-line first:before:hidden">
      <article aria-labelledby={`turno-${p.id}`} className="grid gap-3 p-4 md:grid-cols-[80px_minmax(0,1fr)] md:items-start md:gap-4">
        <div className="flex items-center gap-2 md:flex-col md:items-start">
          <time dateTime={p.fechaHoraInicio} className="text-title-3 font-semibold text-ink">
            {formatHoraAR(p.fechaHoraInicio)}
          </time>
          <span className="text-[14px] text-ink-2">{p.duracionMinutos} min</span>
        </div>

        <div className="grid min-w-0 gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoPracticaBadge estado={p.estado} />
            <TipoPacienteBadge tipo={p.tipoPacienteRequerido} />
          </div>
          <h3 id={`turno-${p.id}`} className="text-title-3">
            <Link href={`/practicas/${p.id}`} className="text-ink no-underline hover:underline">
              {p.materiaNombre}
            </Link>
          </h3>
          <div className="grid gap-1.5">
            <Dato icono="calendar">{dia(p.fechaHoraInicio)}</Dato>
            <Dato icono="pin">{p.lugar}</Dato>
            {detalle.motivoCancelacion && <Dato icono="info">Motivo de la cancelación: {detalle.motivoCancelacion}</Dato>}
          </div>

          {inscripcion && (
            <div className="grid gap-1 rounded-control bg-surface-2 px-4 py-3 text-[15px] leading-[1.45]">
              <p className="font-semibold text-ink">
                {inscripcion.paciente.nombreCompleto}
                {inscripcion.paciente.especie &&
                  ` (${inscripcion.paciente.especie}${inscripcion.paciente.raza ? `, ${inscripcion.paciente.raza}` : ""})`}
              </p>
              <p className="text-ink-2">Lo inscribió {inscripcion.clienteNombre}.</p>
              {inscripcion.paciente.notasRelevantes && <p className="text-ink-2">Notas: {inscripcion.paciente.notasRelevantes}</p>}
              {inscripcion.paciente.contactoEmergenciaNombre && (
                <p className="text-ink-2">
                  Contacto de emergencia: {inscripcion.paciente.contactoEmergenciaNombre}
                  {inscripcion.paciente.contactoEmergenciaTelefono && `, ${inscripcion.paciente.contactoEmergenciaTelefono}`}
                </p>
              )}
            </div>
          )}

          {p.estado === "Cubierta" && !yaEmpezo && ahora !== null && (
            <p id={`espera-${p.id}`} className="text-[14px] text-ink-2">
              La asistencia se registra desde la hora del turno: una constancia emitida antes no sirve como evidencia ante la cátedra.
            </p>
          )}

          {accion === "ninguna" ? (
            acciones.length > 0 && <div className="flex flex-wrap gap-2 pt-1">{acciones}</div>
          ) : (
            <div role="group" aria-labelledby={`accion-${p.id}`} className="mt-1 grid gap-3 rounded-control bg-surface-2 p-4">
              <p id={`accion-${p.id}`} className="font-semibold">
                {accion === "asistencia"
                  ? "¿Vino el paciente?"
                  : accion === "rechazarPaciente"
                    ? "¿Rechazar al paciente? El turno vuelve a buscar paciente."
                    : "¿Cancelar el turno? Deja de verse en el Banco."}
              </p>
              <Field label={accion === "asistencia" ? "Observaciones (opcional)" : "Motivo (opcional)"} htmlFor={`texto-${p.id}`}>
                <Textarea
                  id={`texto-${p.id}`}
                  rows={2}
                  maxLength={accion === "asistencia" ? 2000 : 1000}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  autoFocus
                />
              </Field>
              {error && <Aviso tono="danger">{error}</Aviso>}
              <div className="flex flex-wrap gap-2">
                {accion === "asistencia" && (
                  <>
                    <Boton
                      tamano="sm"
                      disabled={enviando}
                      onClick={() => ejecutar(() => registrarAsistencia(p.id, true, texto), `Registraste que el paciente vino al turno de ${p.materiaNombre}. La constancia ya está emitida.`)}
                    >
                      Sí, vino
                    </Boton>
                    <Boton
                      variante="secundario"
                      tamano="sm"
                      disabled={enviando}
                      onClick={() => ejecutar(() => registrarAsistencia(p.id, false, texto), `Registraste que el paciente no vino al turno de ${p.materiaNombre}.`)}
                    >
                      No se presentó
                    </Boton>
                  </>
                )}
                {accion === "rechazarPaciente" && inscripcion && (
                  <Boton
                    variante="peligro"
                    tamano="sm"
                    disabled={enviando}
                    onClick={() => ejecutar(() => cancelarInscripcion(inscripcion.id, texto), `Rechazaste al paciente. El turno de ${p.materiaNombre} vuelve a buscar paciente.`)}
                  >
                    Rechazar paciente
                  </Boton>
                )}
                {accion === "cancelarPractica" && (
                  <Boton
                    variante="peligro"
                    tamano="sm"
                    disabled={enviando}
                    onClick={() => ejecutar(() => cancelarPractica(p.id, texto), `Cancelaste el turno de ${p.materiaNombre}.`)}
                  >
                    Cancelar turno
                  </Boton>
                )}
                <Boton
                  variante="texto"
                  tamano="sm"
                  disabled={enviando}
                  onClick={() => {
                    setAccion("ninguna");
                    setError(null);
                  }}
                >
                  Volver
                </Boton>
              </div>
            </div>
          )}
        </div>
      </article>
    </li>
  );
}
