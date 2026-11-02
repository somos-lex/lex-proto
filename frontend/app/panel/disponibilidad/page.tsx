"use client";

// Los horarios semanales en que el estudiante puede dar clases o atender
// servicios de salud. Si no carga horarios, nadie puede contratarlos.

import { useState } from "react";
import {
  eliminarBloque,
  listarMiDisponibilidad,
  DIAS_SEMANA,
  type BloqueDisponibilidadResponse,
} from "@/lib/disponibilidad";
import { RequireRole } from "@/components/RequireRole";
import { Boton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Cargando, Esqueleto, Vacio } from "@/components/ds/Estados";
import { Toast } from "@/components/ds/Toast";
import { DiaSection, rango } from "@/components/DiaSection";
import { BloqueDisponibilidadForm } from "@/components/BloqueDisponibilidadForm";
import { ErrorDeCarga } from "@/components/panel/Reintentar";
import { enumerar } from "@/components/panel/resumenes";
import { mensajeDeError, useCarga } from "@/components/panel/useCarga";

type ModalState = { tipo: "cerrado" } | { tipo: "form"; bloque?: BloqueDisponibilidadResponse };

const NOMBRE = new Map(DIAS_SEMANA.map((d) => [d.valor, d.etiqueta.toLowerCase()]));

export default function DisponibilidadPage() {
  return (
    <RequireRole roles={["Estudiante"]} vista="Estudiante">
      <Disponibilidad />
    </RequireRole>
  );
}

function Disponibilidad() {
  const carga = useCarga("mi-disponibilidad", () => listarMiDisponibilidad());
  const [modal, setModal] = useState<ModalState>({ tipo: "cerrado" });
  const [aviso, setAviso] = useState<{ tono: "ok" | "danger"; texto: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const bloques = carga.datos ?? [];
  const dias = DIAS_SEMANA.map((d) => ({
    ...d,
    bloques: bloques.filter((b) => b.diaSemana === d.valor).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
  }));
  const sinHorario = dias.filter((d) => d.bloques.length === 0).map((d) => d.etiqueta.toLowerCase());

  async function handleEliminar(bloque: BloqueDisponibilidadResponse) {
    setAviso(null);
    try {
      await eliminarBloque(bloque.id);
      setToast(`Eliminaste el horario del ${NOMBRE.get(bloque.diaSemana)}, de ${rango(bloque)}.`);
      carga.recargar();
    } catch (err) {
      setAviso({ tono: "danger", texto: `No pudimos eliminar el horario. ${mensajeDeError(err)}` });
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 pt-6 pb-12 md:px-6 lg:px-8 lg:pt-9">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="max-w-[62ch]">
          <h1 className="text-title-1-mobile text-balance md:text-title-1">Agenda y disponibilidad</h1>
          <p className="mt-2 text-[17px] leading-normal text-ink-2 md:text-lead">
            Los horarios en que atendés cada semana. Quien contrata una clase o un servicio de salud elige un turno dentro de
            ellos.
          </p>
        </div>
        {bloques.length > 0 && (
          <Boton
            onClick={() => {
              setAviso(null);
              setModal({ tipo: "form" });
            }}
          >
            <Icono nombre="plus" />
            Agregar horario
          </Boton>
        )}
      </div>

      {aviso && (
        <Aviso tono={aviso.tono} className="mt-6">
          {aviso.texto}
        </Aviso>
      )}

      <div className="mt-8">
        {carga.cargando ? (
          <Cargando etiqueta="Cargando tus horarios">
            <div className="grid gap-6 md:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i}>
                  <Esqueleto className="mx-1 mb-2 h-4 w-20" />
                  <Esqueleto className="h-[132px] rounded-card" />
                </div>
              ))}
            </div>
          </Cargando>
        ) : carga.error ? (
          <ErrorDeCarga que="No pudimos cargar tus horarios." motivo={carga.error} onReintentar={carga.reintentar} />
        ) : bloques.length === 0 ? (
          <Vacio
            icono="calendar-plus"
            titulo="Todavía no cargaste horarios"
            acciones={
              <Boton onClick={() => setModal({ tipo: "form" })}>
                <Icono nombre="plus" />
                Agregar horario
              </Boton>
            }
          >
            Sin horarios, nadie puede contratar tus clases ni tus servicios de salud. Los proyectos cerrados no los necesitan.
          </Vacio>
        ) : (
          <>
            <div className="grid items-start gap-6 md:grid-cols-2">
              {dias
                .filter((d) => d.bloques.length > 0)
                .map((d) => (
                  <DiaSection
                    key={d.valor}
                    dia={d.valor}
                    etiqueta={d.etiqueta}
                    bloques={d.bloques}
                    onEditar={(bloque) => {
                      setAviso(null);
                      setModal({ tipo: "form", bloque });
                    }}
                    onEliminar={handleEliminar}
                  />
                ))}
            </div>
            {sinHorario.length > 0 && (
              <p className="mt-6 px-1 text-[15px] text-ink-2">
                Sin horarios: {enumerar(sinHorario)}.
              </p>
            )}
          </>
        )}
      </div>

      {modal.tipo === "form" && (
        <BloqueDisponibilidadForm
          bloque={modal.bloque}
          onCerrar={() => setModal({ tipo: "cerrado" })}
          onExito={(g) => {
            setAviso(null);
            setToast(`${modal.bloque ? "Guardaste" : "Agregaste"} el horario del ${NOMBRE.get(g.diaSemana)}, de ${rango(g)}.`);
            setModal({ tipo: "cerrado" });
            carga.recargar();
          }}
        />
      )}

      <Toast mensaje={toast} onCerrar={() => setToast(null)} conLateral />
    </div>
  );
}
