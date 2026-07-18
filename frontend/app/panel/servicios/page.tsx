"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listarServicios,
  obtenerServicio,
  eliminarServicioProyectoCerrado,
  eliminarServicioClase,
  eliminarServicioSalud,
  formatPrecio,
  type ServicioResponse,
  type ServicioDetalleResponse,
  type TipoServicio,
} from "@/lib/servicios";
import { obtenerPortafolio, type CarreraPortafolio } from "@/lib/portafolio";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/RequireRole";
import { TipoBadge } from "@/components/TipoBadge";
import { SelectorVertical } from "@/components/SelectorVertical";
import { ServicioFormProyectoCerrado } from "@/components/ServicioFormProyectoCerrado";
import { ServicioFormClase } from "@/components/ServicioFormClase";
import { ServicioFormSalud } from "@/components/ServicioFormSalud";
import { ErrorAlert } from "@/components/ui";

interface EstudianteContexto {
  anioCursado: number;
  carrerasVerificadas: CarreraPortafolio[];
}

// Estado del modal: cerrado, el selector de vertical, o un form (con o sin servicio a editar).
type ModalState =
  | { tipo: "cerrado" }
  | { tipo: "selector" }
  | { tipo: "form"; vertical: TipoServicio; servicio?: ServicioDetalleResponse };

export default function MisServiciosPage() {
  return (
    <RequireRole roles={["Estudiante"]} vista="Estudiante">
      <MisServicios />
    </RequireRole>
  );
}

function MisServicios() {
  const { user } = useAuth();
  const [servicios, setServicios] = useState<ServicioResponse[]>([]);
  const [contexto, setContexto] = useState<EstudianteContexto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ tipo: "cerrado" });
  const [abriendoEdicion, setAbriendoEdicion] = useState<number | null>(null);
  const [bajaId, setBajaId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [listado, portafolio] = await Promise.all([
        listarServicios({ estudianteId: user.usuarioId, pageSize: 100 }),
        obtenerPortafolio(user.usuarioId),
      ]);
      setServicios(listado.items);
      setContexto({
        anioCursado: portafolio.anioCursado ?? 0,
        carrerasVerificadas: portafolio.carreras.filter(
          (c) => c.estadoVerificacion === "Verificado",
        ),
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No pudimos cargar tus servicios.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleEditar(s: ServicioResponse) {
    // El listado trae la base; para precargar el form necesitamos el detalle por vertical.
    setAbriendoEdicion(s.id);
    setError(null);
    try {
      const detalle = await obtenerServicio(s.id);
      setModal({ tipo: "form", vertical: s.tipo, servicio: detalle });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No pudimos abrir el servicio.",
      );
    } finally {
      setAbriendoEdicion(null);
    }
  }

  async function handleBaja(s: ServicioResponse) {
    if (
      !confirm(
        `¿Dar de baja "${s.titulo}"? Dejará de mostrarse en el catálogo público.`,
      )
    )
      return;
    setBajaId(s.id);
    setError(null);
    try {
      await bajaPorVertical(s.tipo, s.id);
      setServicios((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No pudimos dar de baja el servicio.",
      );
    } finally {
      setBajaId(null);
    }
  }

  function cerrarModal() {
    setModal({ tipo: "cerrado" });
  }

  async function onExitoForm() {
    cerrarModal();
    await cargar();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Mis servicios
          </h1>
          <p className="mt-1 text-sm text-slate-500">Gestioná tu oferta en LEX.</p>
        </div>
        <button
          onClick={() => setModal({ tipo: "selector" })}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          + Publicar servicio
        </button>
      </div>

      {user && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <Link
            href={`/estudiantes/${user.usuarioId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 transition hover:underline"
          >
            Ver mi portafolio público <span aria-hidden="true">→</span>
          </Link>
          <span className="ml-3 hidden text-xs text-slate-400 sm:inline">
            Así te ven los clientes.
          </span>
        </div>
      )}

      {error && (
        <div className="mt-6">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        ) : servicios.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
            <p className="font-semibold text-slate-900">
              Todavía no publicaste ningún servicio
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Creá el primero para que los clientes te encuentren.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicios.map((s) => (
              <li
                key={s.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <TipoBadge tipo={s.tipo} />
                  <span className="text-sm font-bold text-slate-900">
                    {formatPrecio(s.precio)}
                  </span>
                </div>
                <Link
                  href={`/servicios/${s.id}`}
                  className="mt-2 font-semibold text-slate-900 transition hover:text-indigo-700"
                >
                  {s.titulo}
                </Link>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleEditar(s)}
                    disabled={abriendoEdicion === s.id}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {abriendoEdicion === s.id ? "Abriendo…" : "Editar"}
                  </button>
                  <button
                    onClick={() => handleBaja(s)}
                    disabled={bajaId === s.id}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    {bajaId === s.id ? "Dando de baja…" : "Desactivar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal.tipo === "selector" && (
        <SelectorVertical
          carreras={contexto?.carrerasVerificadas ?? []}
          anioCursado={contexto?.anioCursado ?? 0}
          onCerrar={cerrarModal}
          onSeleccionar={(vertical) => setModal({ tipo: "form", vertical })}
        />
      )}

      {modal.tipo === "form" &&
        modal.vertical === "ProyectoCerrado" &&
        contexto && (
          <ServicioFormProyectoCerrado
            servicio={modal.servicio}
            carreras={contexto.carrerasVerificadas}
            anioCursado={contexto.anioCursado}
            onCerrar={cerrarModal}
            onExito={onExitoForm}
          />
        )}

      {modal.tipo === "form" && modal.vertical === "Clase" && (
        <ServicioFormClase
          servicio={modal.servicio}
          onCerrar={cerrarModal}
          onExito={onExitoForm}
        />
      )}

      {modal.tipo === "form" && modal.vertical === "Salud" && contexto && (
        <ServicioFormSalud
          servicio={modal.servicio}
          carreras={contexto.carrerasVerificadas}
          anioCursado={contexto.anioCursado}
          onCerrar={cerrarModal}
          onExito={onExitoForm}
        />
      )}
    </div>
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
