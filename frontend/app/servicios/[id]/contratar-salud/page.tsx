"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  obtenerServicio,
  esSalud,
  formatPrecio,
  type ServicioDetalleResponse,
  type DetalleSalud,
} from "@/lib/servicios";
import { contratarSalud, firmarConsentimiento } from "@/lib/trabajos";
import { listarMisPacientes, type PacienteResponse } from "@/lib/pacientes";
import { ApiError } from "@/lib/api";
import { RequireRole } from "@/components/RequireRole";
import { SelectorSlots } from "@/components/SelectorSlots";
import { PacienteForm } from "@/components/PacienteForm";
import { ConsentimientoTexto } from "@/components/ConsentimientoTexto";
import { Field, Select, Textarea } from "@/components/ui";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Esqueleto } from "@/components/ds/Estados";
import {
  CabeceraFlujo,
  EsqueletoFlujo,
  LayoutFlujo,
  Paso,
  ResumenContratar,
  faltante,
} from "@/components/publico/FlujoContratar";

type SaludServicio = ServicioDetalleResponse & { detalle: DetalleSalud };

export default function ContratarSaludPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireRole roles={["Cliente"]} vista="Cliente">
      <ContratarSalud servicioId={Number(id)} />
    </RequireRole>
  );
}

/** "Toby (mascota, perro)" o "Juana Pérez (persona)". */
function etiquetaPaciente(p: PacienteResponse) {
  if (p.tipo === "Animal") return `${p.nombreCompleto} (mascota${p.especie ? `, ${p.especie.toLowerCase()}` : ""})`;
  return `${p.nombreCompleto} (persona)`;
}

function ContratarSalud({ servicioId }: { servicioId: number }) {
  const router = useRouter();
  const [servicio, setServicio] = useState<SaludServicio | null>(null);
  const [cargaError, setCargaError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [pacientes, setPacientes] = useState<PacienteResponse[] | null>(null);
  const [pacienteId, setPacienteId] = useState<number>(0);
  const [formPaciente, setFormPaciente] = useState(false);

  const [slotsElegidos, setSlotsElegidos] = useState<string[]>([]);
  const [acepta, setAcepta] = useState(false);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    obtenerServicio(servicioId)
      .then((s) => {
        if (cancelado) return;
        if (!esSalud(s)) setCargaError("Este servicio no es de Salud.");
        else setServicio(s);
      })
      .catch((err) => {
        if (!cancelado) setCargaError(err instanceof ApiError ? err.message : "No pudimos cargar el servicio.");
      });
    // Si no se pueden traer los pacientes no se bloquea: se puede agregar uno nuevo.
    listarMisPacientes()
      .then((p) => {
        if (!cancelado) setPacientes(p);
      })
      .catch(() => {
        if (!cancelado) setPacientes([]);
      });
    return () => {
      cancelado = true;
    };
  }, [servicioId, intento]);

  if (cargaError)
    return (
      <div className="mx-auto max-w-lex px-4 py-10 md:px-6 lg:px-8">
        <Aviso
          tono="danger"
          titulo="No pudimos abrir la contratación."
          acciones={
            <>
              <Boton
                variante="secundario"
                tamano="sm"
                onClick={() => {
                  setCargaError(null);
                  setIntento((n) => n + 1);
                }}
              >
                Reintentar
              </Boton>
              <Link href="/" className={clasesBoton({ variante: "fantasma", tamano: "sm" })}>
                Ir al catálogo
              </Link>
            </>
          }
        >
          {cargaError}
        </Aviso>
      </div>
    );

  if (!servicio) return <EsqueletoFlujo />;

  const d = servicio.detalle;
  const paciente = pacientes?.find((p) => p.id === pacienteId) ?? null;
  const nombre = servicio.estudianteNombre.trim().split(/\s+/)[0];
  const falta = faltante([
    ...(paciente ? [] : ["elegir al paciente"]),
    ...(slotsElegidos.length === 1 ? [] : ["elegir el horario"]),
    ...(acepta ? [] : ["aceptar el consentimiento"]),
  ]);

  function onPacienteCreado(p: PacienteResponse) {
    setPacientes((prev) => [p, ...(prev ?? [])]);
    setPacienteId(p.id);
    setAcepta(false);
    setFormPaciente(false);
  }

  async function confirmar() {
    if (falta || !servicio || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const trabajo = await contratarSalud({
        servicioId: servicio.id,
        pacienteId,
        slotElegido: slotsElegidos[0],
        notasCliente: notas.trim() || undefined,
      });
      // El trabajo ya se creó; si la firma falla, el cliente puede firmar desde el detalle.
      try {
        await firmarConsentimiento(trabajo.id);
      } catch {
        // no bloquea el redirect
      }
      router.push(`/panel/trabajos/${trabajo.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos confirmar la contratación. Probá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <LayoutFlujo
      cabecera={<CabeceraFlujo servicio={servicio} />}
      resumen={
        <ResumenContratar servicio={servicio}>
          <Boton
            tamano="lg"
            bloque
            onClick={confirmar}
            aria-disabled={!!falta || undefined}
            aria-describedby="estado-confirmar"
            aria-busy={enviando || undefined}
          >
            {enviando && (
              <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
            )}
            {enviando ? "Confirmando…" : "Firmar y pagar"}
          </Boton>
          <p id="estado-confirmar" className="mt-2.5 text-[15px] text-ink-2">
            {falta ??
              `Firmás el consentimiento y pagás ${formatPrecio(servicio.precio)}. LEX guarda el pago hasta que se hace la sesión.`}
          </p>
          {error && (
            <Aviso tono="danger" className="mt-3">
              {error}
            </Aviso>
          )}
        </ResumenContratar>
      }
    >
      <Paso n={1} titulo="Elegí al paciente" ayuda="La persona o la mascota que se va a atender.">
        {pacientes === null ? (
          <Esqueleto className="h-12 w-full max-w-md rounded-control" />
        ) : (
          <div className="grid gap-3 sm:flex sm:items-end">
            {pacientes.length > 0 ? (
              <div className="min-w-0 sm:max-w-md sm:flex-1">
                <Field label="Paciente" htmlFor="paciente">
                  <Select
                    id="paciente"
                    value={pacienteId}
                    onChange={(e) => {
                      setPacienteId(Number(e.target.value));
                      setAcepta(false);
                    }}
                  >
                    <option value={0}>Elegí un paciente</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {etiquetaPaciente(p)}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            ) : (
              <p className="text-[15px] text-ink-2">Todavía no cargaste a nadie. Agregá a la persona o la mascota que se va a atender.</p>
            )}
            <Boton variante="secundario" onClick={() => setFormPaciente(true)} className="justify-self-start">
              <Icono nombre="plus" />
              Agregar persona o mascota
            </Boton>
          </div>
        )}
      </Paso>

      <Paso
        n={2}
        titulo="Elegí el horario"
        ayuda={`La sesión dura ${d.duracionMinutosSesion} min. Los horarios están en hora de Argentina.`}
      >
        <SelectorSlots
          estudianteId={servicio.estudianteId}
          duracionMinutos={d.duracionMinutosSesion}
          cantidadRequerida={1}
          slotsElegidos={slotsElegidos}
          onCambiarSeleccion={setSlotsElegidos}
        />
      </Paso>

      <Paso
        n={3}
        titulo="Leé y aceptá el consentimiento"
        ayuda={`Lo firmás al contratar. ${nombre} lo ve antes de aceptar el trabajo.`}
      >
        {paciente ? (
          <>
            <ConsentimientoTexto servicio={servicio} paciente={paciente} />
            <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 py-2 text-base">
              <input
                type="checkbox"
                className="mt-0.5 size-5 shrink-0 accent-accent"
                checked={acepta}
                onChange={(e) => setAcepta(e.target.checked)}
              />
              <span>Acepto el consentimiento informado y autorizo la realización de la práctica.</span>
            </label>
          </>
        ) : (
          <p className="rounded-notice bg-surface-2 px-4 py-4 text-[15px] text-ink-2">
            Elegí al paciente para ver el consentimiento: lleva su nombre.
          </p>
        )}
      </Paso>

      <Paso n={4} titulo="Contale lo que haga falta">
        <Field label="Notas para el estudiante (opcional)" htmlFor="notas" ayuda={d.modalidad === "Consultorio" ? "Por ejemplo, alergias o medicación." : "Por ejemplo, alergias, medicación o cómo llegar si es a domicilio."}>
          <Textarea
            id="notas"
            rows={3}
            maxLength={500}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            aria-describedby="notas-ayuda"
          />
        </Field>
      </Paso>

      {formPaciente && <PacienteForm onCerrar={() => setFormPaciente(false)} onExito={onPacienteCreado} />}
    </LayoutFlujo>
  );
}
