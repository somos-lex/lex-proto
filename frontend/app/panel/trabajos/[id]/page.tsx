"use client";

// Detalle de un trabajo, el mismo para las dos partes: qué sigue y quién lo hace
// (riel y acciones), las sesiones, el pago protegido, lo contratado, quiénes
// participan, las reseñas y el historial. Las acciones las decide el rol de la
// persona en este trabajo, no una "vista".

import { use, useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  esTrabajoClase,
  esTrabajoProyectoCerrado,
  esTrabajoSalud,
  listarHistorialTrabajo,
  obtenerTrabajo,
  type TrabajoDetalleResponse,
  type TrabajoHistorialResponse,
} from "@/lib/trabajos";
import type { RolEnTrabajo } from "@/lib/transicionesTrabajo";
import { ApiError } from "@/lib/api";
import { formatFecha } from "@/lib/servicios";
import { usePendientes } from "@/lib/pendientes";
import { useAuth } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/RequireRole";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { ChipEstadoTrabajo } from "@/components/ds/Chip";
import { Esqueleto, Vacio } from "@/components/ds/Estados";
import { Fila } from "@/components/ds/Lista";
import { PortadaMini } from "@/components/ds/Portada";
import { Precio } from "@/components/ds/Precio";
import { Riel } from "@/components/ds/Riel";
import { AccionesTrabajo, accionesDeZona } from "@/components/AccionesTrabajo";
import { DetalleProyectoCerrado } from "@/components/DetalleProyectoCerrado";
import { DetalleClase } from "@/components/DetalleClase";
import { DetalleSalud, FirmarConsentimiento } from "@/components/DetalleSalud";
import { SesionesLista } from "@/components/SesionesLista";
import { PagoProgreso } from "@/components/PagoProgreso";
import { HistorialTrabajo } from "@/components/HistorialTrabajo";
import { ResenasTrabajo } from "@/components/ResenasTrabajo";
import { Pagina, TituloSeccion } from "@/components/trabajo/Pagina";
import { Toast } from "@/components/trabajo/Toast";
import { mensajeDeError } from "@/components/trabajo/errores";
import { grupoDe, nombreDe, pasosRiel, proximoPaso, rolEn, teToca } from "@/components/trabajo/estado";

export default function TrabajoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireRole roles={["Cliente", "Estudiante"]}>
      <TrabajoDetalle trabajoId={Number(id)} />
    </RequireRole>
  );
}

type Carga =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string; noEncontrado: boolean }
  | { estado: "listo"; trabajo: TrabajoDetalleResponse; historial: TrabajoHistorialResponse[] | null };

async function traer(id: number): Promise<Carga> {
  try {
    const [trabajo, historial] = await Promise.all([
      obtenerTrabajo(id),
      // El historial no frena la página: sin él, el riel se arma con lo que se sabe.
      listarHistorialTrabajo(id).catch(() => null),
    ]);
    return { estado: "listo", trabajo, historial };
  } catch (err) {
    const noEncontrado = err instanceof ApiError && (err.status === 404 || err.status === 403);
    return { estado: "error", mensaje: mensajeDeError(err), noEncontrado };
  }
}

function TrabajoDetalle({ trabajoId }: { trabajoId: number }) {
  const { user } = useAuth();
  const { recargar: recargarPendientes } = usePendientes();
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });
  const [toast, setToast] = useState<string | null>(null);
  // Cambia después de cada acción para que las piezas que cargan solas (pago,
  // sesiones, reseñas) vuelvan a pedir sus datos.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    if (!Number.isInteger(trabajoId) || trabajoId <= 0) {
      Promise.resolve().then(() => vigente && setCarga({ estado: "error", mensaje: "", noEncontrado: true }));
    } else {
      traer(trabajoId).then((c) => vigente && setCarga(c));
    }
    return () => {
      vigente = false;
    };
  }, [trabajoId, version]);

  const reintentar = useCallback(() => {
    setCarga({ estado: "cargando" });
    setVersion((v) => v + 1);
  }, []);

  const alCambiar = useCallback(
    (mensaje: string) => {
      setToast(mensaje);
      setVersion((v) => v + 1);
      void recargarPendientes();
    },
    [recargarPendientes],
  );

  if (carga.estado === "cargando") return <EsqueletoDetalle />;

  if (carga.estado === "error") {
    return (
      <Pagina angosta>
        <VolverA href="/panel/trabajos">Trabajos</VolverA>
        <h1 className="sr-only">{carga.noEncontrado ? "Trabajo no encontrado" : "Trabajo"}</h1>
        {carga.noEncontrado ? (
          <Vacio
            icono="inbox"
            titulo="No encontramos este trabajo"
            className="mt-4"
            acciones={
              <Link href="/panel/trabajos" className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
                Ver mis trabajos
              </Link>
            }
          >
            Puede que el link esté mal o que no participes en él: cada trabajo lo ven solo quien lo contrató y quien lo hace.
          </Vacio>
        ) : (
          <Aviso
            tono="danger"
            titulo="No pudimos cargar el trabajo."
            className="mt-4"
            acciones={
              <Boton variante="secundario" tamano="sm" onClick={reintentar}>
                <Icono nombre="refresh" />
                Reintentar
              </Boton>
            }
          >
            {carga.mensaje}
          </Aviso>
        )}
      </Pagina>
    );
  }

  const { trabajo, historial } = carga;
  const rol = rolEn(trabajo, user?.usuarioId);

  if (!rol) {
    return (
      <Pagina angosta>
        <VolverA href="/panel/trabajos">Trabajos</VolverA>
        <h1 className="sr-only">Trabajo sin acceso</h1>
        <Vacio
          icono="inbox"
          titulo="Este trabajo no es tuyo"
          className="mt-4"
          acciones={
            <Link href="/panel/trabajos" className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
              Ver mis trabajos
            </Link>
          }
        >
          Cada trabajo lo ven solo quien lo contrató y quien lo hace.
        </Vacio>
      </Pagina>
    );
  }

  const nombre = nombreDe(trabajo, rol);
  const tieneSesiones = trabajo.tipo === "Clase" || trabajo.tipo === "Salud";
  const salud = esTrabajoSalud(trabajo) ? trabajo.detalle : null;
  const consentimientoPendiente = !!salud && !salud.consentimientoFirmado;
  const firmaPendienteMia =
    consentimientoPendiente && rol === "Cliente" && (trabajo.estado === "Pendiente" || trabajo.estado === "Aceptado");
  const hayPrincipal = accionesDeZona(trabajo, rol, "principal").length > 0 || firmaPendienteMia;
  const hayProblemas = accionesDeZona(trabajo, rol, "problemas").length > 0;
  const meToca = teToca(trabajo, rol);

  return (
    <>
      <Pagina>
        <VolverA href={`/panel/trabajos?como=${rol === "Cliente" ? "cliente" : "estudiante"}`}>
          {rol === "Cliente" ? "Contrataciones" : "Trabajos recibidos"}
        </VolverA>

        <header className="mt-3 grid grid-cols-[56px_minmax(0,1fr)] items-start gap-x-4 gap-y-3 sm:grid-cols-[56px_minmax(0,1fr)_auto]">
          <PortadaMini tipo={trabajo.tipo} tema={trabajo.tituloSnapshot} tamano={56} />
          <div className="min-w-0">
            <h1 className="text-title-1-mobile text-balance [overflow-wrap:anywhere] lg:text-title-1">{trabajo.tituloSnapshot}</h1>
            <p className="mt-1.5 text-secondary text-ink-2">
              {nombre}.{" "}
              {rol === "Cliente"
                ? `Contrataste a ${trabajo.estudianteNombre} el ${formatFecha(trabajo.fechaCreacion)}.`
                : `Te contrató ${trabajo.clienteNombre} el ${formatFecha(trabajo.fechaCreacion)}.`}
            </p>
          </div>
          <Precio monto={trabajo.precioAcordado} unidad="en total" className="col-start-2 sm:col-start-3 sm:justify-end sm:pt-2" />
        </header>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <div className="contents xl:grid xl:gap-10">
            {/* Próximo paso */}
            <section aria-labelledby="titulo-proximo" className="order-1 xl:order-none">
              <TituloSeccion id="titulo-proximo">Próximo paso</TituloSeccion>
              <div className="grid gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
                <Riel pasos={pasosRiel(trabajo, historial)} etiqueta={`Estado de ${nombre.toLowerCase()}`} />
                <div className="grid justify-items-start gap-1.5">
                  {/* Igual que en la lista: en marcha, el nodo actual ya dice el estado. */}
                  {(grupoDe(trabajo, rol) !== "enMarcha" || trabajo.estado === "Disputa") && (
                    <ChipEstadoTrabajo estado={trabajo.estado} teToca={meToca} />
                  )}
                  <p className="text-base leading-[1.5]">{proximoPaso(trabajo, rol, { consentimientoPendiente })}</p>
                </div>
                {salud && rol === "Estudiante" && trabajo.estado === "Pendiente" && (
                  <Aviso tono="neutro">
                    Antes de aceptar, revisá quién se atiende, el horario y el consentimiento que firmó {trabajo.clienteNombre}.
                  </Aviso>
                )}
                {firmaPendienteMia && salud && <FirmarConsentimiento trabajo={trabajo} detalle={salud} onFirmado={alCambiar} />}
                <AccionesTrabajo key={`p-${version}`} trabajo={trabajo} rolUsuario={rol} zona="principal" onAccionCompletada={alCambiar} />
              </div>
            </section>

            {trabajo.estado === "Completado" && (
              <div className="order-2 xl:order-none">
                <ResenasTrabajo key={`r-${version}`} trabajo={trabajo} onEnviada={alCambiar} />
              </div>
            )}

            {tieneSesiones && (
              <div className="order-3 xl:order-none">
                <SesionesLista key={`s-${version}`} trabajo={trabajo} rolUsuario={rol} conPrimario={!hayPrincipal} onCambio={alCambiar} />
              </div>
            )}

            <section aria-labelledby="titulo-contratado" className="order-5 xl:order-none">
              <TituloSeccion id="titulo-contratado">Lo que se contrató</TituloSeccion>
              <div className="grid gap-5 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
                {trabajo.descripcionSnapshot && (
                  <p className="max-w-[68ch] text-base leading-[1.55] whitespace-pre-line">{trabajo.descripcionSnapshot}</p>
                )}
                {esTrabajoProyectoCerrado(trabajo) && <DetalleProyectoCerrado detalle={trabajo.detalle} />}
                {esTrabajoClase(trabajo) && <DetalleClase detalle={trabajo.detalle} />}
                {esTrabajoSalud(trabajo) && <DetalleSalud trabajo={trabajo} detalle={trabajo.detalle} rolUsuario={rol} />}
              </div>
            </section>

            {historial && (
              <div className="order-7 xl:order-none">
                <HistorialTrabajo
                  historial={historial}
                  miUsuarioId={user?.usuarioId}
                  estudianteId={trabajo.estudianteId}
                  estudianteNombre={trabajo.estudianteNombre}
                  clienteId={trabajo.clienteId}
                  clienteNombre={trabajo.clienteNombre}
                />
              </div>
            )}

            {hayProblemas && (
              <section aria-labelledby="titulo-problemas" className="order-8 xl:order-none">
                <h2 id="titulo-problemas" className="text-title-3">
                  ¿Algo no va bien?
                </h2>
                <p className="mt-1 mb-3 max-w-[62ch] text-secondary text-ink-2">
                  {textoProblemas(trabajo.estado, rol, trabajo.estudianteNombre, trabajo.clienteNombre)}
                </p>
                <AccionesTrabajo key={`x-${version}`} trabajo={trabajo} rolUsuario={rol} zona="problemas" onAccionCompletada={alCambiar} />
              </section>
            )}
          </div>

          <aside aria-label="Pago y participantes" className="contents xl:sticky xl:top-24 xl:grid xl:gap-8">
            <div className="order-4 xl:order-none">
              <PagoProgreso key={`$-${version}`} trabajo={trabajo} rolUsuario={rol} />
            </div>
            <section aria-labelledby="titulo-quienes" className="order-6 xl:order-none">
              <TituloSeccion id="titulo-quienes" como="h2">
                Quiénes
              </TituloSeccion>
              <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
                <Fila
                  icono="cap"
                  titulo={rol === "Estudiante" ? `${trabajo.estudianteNombre} (vos)` : trabajo.estudianteNombre}
                  descripcion="Atiende"
                  href={rol === "Cliente" ? `/estudiantes/${trabajo.estudianteId}` : undefined}
                />
                {salud && (
                  <Fila icono="steth" titulo={salud.supervisorNombreSnapshot} descripcion={`Supervisa. Matrícula ${salud.supervisorMatriculaSnapshot}`} />
                )}
                <Fila
                  icono="user"
                  titulo={rol === "Cliente" ? `${trabajo.clienteNombre} (vos)` : trabajo.clienteNombre}
                  descripcion="Contrató"
                />
              </ul>
            </section>
          </aside>
        </div>
      </Pagina>
      <Toast mensaje={toast} onCerrar={() => setToast(null)} />
    </>
  );
}

function textoProblemas(estado: TrabajoDetalleResponse["estado"], rol: RolEnTrabajo, estudiante: string, cliente: string) {
  const otra = rol === "Cliente" ? estudiante : cliente;
  if (estado === "EnCurso" || estado === "Entregado")
    return `Si no se puede seguir, podés cancelarlo (el pago vuelve a ${rol === "Cliente" ? "vos" : cliente}) o abrir una disputa si no te ponés de acuerdo con ${otra}.`;
  return `Si no se puede hacer, cancelalo: el pago vuelve a ${rol === "Cliente" ? "vos" : cliente}.`;
}

function VolverA({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={clasesBoton({ variante: "texto", tamano: "sm", className: "-ml-3 gap-1 text-ink-2" })}>
      <Icono nombre="chev-r" className="size-5 rotate-180" />
      {children}
    </Link>
  );
}

function EsqueletoDetalle() {
  return (
    <Pagina>
      <div aria-busy="true" aria-label="Cargando el trabajo">
        <Esqueleto className="h-11 w-40" />
        <div className="mt-3 grid grid-cols-[56px_minmax(0,1fr)] gap-4">
          <Esqueleto className="size-14 rounded-button" />
          <div className="grid content-start gap-2.5 pt-1">
            <Esqueleto className="h-8 w-3/4" />
            <Esqueleto className="h-4 w-1/2" />
          </div>
        </div>
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-3">
            <Esqueleto className="h-6 w-36" />
            <div className="grid gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
              <Esqueleto className="h-[42px] w-full" />
              <Esqueleto className="h-7 w-40 rounded-pill" />
              <Esqueleto className="h-4 w-4/5" />
              <Esqueleto className="h-12 w-48 rounded-button" />
            </div>
          </div>
          <div className="grid content-start gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
            <Esqueleto className="h-5 w-32" />
            <Esqueleto className="h-8 w-36" />
            <Esqueleto className="h-2 w-full rounded-pill" />
            <Esqueleto className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    </Pagina>
  );
}
