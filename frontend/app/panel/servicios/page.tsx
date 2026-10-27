"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  listarServicios,
  obtenerServicio,
  eliminarServicioProyectoCerrado,
  eliminarServicioClase,
  eliminarServicioSalud,
  esClase,
  tipoEtiqueta,
  type ServicioResponse,
  type ServicioDetalleResponse,
  type TipoServicio,
} from "@/lib/servicios";
import { obtenerPortafolio, type CarreraPortafolio } from "@/lib/portafolio";
import { useAuth } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/RequireRole";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Cargando, Esqueleto, Vacio } from "@/components/ds/Estados";
import { PortadaMini } from "@/components/ds/Portada";
import { Precio } from "@/components/ds/Precio";
import { Toast } from "@/components/ds/Toast";
import { SelectorVertical } from "@/components/SelectorVertical";
import { ServicioFormProyectoCerrado } from "@/components/ServicioFormProyectoCerrado";
import { ServicioFormClase } from "@/components/ServicioFormClase";
import { ServicioFormSalud } from "@/components/ServicioFormSalud";
import { ErrorDeCarga } from "@/components/panel/Reintentar";
import { mensajeDeError, useCarga } from "@/components/panel/useCarga";

interface MisServiciosDatos {
  servicios: ServicioResponse[];
  /** Detalle de las clases, para saber si son paquete (la unidad del precio). */
  paquetes: Map<number, number | null>;
  anioCursado: number;
  carrerasVerificadas: CarreraPortafolio[];
  carreras: CarreraPortafolio[];
}

// Estado de la hoja: cerrada, la elección de vertical, o un formulario (con o sin servicio a editar).
type ModalState =
  | { tipo: "cerrado" }
  | { tipo: "selector" }
  | { tipo: "form"; vertical: TipoServicio; servicio?: ServicioDetalleResponse };

/** La unidad del precio, con las mismas palabras que el catálogo. */
function unidadDe(tipo: TipoServicio, sesionesPaquete?: number | null) {
  if (tipo === "ProyectoCerrado") return "por proyecto";
  if (tipo === "Salud") return "por sesión";
  return sesionesPaquete ? `por paquete de ${sesionesPaquete} clases` : "por clase";
}

export default function MisServiciosPage() {
  return (
    <RequireRole roles={["Estudiante"]} vista="Estudiante">
      <MisServicios />
    </RequireRole>
  );
}

function MisServicios() {
  const { user } = useAuth();
  const uid = user?.usuarioId ?? null;
  const carga = useCarga<MisServiciosDatos>(uid !== null ? `mis-servicios-${uid}` : null, async () => {
    const [listado, portafolio] = await Promise.all([
      listarServicios({ estudianteId: uid!, pageSize: 100 }),
      obtenerPortafolio(uid!),
    ]);
    const clases = await Promise.all(
      listado.items.filter((s) => s.tipo === "Clase").map((s) => obtenerServicio(s.id).catch(() => null)),
    );
    const paquetes = new Map<number, number | null>();
    for (const c of clases) if (c && esClase(c)) paquetes.set(c.id, c.detalle.esPaquete ? c.detalle.cantidadSesionesPaquete : null);
    return {
      servicios: listado.items,
      paquetes,
      anioCursado: portafolio.anioCursado ?? 0,
      carrerasVerificadas: portafolio.carreras.filter((c) => c.estadoVerificacion === "Verificado"),
      carreras: portafolio.carreras,
    };
  });
  const [modal, setModal] = useState<ModalState>({ tipo: "cerrado" });
  const [abriendoEdicion, setAbriendoEdicion] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ tono: "ok" | "danger"; texto: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const ultimoTrigger = useRef<string | null>(null);

  const datos = carga.datos;
  const puedePublicar = !!datos && datos.carrerasVerificadas.length > 0;

  async function handleEditar(s: ServicioResponse) {
    ultimoTrigger.current = `editar-${s.id}`;
    // El listado trae la base; para precargar el formulario hace falta el detalle por vertical.
    setAbriendoEdicion(s.id);
    setAviso(null);
    try {
      const detalle = await obtenerServicio(s.id);
      setModal({ tipo: "form", vertical: s.tipo, servicio: detalle });
    } catch (err) {
      setAviso({ tono: "danger", texto: `No pudimos abrir "${s.titulo}". ${mensajeDeError(err)}` });
    } finally {
      setAbriendoEdicion(null);
    }
  }

  async function handleBaja(s: ServicioResponse) {
    setAviso(null);
    try {
      await bajaPorVertical(s.tipo, s.id);
      setToast(`Desactivaste "${s.titulo}". Ya no aparece en el catálogo.`);
      carga.recargar();
    } catch (err) {
      setAviso({ tono: "danger", texto: `No pudimos desactivar "${s.titulo}". ${mensajeDeError(err)}` });
    }
  }

  function cerrarModal() {
    const triggerId = ultimoTrigger.current;
    ultimoTrigger.current = null;
    setModal({ tipo: "cerrado" });
    // Si la hoja se abrió desde la elección de vertical o desde un botón específico, devolvemos el foco.
    requestAnimationFrame(() => {
      if (triggerId) {
        document.getElementById(triggerId)?.focus();
      } else if (!document.activeElement || document.activeElement === document.body) {
        document.getElementById("publicar-servicio")?.focus();
      }
    });
  }

  function onExitoForm() {
    const editado = modal.tipo === "form" && modal.servicio;
    setAviso(null);
    setToast(editado ? `Guardaste los cambios de "${modal.servicio!.titulo}".` : "Publicaste tu servicio. Ya aparece en el catálogo con tu credencial.");
    cerrarModal();
    carga.recargar();
  }

  const publicar = (
    <Boton
      id="publicar-servicio"
      onClick={() => {
        setAviso(null);
        setModal({ tipo: "selector" });
      }}
    >
      <Icono nombre="plus" />
      Publicar servicio
    </Boton>
  );

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 pt-6 pb-12 md:px-6 lg:px-8 lg:pt-9">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="max-w-[62ch]">
          <h1 className="text-title-1-mobile text-balance md:text-title-1">Servicios que ofrecés</h1>
          <p className="mt-2 text-[17px] leading-normal text-ink-2 md:text-lead">
            Los servicios que publicás en LEX. Quienes buscan trabajo o clases ven tu perfil con tu carrera verificada y tus
            precios.
          </p>
        </div>
        {puedePublicar && publicar}
      </div>

      {aviso && (
        <Aviso tono={aviso.tono} className="mt-6">
          {aviso.texto}
        </Aviso>
      )}

      <div className="mt-8">
        {carga.cargando ? (
          <Cargando etiqueta="Cargando tus servicios">
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Esqueleto key={i} className="h-[92px] rounded-card" />
              ))}
            </div>
          </Cargando>
        ) : carga.error ? (
          <ErrorDeCarga que="No pudimos cargar tus servicios." motivo={carga.error} onReintentar={carga.reintentar} />
        ) : !datos || !puedePublicar ? (
          <Vacio
            icono="id"
            titulo="Para publicar, LEX tiene que verificar tu carrera"
            acciones={
              <Link href="/panel/perfil" className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
                Ver mi verificación
              </Link>
            }
          >
            {datos && datos.carreras.length > 0
              ? "Tu carrera todavía no está verificada. Cuando lo esté, vas a poder publicar los servicios habilitados para tu carrera y tu año."
              : "Todavía no tenés una carrera cargada."}
          </Vacio>
        ) : datos.servicios.length === 0 ? (
          <Vacio icono="briefcase" titulo="Todavía no publicaste servicios" acciones={publicar}>
            Elegí qué ofrecer: un proyecto cerrado, clases o, si tu carrera lo habilita, un servicio de salud supervisado.
          </Vacio>
        ) : (
          <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
            {datos.servicios.map((s) => (
              <FilaServicio
                key={s.id}
                s={s}
                unidad={unidadDe(s.tipo, datos.paquetes.get(s.id))}
                abriendo={abriendoEdicion === s.id}
                onEditar={() => handleEditar(s)}
                onDesactivar={() => handleBaja(s)}
              />
            ))}
          </ul>
        )}
      </div>

      {datos && uid !== null && datos.servicios.length > 0 && (
        <Link href={`/estudiantes/${uid}`} className={clasesBoton({ variante: "fantasma", tamano: "sm", className: "mt-3" })}>
          Ver cómo te ven en tu perfil público
        </Link>
      )}

      {modal.tipo === "selector" && datos && (
        <SelectorVertical
          carreras={datos.carrerasVerificadas}
          anioCursado={datos.anioCursado}
          onCerrar={cerrarModal}
          onSeleccionar={(vertical) => setModal({ tipo: "form", vertical })}
        />
      )}

      {modal.tipo === "form" && modal.vertical === "ProyectoCerrado" && datos && (
        <ServicioFormProyectoCerrado
          servicio={modal.servicio}
          carreras={datos.carrerasVerificadas}
          anioCursado={datos.anioCursado}
          onCerrar={cerrarModal}
          onExito={onExitoForm}
        />
      )}

      {modal.tipo === "form" && modal.vertical === "Clase" && (
        <ServicioFormClase servicio={modal.servicio} onCerrar={cerrarModal} onExito={onExitoForm} />
      )}

      {modal.tipo === "form" && modal.vertical === "Salud" && datos && (
        <ServicioFormSalud
          servicio={modal.servicio}
          carreras={datos.carrerasVerificadas}
          anioCursado={datos.anioCursado}
          onCerrar={cerrarModal}
          onExito={onExitoForm}
        />
      )}

      <Toast mensaje={toast} onCerrar={() => setToast(null)} conLateral />
    </div>
  );
}

function FilaServicio({
  s,
  unidad,
  abriendo,
  onEditar,
  onDesactivar,
}: {
  s: ServicioResponse;
  unidad: string;
  abriendo: boolean;
  onEditar: () => void;
  onDesactivar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <li className="relative before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-line first:before:hidden">
      <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 gap-3.5">
          <PortadaMini tipo={s.tipo} tema={s.titulo} tamano={64} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-ink-2">{tipoEtiqueta(s.tipo)}</p>
            <Link href={`/servicios/${s.id}`} className="text-title-3 text-ink no-underline [overflow-wrap:anywhere] hover:underline">
              {s.titulo}
            </Link>
            <Precio monto={s.precio} unidad={unidad} className="mt-1" />
          </div>
        </div>
        {confirmando ? (
          <div role="group" aria-label={`Desactivar ${s.titulo}`} className="grid gap-3 rounded-control bg-surface-2 p-3 md:max-w-[340px]">
            <p className="text-[15px] leading-[1.45]">
              <strong className="font-[650]">¿Desactivarlo?</strong> Deja de verse en el catálogo y nadie más lo puede contratar.
            </p>
            <div className="flex flex-wrap gap-2">
              <Boton variante="secundario" tamano="sm" autoFocus onClick={() => setConfirmando(false)}>
                No, dejarlo
              </Boton>
              <Boton
                variante="peligro"
                tamano="sm"
                onClick={() => {
                  setConfirmando(false);
                  onDesactivar();
                }}
              >
                Desactivar
              </Boton>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-md:pl-[78px]">
            <Boton
              id={`editar-${s.id}`}
              variante="secundario"
              tamano="sm"
              onClick={onEditar}
              disabled={abriendo}
              aria-busy={abriendo || undefined}
            >
              {abriendo ? "Abriendo…" : "Editar"}
              <span className="sr-only"> {s.titulo}</span>
            </Boton>
            <Boton variante="texto" tamano="sm" className="text-danger-ink" onClick={() => setConfirmando(true)}>
              Desactivar<span className="sr-only"> {s.titulo}</span>
            </Boton>
          </div>
        )}
      </div>
    </li>
  );
}

function bajaPorVertical(tipo: TipoServicio, id: number): Promise<void> {
  switch (tipo) {
    case "ProyectoCerrado":
      return eliminarServicioProyectoCerrado(id);
    case "Clase":
      return eliminarServicioClase(id);
    case "Salud":
      return eliminarServicioSalud(id);
  }
}
