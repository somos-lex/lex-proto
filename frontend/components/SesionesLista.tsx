"use client";

// Sesiones de una Clase o de un servicio de Salud. Solo el estudiante las marca
// (realizada o no asistió), y marcar libera la parte del pago de esa sesión. La
// marca aparece solo cuando el backend la acepta: con el trabajo Aceptado (la
// primera sesión lo pone en curso) o En curso.

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { relojAR } from "@/lib/fechas";
import { listarSesionesDeTrabajo, marcarSesionNoAsistio, marcarSesionRealizada, type SesionResponse } from "@/lib/sesiones";
import type { TrabajoResponse } from "@/lib/trabajos";
import type { RolEnTrabajo } from "@/lib/transicionesTrabajo";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Esqueleto } from "@/components/ds/Estados";
import { Tesela } from "@/components/ds/Lista";
import EstadoSesionBadge from "@/components/EstadoSesionBadge";
import { Field, Textarea } from "@/components/ui";
import { Dialogo } from "@/components/trabajo/Dialogo";
import { mensajeDeError } from "@/components/trabajo/errores";
import { TituloSeccion } from "@/components/trabajo/Pagina";

type Marca = "realizar" | "no-asistio";

const SESIONES_A_LA_VISTA = 3;

/** "Jueves 23 de julio a las 10:00". */
function cuando(iso: string) {
  const t = format(relojAR(iso), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function linkSeguro(valor: string | null) {
  if (!valor) return null;
  try {
    const u = new URL(valor);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

export function SesionesLista({
  trabajo,
  rolUsuario,
  conPrimario,
  onCambio,
}: {
  trabajo: TrabajoResponse;
  rolUsuario: RolEnTrabajo;
  /** Si marcar la sesión es la acción principal de la pantalla (no hay otro primario). */
  conPrimario: boolean;
  /** Recibe el mensaje de éxito para el toast. */
  onCambio: (mensaje: string) => void;
}) {
  const [sesiones, setSesiones] = useState<SesionResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [marcando, setMarcando] = useState<{ sesion: SesionResponse; marca: Marca } | null>(null);
  const [todas, setTodas] = useState(false);
  const trabajoId = trabajo.id;

  const cargar = useCallback(() => {
    setError(null);
    setSesiones(null);
    listarSesionesDeTrabajo(trabajoId)
      .then(setSesiones)
      .catch((err) => setError(mensajeDeError(err)));
  }, [trabajoId]);

  useEffect(() => {
    let vigente = true;
    listarSesionesDeTrabajo(trabajoId)
      .then((s) => vigente && setSesiones(s))
      .catch((err) => vigente && setError(mensajeDeError(err)));
    return () => {
      vigente = false;
    };
  }, [trabajoId]);

  const titulo = <TituloSeccion id="titulo-sesiones">Sesiones</TituloSeccion>;

  if (error) {
    return (
      <section aria-labelledby="titulo-sesiones">
        {titulo}
        <Aviso
          tono="danger"
          titulo="No pudimos cargar las sesiones."
          acciones={
            <Boton variante="secundario" tamano="sm" onClick={cargar}>
              <Icono nombre="refresh" />
              Reintentar
            </Boton>
          }
        >
          {error}
        </Aviso>
      </section>
    );
  }

  if (sesiones === null) {
    return (
      <section aria-labelledby="titulo-sesiones" aria-busy="true">
        {titulo}
        <span className="sr-only">Cargando las sesiones</span>
        <div className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
          {[0, 1].map((i) => (
            <div key={i} className={`flex items-center gap-3.5 px-4 py-3 ${i ? "border-t border-line" : ""}`}>
              <Esqueleto className="size-11 rounded-control" />
              <div className="grid flex-1 gap-2">
                <Esqueleto className="h-4 w-24" />
                <Esqueleto className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (sesiones.length === 0) return null;

  const hechas = sesiones.filter((s) => s.estado === "Realizada" || s.estado === "NoAsistio").length;
  const sePuedeMarcar = rolUsuario === "Estudiante" && (trabajo.estado === "Aceptado" || trabajo.estado === "EnCurso");
  const ordenadas = [...sesiones].sort((a, b) => a.numeroSesion - b.numeroSesion);
  // Un paquete largo se acorta: las primeras y todas las que faltan marcar.
  const visibles = todas ? ordenadas : ordenadas.filter((s, i) => i < SESIONES_A_LA_VISTA || s.estado === "Pendiente");

  return (
    <section aria-labelledby="titulo-sesiones">
      <TituloSeccion
        id="titulo-sesiones"
        fin={
          <span className="text-[15px] text-ink-2">
            {hechas} de {sesiones.length} {sesiones.length === 1 ? "marcada" : "marcadas"}
          </span>
        }
      >
        Sesiones
      </TituloSeccion>
      <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
        {visibles.map((s) => {
          const puedeMarcar = sePuedeMarcar && s.estado === "Pendiente";
          const video = linkSeguro(s.linkVideollamada);
          return (
            <li key={s.id} className="relative px-4 py-3 before:absolute before:top-0 before:right-0 before:left-[74px] before:h-px before:bg-line first:before:hidden">
              <div className="flex min-h-10 items-center gap-3.5">
                <Tesela icono="calendar" />
                <div className="min-w-0 flex-1">
                  <p className="text-base leading-[1.35] font-semibold">Sesión {s.numeroSesion}</p>
                  <p className="text-secondary text-ink-2">
                    {cuando(s.fechaHoraInicio)}, {s.duracionMinutos} min
                  </p>
                </div>
                <span className="shrink-0 max-sm:hidden">
                  <EstadoSesionBadge estado={s.estado} />
                </span>
              </div>
              <div className="mt-2 grid gap-2 pl-[58px]">
                <span className="sm:hidden">
                  <EstadoSesionBadge estado={s.estado} />
                </span>
                {s.observaciones && <p className="text-secondary text-ink-2">{s.observaciones}</p>}
                {(video || puedeMarcar) && (
                  <div className="flex flex-wrap gap-2">
                    {video && s.estado === "Pendiente" && (
                      <a href={video} target="_blank" rel="noopener noreferrer" className={clasesBoton({ variante: "fantasma", tamano: "sm" })}>
                        Entrar a la videollamada
                        <span className="sr-only"> (se abre en otra pestaña)</span>
                      </a>
                    )}
                    {puedeMarcar && (
                      <>
                        <Boton variante={conPrimario ? "primario" : "secundario"} tamano="sm" onClick={() => setMarcando({ sesion: s, marca: "realizar" })}>
                          Marcar realizada
                        </Boton>
                        <Boton variante="tonal" tamano="sm" onClick={() => setMarcando({ sesion: s, marca: "no-asistio" })}>
                          No asistió
                        </Boton>
                      </>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {visibles.length < ordenadas.length || todas ? (
        <div className="mt-2">
          <Boton variante="fantasma" tamano="sm" onClick={() => setTodas((v) => !v)} aria-expanded={todas}>
            {todas ? "Ver menos" : `Ver las ${ordenadas.length} sesiones`}
          </Boton>
        </div>
      ) : null}

      <MarcarDialogo
        marcando={marcando}
        onCerrar={() => setMarcando(null)}
        onExito={(mensaje) => {
          setMarcando(null);
          cargar();
          onCambio(mensaje);
        }}
      />
    </section>
  );
}

function MarcarDialogo({
  marcando,
  onCerrar,
  onExito,
}: {
  marcando: { sesion: SesionResponse; marca: Marca } | null;
  onCerrar: () => void;
  onExito: (mensaje: string) => void;
}) {
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abiertoPara, setAbiertoPara] = useState<number | null>(null);

  // Al abrir para otra sesión, el formulario arranca limpio.
  const clave = marcando ? marcando.sesion.id * 2 + (marcando.marca === "realizar" ? 0 : 1) : null;
  if (clave !== abiertoPara) {
    setAbiertoPara(clave);
    setObservaciones("");
    setError(null);
  }

  const esRealizar = marcando?.marca === "realizar";
  const n = marcando?.sesion.numeroSesion;

  async function confirmar() {
    if (!marcando || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const obs = observaciones.trim() || undefined;
      if (esRealizar) await marcarSesionRealizada(marcando.sesion.id, obs);
      else await marcarSesionNoAsistio(marcando.sesion.id, obs);
      onExito(esRealizar ? `Marcaste la sesión ${n} como realizada.` : `Registraste que no asistió a la sesión ${n}.`);
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos marcar la sesión. Revisá tu conexión y probá de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  const idObs = `obs-sesion-${marcando?.sesion.id ?? 0}`;
  return (
    <Dialogo
      abierto={marcando !== null}
      onCerrar={onCerrar}
      titulo={esRealizar ? `¿Marcás la sesión ${n} como realizada?` : `¿Registrás que no asistió a la sesión ${n}?`}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} className="max-sm:w-full">
            Volver
          </Boton>
          <Boton onClick={confirmar} aria-busy={enviando || undefined} aria-disabled={enviando || undefined} className="max-sm:w-full">
            {enviando ? "Guardando…" : esRealizar ? "Marcar realizada" : "Registrar inasistencia"}
          </Boton>
        </>
      }
    >
      {marcando && <p className="font-medium text-ink">{cuando(marcando.sesion.fechaHoraInicio)}</p>}
      <p>
        {esRealizar
          ? "Al marcarla, LEX te paga la parte del pago que corresponde a esta sesión."
          : "La parte del pago de esta sesión se libera igual: reservaste el horario y pusiste tu tiempo."}
      </p>
      {error && (
        <Aviso tono="danger" titulo="No se pudo marcar.">
          {error}
        </Aviso>
      )}
      <Field label="Observaciones (opcional)" htmlFor={idObs}>
        <Textarea id={idObs} rows={3} maxLength={1000} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </Field>
    </Dialogo>
  );
}
