"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listarMiDisponibilidad,
  eliminarBloque,
  DIAS_SEMANA,
  type BloqueDisponibilidadResponse,
} from "@/lib/disponibilidad";
import { ApiError } from "@/lib/api";
import { RequireRole } from "@/components/RequireRole";
import { DiaSection } from "@/components/DiaSection";
import { BloqueDisponibilidadForm } from "@/components/BloqueDisponibilidadForm";
import { ErrorAlert } from "@/components/ui";

type ModalState =
  | { tipo: "cerrado" }
  | { tipo: "form"; bloque?: BloqueDisponibilidadResponse };

export default function DisponibilidadPage() {
  return (
    <RequireRole roles={["Estudiante"]} vista="Estudiante">
      <Disponibilidad />
    </RequireRole>
  );
}

function Disponibilidad() {
  const [bloques, setBloques] = useState<BloqueDisponibilidadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ tipo: "cerrado" });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBloques(await listarMiDisponibilidad());
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No pudimos cargar tu disponibilidad.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleEliminar(bloque: BloqueDisponibilidadResponse) {
    if (
      !confirm(
        `¿Eliminar el bloque de ${bloque.diaSemana} ${bloque.horaInicio.slice(0, 5)}-${bloque.horaFin.slice(0, 5)}? ` +
          "Dejará de ofrecerse para nuevas reservas.",
      )
    )
      return;
    setError(null);
    try {
      await eliminarBloque(bloque.id);
      await cargar();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No pudimos eliminar el bloque.",
      );
    }
  }

  async function onExitoForm() {
    setModal({ tipo: "cerrado" });
    await cargar();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Mi disponibilidad
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Configurá los horarios en que estás disponible cada semana. Los
            clientes verán estos horarios al contratar servicios de clase o
            salud.
          </p>
        </div>
        <button
          onClick={() => setModal({ tipo: "form" })}
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Agregar bloque
        </button>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="mt-8 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
            />
          ))
        ) : (
          DIAS_SEMANA.map((d) => (
            <DiaSection
              key={d.valor}
              dia={d.valor}
              etiqueta={d.etiqueta}
              bloques={bloques
                .filter((b) => b.diaSemana === d.valor)
                .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))}
              onEditar={(bloque) => setModal({ tipo: "form", bloque })}
              onEliminar={handleEliminar}
            />
          ))
        )}
      </div>

      {modal.tipo === "form" && (
        <BloqueDisponibilidadForm
          bloque={modal.bloque}
          onCerrar={() => setModal({ tipo: "cerrado" })}
          onExito={onExitoForm}
        />
      )}
    </div>
  );
}
