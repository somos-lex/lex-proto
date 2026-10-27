"use client";

// Lo contratado en Salud: la práctica, la persona o mascota que se atiende y el
// consentimiento informado, que es obligatorio para empezar. Quién supervisa va
// en "Quiénes", al mismo nivel que el estudiante (D5).

import { useState } from "react";
import Link from "next/link";
import { firmarConsentimiento, type DetalleTrabajoSalud, type TrabajoResponse } from "@/lib/trabajos";
import type { RolEnTrabajo } from "@/lib/transicionesTrabajo";
import { formatFecha } from "@/lib/servicios";
import { Boton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Dato, Datos } from "@/components/trabajo/Datos";
import { Dialogo } from "@/components/ds/Dialogo";
import { mensajeDeError } from "@/components/trabajo/errores";

const MODALIDAD: Record<string, string> = {
  Consultorio: "En consultorio",
  Domicilio: "A domicilio",
  Ambas: "En consultorio o a domicilio",
};

export function DetalleSalud({
  trabajo,
  detalle,
  rolUsuario,
}: {
  trabajo: TrabajoResponse;
  detalle: DetalleTrabajoSalud;
  rolUsuario: RolEnTrabajo;
}) {
  const [leyendo, setLeyendo] = useState(false);
  const firmado = detalle.consentimientoFirmado && detalle.consentimiento;

  return (
    <div className="grid gap-5">
      <Datos>
        <Dato icono="heart" rotulo="Práctica">
          {detalle.catalogoServicioNombreSnapshot}, {detalle.duracionMinutosSesionSnapshot} min
        </Dato>
        <Dato icono="user" rotulo={rolUsuario === "Cliente" ? "Se atiende" : "Paciente"}>
          {detalle.pacienteNombre}
        </Dato>
        <Dato icono="pin" rotulo="Modalidad">
          {MODALIDAD[detalle.modalidadSaludSnapshot] ?? detalle.modalidadSaludSnapshot}
        </Dato>
      </Datos>

      {firmado ? (
        <Aviso
          tono="ok"
          titulo="Consentimiento firmado."
          acciones={
            <Boton variante="fantasma" tamano="sm" className="-ml-3" onClick={() => setLeyendo(true)}>
              Leer el consentimiento
            </Boton>
          }
        >
          {rolUsuario === "Cliente" ? "Lo firmaste" : `Lo firmó ${trabajo.clienteNombre}`} el {formatFecha(detalle.consentimiento!.fechaAceptacion)}.
        </Aviso>
      ) : rolUsuario === "Estudiante" ? (
        <Aviso tono="neutro" titulo="Falta el consentimiento.">
          {trabajo.clienteNombre} todavía no firmó el consentimiento informado. Sin la firma no podés empezar la práctica.
        </Aviso>
      ) : null}

      {rolUsuario === "Cliente" && (
        <p className="text-[15px] text-ink-2">
          Los datos de quien se atiende están en{" "}
          <Link href="/panel/pacientes" className="font-semibold">
            Personas y mascotas
          </Link>
          .
        </p>
      )}

      {firmado && (
        <Dialogo
          abierto={leyendo}
          onCerrar={() => setLeyendo(false)}
          titulo="Consentimiento informado"
          pie={
            <Boton variante="secundario" onClick={() => setLeyendo(false)} className="max-sm:w-full">
              Cerrar
            </Boton>
          }
        >
          <div className="max-h-[50dvh] overflow-y-auto rounded-control bg-surface-2 p-4 text-[15px] leading-[1.55] whitespace-pre-line text-ink">
            {detalle.consentimiento!.textoCompleto}
          </div>
        </Dialogo>
      )}
    </div>
  );
}

/** Para el cliente, cuando falta firmar: va en "Próximo paso", porque sin la
 *  firma el trabajo no puede empezar. Firmar escribe en la base. */
export function FirmarConsentimiento({
  trabajo,
  detalle,
  onFirmado,
}: {
  trabajo: TrabajoResponse;
  detalle: DetalleTrabajoSalud;
  onFirmado: (mensaje: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faltaAceptar, setFaltaAceptar] = useState(false);

  async function firmar() {
    if (firmando) return;
    if (!acepta) {
      setFaltaAceptar(true);
      return;
    }
    setFirmando(true);
    setError(null);
    try {
      await firmarConsentimiento(trabajo.id);
      setAbierto(false);
      onFirmado("Firmaste el consentimiento.");
    } catch (err) {
      setError(mensajeDeError(err, "No pudimos registrar la firma. Revisá tu conexión y probá de nuevo."));
    } finally {
      setFirmando(false);
    }
  }

  return (
    <>
      <Aviso tono="warn" titulo="Falta firmar el consentimiento informado.">
        Sin tu firma, {trabajo.estudianteNombre} no puede empezar la práctica.
      </Aviso>
      <div>
        <Boton
          className="max-sm:w-full"
          onClick={() => {
            setAcepta(false);
            setFaltaAceptar(false);
            setError(null);
            setAbierto(true);
          }}
        >
          Leer y firmar
        </Boton>
      </div>
      <Dialogo
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Consentimiento informado"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setAbierto(false)} className="max-sm:w-full">
              Volver
            </Boton>
            <Boton onClick={firmar} aria-busy={firmando || undefined} aria-disabled={firmando || undefined} className="max-sm:w-full">
              {firmando ? "Firmando…" : "Firmar consentimiento"}
            </Boton>
          </>
        }
      >
        {error && (
          <Aviso tono="danger" titulo="No se registró la firma.">
            {error}
          </Aviso>
        )}
        <div className="max-h-[40dvh] overflow-y-auto rounded-control bg-surface-2 p-4 text-[15px] leading-[1.55] text-ink">
          <p className="font-semibold">Consentimiento informado para práctica de salud supervisada</p>
          <p className="mt-2">
            Autorizo la práctica de {detalle.catalogoServicioNombreSnapshot} sobre {detalle.pacienteNombre}, realizada por la
            o el estudiante {trabajo.estudianteNombre} bajo la supervisión de {detalle.supervisorNombreSnapshot} (matrícula{" "}
            {detalle.supervisorMatriculaSnapshot}). Entiendo que es una práctica estudiantil supervisada y acepto sus
            condiciones. Queda registrado en LEX con la fecha de la firma.
          </p>
        </div>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-base text-ink">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => {
              setAcepta(e.target.checked);
              setFaltaAceptar(false);
            }}
            aria-invalid={faltaAceptar || undefined}
            aria-describedby={faltaAceptar ? `firma-error-${trabajo.id}` : undefined}
            className="mt-0.5 size-5 shrink-0 accent-link"
          />
          <span>Acepto el consentimiento y autorizo la práctica.</span>
        </label>
        {faltaAceptar && (
          <p id={`firma-error-${trabajo.id}`} className="-mt-2 flex items-start gap-1.5 text-[14px] font-medium text-danger">
            <Icono nombre="alert-circle" className="size-[18px]" />
            Marcá la casilla para poder firmar.
          </p>
        )}
      </Dialogo>
    </>
  );
}

