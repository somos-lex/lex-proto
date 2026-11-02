"use client";

// Inscribirse a un turno del Banco: elegir (o dar de alta) un paciente del tipo que pide
// el turno y aceptar los requisitos previos. Sin pago. Como en la ficha de un servicio:
// aside fijo en escritorio y hoja asomada en mobile, con "Sin costo" en el lugar del precio.

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { listarMisPacientes, type PacienteResponse } from "@/lib/pacientes";
import { inscribirEnPractica, type PracticaDetalle } from "@/lib/practicas";
import { ApiError } from "@/lib/api";
import { PacienteForm } from "@/components/PacienteForm";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Field, Select } from "@/components/ui";
import { Aviso } from "@/components/ds/Aviso";
import { Esqueleto } from "@/components/ds/Estados";
import { Hoja, HojaAsomada } from "@/components/ds/Hoja";
import { SinCosto } from "@/components/ds/Precio";
import { faltante } from "@/components/publico/FlujoContratar";

interface Props {
  detalle: PracticaDetalle;
  /** Nombre de pila del estudiante. */
  nombre: string;
}

export function AsideInscripcion(props: Props) {
  return (
    <aside aria-label="Inscribirme" className="sticky top-23 hidden rounded-[24px] bg-surface p-6 shadow-float lg:block">
      <InscripcionPanel {...props} />
    </aside>
  );
}

export function HojaInscripcion(props: Props) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <HojaAsomada className="mt-8">
        <div className="min-w-0 flex-1">
          <SinCosto />
          <p className="mt-1 flex items-center gap-1.5 text-[14px] text-ink-2">
            <Icono nombre="steth" className="size-4 text-ink-3" />
            Con supervisión docente
          </p>
        </div>
        <Boton onClick={() => setAbierta(true)} aria-haspopup="dialog" className="min-w-37">
          Inscribirme
        </Boton>
      </HojaAsomada>
      <Hoja
        abierto={abierta}
        onCerrar={() => setAbierta(false)}
        titulo={
          <>
            <span className="block text-[15px] font-normal text-ink-2">Inscribirme</span>
            <span className="block text-title-2-mobile">{props.detalle.practica.materiaNombre}</span>
          </>
        }
      >
        <InscripcionPanel {...props} enHoja />
      </Hoja>
    </>
  );
}

function InscripcionPanel({ detalle, nombre, enHoja = false }: Props & { enHoja?: boolean }) {
  const { isAuthenticated, loading, user, roles } = useAuth();
  const p = detalle.practica;
  const ruta = `/practicas/${p.id}`;
  const tamano = enHoja ? "lg" : "md";

  let cuerpo: ReactNode;
  if (loading) cuerpo = <Esqueleto className="h-13 w-full rounded-button" />;
  else if (p.estado !== "Publicada")
    cuerpo = (
      <Aviso
        tono="neutro"
        titulo="La inscripción está cerrada."
        acciones={
          isAuthenticated && (
            <Link href="/panel/inscripciones" className="-my-2.5 inline-flex min-h-11 items-center">
              Ir a Mis turnos del Banco
            </Link>
          )
        }
      >
        {detalle.inscripcion && user?.usuarioId === detalle.inscripcion.clienteId
          ? "Ya estás inscripto en este turno."
          : "Este turno ya no recibe inscripciones."}
      </Aviso>
    );
  else if (!isAuthenticated)
    cuerpo = (
      <>
        <Link href={`/login?volver=${encodeURIComponent(ruta)}`} className={clasesBoton({ tamano, bloque: true })}>
          Ingresá para inscribirte
        </Link>
        <p className="mt-2.5 text-[15px] text-ink-2">
          ¿No tenés cuenta?{" "}
          <Link href={`/registro?volver=${encodeURIComponent(ruta)}`} className="font-semibold">
            Creala
          </Link>{" "}
          y volvés acá para inscribirte.
        </p>
      </>
    );
  else if (user?.usuarioId === p.estudianteId)
    cuerpo = (
      <Aviso
        tono="neutro"
        titulo="Es tu turno."
        acciones={
          <Link href="/panel/practicas" className="-my-2.5 inline-flex min-h-11 items-center">
            Ir a Turnos que publico
          </Link>
        }
      >
        No te podés inscribir en un turno que publicaste vos.
      </Aviso>
    );
  else if (!roles.includes("Cliente"))
    cuerpo = (
      <Aviso tono="neutro" titulo="Con esta cuenta no te podés inscribir.">
        Para inscribir a un paciente hace falta una cuenta de cliente, particular o de empresa.
      </Aviso>
    );
  else cuerpo = <FormularioInscripcion detalle={detalle} tamano={tamano} prefijo={enHoja ? "h" : "a"} />;

  return (
    <>
      <SinCosto detalle="con supervisión docente" />
      <p className="mt-2 mb-5 text-[15px] text-ink-2">No se cobra nada, ni a vos ni a {nombre}.</p>
      {cuerpo}
    </>
  );
}

function FormularioInscripcion({ detalle, tamano, prefijo }: { detalle: PracticaDetalle; tamano: "md" | "lg"; prefijo: string }) {
  const router = useRouter();
  const p = detalle.practica;

  const [pacientes, setPacientes] = useState<PacienteResponse[] | null>(null);
  const [pacienteId, setPacienteId] = useState(0);
  const [formPaciente, setFormPaciente] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarMisPacientes()
      .then((data) => {
        if (!cancelado) setPacientes(data);
      })
      .catch(() => {
        // No bloquea: se puede dar de alta uno nuevo.
        if (!cancelado) setPacientes([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Solo los del tipo que pide el turno: el backend rechazaría cualquier otro.
  const compatibles = (pacientes ?? []).filter((pa) => pa.tipo === p.tipoPacienteRequerido);
  const tipo = p.tipoPacienteRequerido === "Animal" ? "mascota" : "persona";
  const falta = faltante([...(pacienteId > 0 ? [] : ["elegir al paciente"]), ...(acepta ? [] : ["aceptar los requisitos"])]);

  function onPacienteCreado(nuevo: PacienteResponse) {
    setPacientes((prev) => [nuevo, ...(prev ?? [])]);
    if (nuevo.tipo === p.tipoPacienteRequerido) setPacienteId(nuevo.id);
    setFormPaciente(false);
  }

  async function inscribir() {
    if (falta || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await inscribirEnPractica(p.id, pacienteId, true);
      router.push("/panel/inscripciones");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos completar la inscripción. Probá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2.5">
        {pacientes === null ? (
          <Esqueleto className="h-12 w-full rounded-control" />
        ) : compatibles.length > 0 ? (
          <Field label={`Paciente (${tipo})`} htmlFor={`${prefijo}-paciente`}>
            <Select id={`${prefijo}-paciente`} value={pacienteId} onChange={(e) => setPacienteId(Number(e.target.value))}>
              <option value={0}>Elegí un paciente</option>
              {compatibles.map((pa) => (
                <option key={pa.id} value={pa.id}>
                  {pa.nombreCompleto}
                  {pa.especie ? ` (${pa.especie.toLowerCase()})` : ""}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="text-[15px] text-ink-2">
            Este turno es para {p.tipoPacienteRequerido === "Animal" ? "una mascota" : "una persona"} y todavía no cargaste
            ninguna.
          </p>
        )}
        <Boton variante="secundario" tamano="sm" onClick={() => setFormPaciente(true)} className="justify-self-start">
          <Icono nombre="plus" />
          {p.tipoPacienteRequerido === "Animal" ? "Agregar una mascota" : "Agregar una persona"}
        </Boton>
      </div>

      <div>
        <p className="text-[15px] font-semibold">Requisitos previos</p>
        <p className="mt-1.5 rounded-notice bg-surface-2 px-3.5 py-3 text-[15px] whitespace-pre-line text-ink">
          {p.requisitosPrevios ?? "Este turno no tiene requisitos especiales."}
        </p>
        <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-3 py-2 text-[15px] leading-[1.45]">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-accent"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
          />
          <span>Leí los requisitos y el paciente los cumple. Me comprometo a ir el día y a la hora del turno.</span>
        </label>
      </div>

      <div>
        <Boton
          tamano={tamano}
          bloque
          onClick={inscribir}
          aria-disabled={!!falta || undefined}
          aria-describedby={`${prefijo}-estado`}
          aria-busy={enviando || undefined}
        >
          {enviando && (
            <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
          )}
          {enviando ? "Inscribiendo…" : "Inscribirme"}
        </Boton>
        <p id={`${prefijo}-estado`} className="mt-2.5 text-[15px] text-ink-2">
          {falta ?? "Te inscribís sin costo. Si no podés ir, cancelalo desde Mis turnos del Banco."}
        </p>
        {error && (
          <Aviso tono="danger" className="mt-3">
            {error}
          </Aviso>
        )}
      </div>

      {formPaciente && <PacienteForm onCerrar={() => setFormPaciente(false)} onExito={onPacienteCreado} />}
    </div>
  );
}
