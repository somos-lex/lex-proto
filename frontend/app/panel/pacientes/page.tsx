"use client";

import { useEffect, useState } from "react";
import {
  listarMisPacientes,
  type PacienteResponse,
} from "@/lib/pacientes";
import { ApiError } from "@/lib/api";
import { RequireRole } from "@/components/RequireRole";
import { Boton } from "@/components/Boton";
import { PacienteCard } from "@/components/PacienteCard";
import { PacienteForm } from "@/components/PacienteForm";
import { Aviso } from "@/components/ds/Aviso";
import { Cargando, Esqueleto, Vacio } from "@/components/ds/Estados";
import { Toast } from "@/components/ds/Toast";
import { EncabezadoPagina, Pagina } from "@/components/trabajo/Pagina";

export default function MisPacientesPage() {
  return (
    <RequireRole roles={["Cliente"]} vista="Cliente">
      <MisPacientes />
    </RequireRole>
  );
}

function MisPacientes() {
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [formAbierto, setFormAbierto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarMisPacientes()
      .then((data) => {
        if (!cancelado) {
          setPacientes(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError ? err.message : "No pudimos cargar tus personas y mascotas.",
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

  function onExito(nuevo: PacienteResponse) {
    setPacientes((prev) => [nuevo, ...prev]);
    setFormAbierto(false);
    setToast(`Se agregó a ${nuevo.nombreCompleto}.`);
  }

  return (
    <Pagina>
      <EncabezadoPagina
        titulo="Personas y mascotas"
        bajada="Las personas o animales a tu cargo para los que podés contratar servicios de salud o reservar turnos en el Banco."
        acciones={
          pacientes.length > 0 && !loading ? (
            <Boton onClick={() => setFormAbierto(true)}>
              Agregar persona o mascota
            </Boton>
          ) : null
        }
      />

      {error && (
        <div className="mt-6">
          <Aviso
            tono="danger"
            titulo="No pudimos cargar tus personas y mascotas"
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
          <Cargando etiqueta="Cargando personas y mascotas">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <EsqueletoPacienteCard key={i} />
              ))}
            </div>
          </Cargando>
        ) : pacientes.length === 0 ? (
          <Vacio
            icono="users"
            titulo="Todavía no agregaste personas ni mascotas"
            acciones={
              <Boton onClick={() => setFormAbierto(true)}>
                Agregar la primera
              </Boton>
            }
          >
            Agregá a quién vaya a recibir la atención para poder contratar servicios de salud o reservar turnos en el Banco.
          </Vacio>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pacientes.map((p) => (
              <PacienteCard key={p.id} paciente={p} />
            ))}
          </div>
        )}
      </div>

      {formAbierto && (
        <PacienteForm
          onCerrar={() => setFormAbierto(false)}
          onExito={onExito}
        />
      )}

      <Toast mensaje={toast} onCerrar={() => setToast(null)} conLateral />
    </Pagina>
  );
}

function EsqueletoPacienteCard() {
  return (
    <div
      aria-hidden="true"
      className="rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none"
    >
      <div className="flex items-start gap-3">
        <Esqueleto className="size-11 rounded-control" />
        <div className="grid flex-1 gap-2 pt-1">
          <Esqueleto className="h-4 w-3/5" />
          <Esqueleto className="h-3 w-2/5" />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        <div className="flex justify-between gap-4">
          <Esqueleto className="h-3.5 w-1/4" />
          <Esqueleto className="h-3.5 w-1/3" />
        </div>
        <div className="flex justify-between gap-4">
          <Esqueleto className="h-3.5 w-1/3" />
          <Esqueleto className="h-3.5 w-2/5" />
        </div>
        <div className="flex justify-between gap-4">
          <Esqueleto className="h-3.5 w-1/4" />
          <Esqueleto className="h-3.5 w-1/4" />
        </div>
      </div>
    </div>
  );
}
