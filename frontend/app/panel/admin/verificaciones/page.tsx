"use client";

// Bandeja de verificación institucional (solo Admin).
//
// Sin esta pantalla ningún estudiante real puede publicar: el vínculo con la
// carrera nace Pendiente y tanto los servicios como las prácticas clínicas
// exigen al menos una carrera Verificada.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  aprobarVerificacion,
  listarVerificacionesPendientes,
  rechazarVerificacion,
  type VerificacionPendiente,
} from "@/lib/verificaciones";
import { ApiError } from "@/lib/api";
import { RequireRole } from "@/components/RequireRole";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Dialogo } from "@/components/ds/Dialogo";
import { Cargando, Esqueleto, Vacio } from "@/components/ds/Estados";
import { Toast } from "@/components/ds/Toast";
import { Field, Textarea } from "@/components/ui";
import { EncabezadoPagina, Pagina } from "@/components/trabajo/Pagina";

export default function VerificacionesPage() {
  return (
    <RequireRole roles={["Admin"]}>
      <Verificaciones />
    </RequireRole>
  );
}

function claveDe(v: VerificacionPendiente) {
  return `${v.estudianteId}-${v.carreraId}`;
}

function Verificaciones() {
  const [pendientes, setPendientes] = useState<VerificacionPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarVerificacionesPendientes()
      .then((data) => {
        if (!cancelado) {
          setPendientes(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar las verificaciones pendientes.",
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

  function quitar(v: VerificacionPendiente, accion: "aprobada" | "rechazada") {
    setPendientes((actuales) => actuales.filter((p) => claveDe(p) !== claveDe(v)));
    setToast(
      accion === "aprobada"
        ? `Se aprobó la verificación de ${v.estudianteNombre}.`
        : `Se rechazó la verificación de ${v.estudianteNombre}.`,
    );
  }

  return (
    <Pagina>
      <EncabezadoPagina
        titulo="Verificaciones pendientes"
        bajada="Vínculos estudiante–carrera esperando validación institucional, los más antiguos primero."
        antes={
          <div className="mb-2">
            <Link
              href="/panel/admin"
              className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink-2 hover:text-ink"
            >
              <Icono nombre="chev-r" className="size-4 rotate-180" />
              <span>Volver a ingresos</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mt-6">
          <Aviso
            tono="danger"
            titulo="No pudimos cargar las verificaciones"
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
          <Cargando etiqueta="Cargando verificaciones pendientes">
            <div className="space-y-4">
              <EsqueletoVerificacion />
              <EsqueletoVerificacion />
              <EsqueletoVerificacion />
            </div>
          </Cargando>
        ) : pendientes.length === 0 && !error ? (
          <Vacio
            icono="id"
            titulo="No hay verificaciones pendientes"
            acciones={
              <Link
                href="/panel/admin"
                className={clasesBoton({ variante: "secundario" })}
              >
                Volver al panel de ingresos
              </Link>
            }
          >
            Todas las solicitudes de acreditación institucional fueron procesadas.
          </Vacio>
        ) : (
          <ul className="space-y-4">
            {pendientes.map((v) => (
              <TarjetaVerificacion
                key={claveDe(v)}
                verificacion={v}
                onResuelta={(accion) => quitar(v, accion)}
              />
            ))}
          </ul>
        )}
      </div>

      <Toast mensaje={toast} onCerrar={() => setToast(null)} conLateral />
    </Pagina>
  );
}

function Comprobante({ valor }: { valor: string | null }) {
  if (!valor) {
    return (
      <div className="mt-3 flex items-center gap-1.5 text-[14px] text-warn-ink">
        <Icono nombre="alert" className="size-4 text-warn-ink" />
        <span>Sin comprobante cargado: al aprobar es obligatorio registrar cómo se verificó.</span>
      </div>
    );
  }

  let url: URL | null = null;
  try {
    url = new URL(valor);
  } catch {
    url = null;
  }

  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) {
    return (
      <p className="mt-2 break-all text-[14px] text-ink-2">
        Comprobante (enlace no navegable): <span className="font-mono text-ink">{valor}</span>
      </p>
    );
  }

  return (
    <a
      href={url.href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-2 rounded-control bg-surface-2 px-3.5 py-2 text-[14px] font-semibold text-ink shadow-[0_0_0_1px_var(--color-line)] transition-colors hover:bg-surface-3"
    >
      <Icono nombre="file-check" className="size-4 text-accent" />
      <span>Abrir comprobante</span>
      <span className="font-normal text-ink-3">({url.hostname})</span>
      <Icono nombre="chev-r" className="size-3.5 -rotate-45 text-ink-3" />
    </a>
  );
}

function TarjetaVerificacion({
  verificacion: v,
  onResuelta,
}: {
  verificacion: VerificacionPendiente;
  onResuelta: (accion: "aprobada" | "rechazada") => void;
}) {
  const [dialogo, setDialogo] = useState<"aprobar" | "rechazar" | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sinComprobante = !v.documentoComprobante?.trim();
  const observacionesObligatorias = dialogo === "aprobar" && sinComprobante;

  async function confirmar() {
    if (dialogo === "rechazar" && !texto.trim()) {
      setError("El motivo del rechazo es obligatorio.");
      return;
    }
    if (observacionesObligatorias && !texto.trim()) {
      setError(
        "El estudiante no cargó comprobante: para aprobar, escribí cómo verificaste el vínculo.",
      );
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      if (dialogo === "aprobar") {
        await aprobarVerificacion(v.estudianteId, v.carreraId, texto);
        onResuelta("aprobada");
      } else {
        await rechazarVerificacion(v.estudianteId, v.carreraId, texto.trim());
        onResuelta("rechazada");
      }
      setDialogo(null);
      setTexto("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo resolver la verificación. Probá de nuevo.",
      );
      setEnviando(false);
    }
  }

  return (
    <li className="flex flex-col justify-between gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink sm:text-[17px]">
              {v.estudianteNombre}
            </h2>
            <p className="text-[14px] text-ink-2">{v.estudianteEmail}</p>
            <p className="mt-2 text-[15px] font-medium text-ink">
              {v.carreraNombre} · {v.institucionNombre}
              {v.anioCursado != null && <> · {v.anioCursado}° año</>}
            </p>
            <Comprobante valor={v.documentoComprobante} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Boton
              onClick={() => {
                setDialogo("aprobar");
                setTexto("");
                setError(null);
              }}
            >
              Aprobar
            </Boton>
            <Boton
              variante="peligro"
              onClick={() => {
                setDialogo("rechazar");
                setTexto("");
                setError(null);
              }}
            >
              Rechazar
            </Boton>
          </div>
        </div>
      </div>

      {/* Diálogo modal accesible para resolver la verificación */}
      {dialogo && (
        <Dialogo
          abierto={true}
          onCerrar={() => {
            if (!enviando) {
              setDialogo(null);
              setTexto("");
              setError(null);
            }
          }}
          titulo={
            dialogo === "aprobar"
              ? `Aprobar verificación de ${v.estudianteNombre}`
              : `Rechazar verificación de ${v.estudianteNombre}`
          }
          pie={
            <>
              <Boton
                variante="secundario"
                onClick={() => setDialogo(null)}
                disabled={enviando}
              >
                Volver
              </Boton>
              <Boton
                variante={dialogo === "aprobar" ? "primario" : "peligro"}
                onClick={confirmar}
                disabled={enviando}
              >
                {enviando
                  ? "Guardando…"
                  : dialogo === "aprobar"
                    ? "Confirmar aprobación"
                    : "Confirmar rechazo"}
              </Boton>
            </>
          }
        >
          <div className="grid gap-4">
            <p className="text-[15px] text-ink-2">
              {dialogo === "aprobar"
                ? `Al confirmar, ${v.estudianteNombre} quedará verificado/a institucionalmente en ${v.carreraNombre} y podrá publicar servicios y prácticas clínicas.`
                : `Indicá el motivo del rechazo para que ${v.estudianteNombre} sepa qué corregir en su constancia.`}
            </p>

            <Field
              label={
                dialogo === "rechazar"
                  ? "Motivo del rechazo"
                  : observacionesObligatorias
                    ? "¿Cómo verificaste el vínculo? (obligatorio: no hay comprobante)"
                    : "Observaciones (opcional)"
              }
              htmlFor={`texto-dialogo-${v.estudianteId}-${v.carreraId}`}
              ayuda={
                dialogo === "rechazar"
                  ? "Un rechazo no es definitivo: si el estudiante reenvía el comprobante, se puede revisar de nuevo."
                  : undefined
              }
            >
              <Textarea
                id={`texto-dialogo-${v.estudianteId}-${v.carreraId}`}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={
                  dialogo === "rechazar"
                    ? "Ej: la foto de la constancia no es legible; por favor reenviala con mejor definición."
                    : observacionesObligatorias
                      ? "Ej: constancia de alumno regular en papel constatada en la secretaría académica."
                      : "Ej: constancia de alumno regular vigente validada."
                }
              />
            </Field>

            {error && (
              <Aviso tono="danger" titulo="Revisá el formulario">
                {error}
              </Aviso>
            )}
          </div>
        </Dialogo>
      )}
    </li>
  );
}

function EsqueletoVerificacion() {
  return (
    <div
      aria-hidden="true"
      className="rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Esqueleto className="h-5 w-40" />
          <Esqueleto className="h-4 w-32" />
          <Esqueleto className="h-4 w-56" />
          <Esqueleto className="h-9 w-36 rounded-control" />
        </div>
        <div className="flex gap-2">
          <Esqueleto className="h-11 w-24 rounded-button" />
          <Esqueleto className="h-11 w-24 rounded-button" />
        </div>
      </div>
    </div>
  );
}
