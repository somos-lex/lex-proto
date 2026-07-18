"use client";

import { useEffect, useState } from "react";
import {
  listarServiciosPermitidos,
  type CatalogoServicioResponse,
} from "@/lib/catalogo";
import type { CarreraPortafolio } from "@/lib/portafolio";
import type { TipoServicio } from "@/lib/servicios";

// Modal de eleccion de vertical. ProyectoCerrado y Salud se habilitan solo si el catalogo
// cerrado tiene alguna entrada de esa vertical para las carreras verificadas del estudiante
// (dado su año). Clase es catalogo libre: habilitada con tener una carrera verificada.
export function SelectorVertical({
  carreras,
  anioCursado,
  onCerrar,
  onSeleccionar,
}: {
  carreras: CarreraPortafolio[];
  anioCursado: number;
  onCerrar: () => void;
  onSeleccionar: (vertical: TipoServicio) => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [tiposPermitidos, setTiposPermitidos] = useState<Set<TipoServicio>>(
    new Set(),
  );

  useEffect(() => {
    let cancelado = false;
    if (carreras.length === 0 || anioCursado <= 0) {
      setCargando(false);
      return;
    }
    // Union de tipos de catalogo disponibles entre todas las carreras verificadas.
    Promise.all(
      carreras.map((c) => listarServiciosPermitidos(c.carreraId, anioCursado)),
    )
      .then((listas) => {
        if (cancelado) return;
        const tipos = new Set<TipoServicio>();
        for (const entradas of listas)
          for (const e of entradas) tipos.add(e.tipoServicio);
        setTiposPermitidos(tipos);
      })
      .catch(() => {
        // Si falla la carga, PC/Salud quedan deshabilitados (conservador).
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [carreras, anioCursado]);

  const tieneCarrera = carreras.length > 0;
  const opciones: {
    vertical: TipoServicio;
    titulo: string;
    descripcion: string;
    habilitado: boolean;
  }[] = [
    {
      vertical: "ProyectoCerrado",
      titulo: "Proyecto cerrado",
      descripcion: "Trabajos definidos con plazo de entrega.",
      habilitado: tiposPermitidos.has("ProyectoCerrado"),
    },
    {
      vertical: "Clase",
      titulo: "Clases / Tutorías",
      descripcion: "Sesiones agendadas de aprendizaje.",
      habilitado: tieneCarrera,
    },
    {
      vertical: "Salud",
      titulo: "Salud",
      descripcion: "Prácticas supervisadas por profesional matriculado.",
      habilitado: tiposPermitidos.has("Salud"),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              ¿Qué tipo de servicio querés publicar?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Elegí la vertical. Algunas dependen de que tu carrera esté en el
              catálogo.
            </p>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {!tieneCarrera ? (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Necesitás al menos una carrera vinculada y verificada para publicar
            servicios.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {opciones.map((op) => {
              const deshabilitado = !op.habilitado || cargando;
              return (
                <button
                  key={op.vertical}
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => onSeleccionar(op.vertical)}
                  title={
                    !cargando && !op.habilitado
                      ? "Tu carrera aún no está incluida en el catálogo para este vertical."
                      : undefined
                  }
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    deshabilitado
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                      : "border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40"
                  }`}
                >
                  <span className="block font-semibold text-slate-900">
                    {op.titulo}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {op.descripcion}
                  </span>
                  {!cargando && !op.habilitado && (
                    <span className="mt-1.5 block text-xs text-amber-700">
                      Tu carrera aún no está incluida en el catálogo para este
                      vertical.
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
