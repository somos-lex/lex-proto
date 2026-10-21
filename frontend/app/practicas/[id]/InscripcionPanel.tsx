"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { listarMisPacientes, type PacienteResponse } from "@/lib/pacientes";
import { inscribirEnPractica, type PracticaDetalle } from "@/lib/practicas";
import { ApiError } from "@/lib/api";
import { PacienteForm } from "@/components/PacienteForm";
import { ErrorAlert } from "@/components/ui";

// Inscripción a una práctica: elegir (o dar de alta) un paciente del tipo requerido y
// aceptar explícitamente los requisitos previos. Sin pago: el botón final inscribe.
export function InscripcionPanel({ detalle }: { detalle: PracticaDetalle }) {
  const { isAuthenticated, loading, user, roles } = useAuth();
  const p = detalle.practica;

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />;
  }

  if (p.estado !== "Publicada") {
    return (
      <Tarjeta titulo="Inscripción cerrada">
        <p className="text-sm text-slate-600">
          {detalle.inscripcion && user?.usuarioId === detalle.inscripcion.clienteId
            ? "Ya estás inscripto en esta práctica. La seguís desde tus inscripciones."
            : "Esta práctica ya no recibe inscripciones."}
        </p>
        {isAuthenticated && (
          <Link href="/panel/inscripciones" className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline">
            Ver mis inscripciones →
          </Link>
        )}
      </Tarjeta>
    );
  }

  if (!isAuthenticated) {
    return (
      <Tarjeta titulo="Inscribite sin costo">
        <p className="text-sm text-slate-600">Para inscribir un paciente necesitás una cuenta.</p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/login"
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Crear cuenta
          </Link>
        </div>
      </Tarjeta>
    );
  }

  if (user?.usuarioId === p.estudianteId) {
    return (
      <Tarjeta titulo="Es tu práctica">
        <p className="text-sm text-slate-600">No podés inscribirte en una práctica que publicaste vos.</p>
        <Link href="/panel/practicas" className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline">
          Ir a mis prácticas →
        </Link>
      </Tarjeta>
    );
  }

  if (!roles.includes("Cliente")) {
    return (
      <Tarjeta titulo="Inscribite sin costo">
        <p className="text-sm text-slate-600">
          Para inscribir pacientes necesitás una cuenta de cliente (particular o empresa).
        </p>
      </Tarjeta>
    );
  }

  return <FormularioInscripcion detalle={detalle} />;
}

function FormularioInscripcion({ detalle }: { detalle: PracticaDetalle }) {
  const router = useRouter();
  const p = detalle.practica;

  const [pacientes, setPacientes] = useState<PacienteResponse[]>([]);
  const [cargando, setCargando] = useState(true);
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
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Solo los del tipo que pide la práctica: el backend rechazaría cualquier otro.
  const compatibles = pacientes.filter((pa) => pa.tipo === p.tipoPacienteRequerido);
  const listo = pacienteId > 0 && acepta;

  function onPacienteCreado(nuevo: PacienteResponse) {
    setPacientes((prev) => [nuevo, ...prev]);
    if (nuevo.tipo === p.tipoPacienteRequerido) setPacienteId(nuevo.id);
    setFormPaciente(false);
  }

  async function inscribir() {
    if (!listo) return;
    setEnviando(true);
    setError(null);
    try {
      await inscribirEnPractica(p.id, pacienteId, true);
      router.push("/panel/inscripciones");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos completar la inscripción.");
      setEnviando(false);
    }
  }

  return (
    <Tarjeta titulo="Inscribite sin costo">
      <label className="block text-sm font-medium text-slate-700" htmlFor="paciente">
        1. Paciente ({p.tipoPacienteRequerido.toLowerCase()})
      </label>
      {cargando ? (
        <div className="mt-2 h-10 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <select
          id="paciente"
          value={pacienteId}
          onChange={(e) => setPacienteId(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value={0}>
            {compatibles.length === 0 ? "No tenés pacientes de este tipo" : "Elegí un paciente…"}
          </option>
          {compatibles.map((pa) => (
            <option key={pa.id} value={pa.id}>
              {pa.nombreCompleto}
              {pa.especie ? ` (${pa.especie})` : ""}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => setFormPaciente(true)}
        className="mt-2 text-sm font-semibold text-indigo-700 hover:underline"
      >
        + Agregar un paciente nuevo
      </button>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700">2. Requisitos previos</p>
        <p className="mt-2 whitespace-pre-line rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {p.requisitosPrevios ?? "Sin requisitos especiales."}
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5 accent-indigo-600"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
          />
          <span>
            Leí los requisitos previos y el paciente los cumple. Me comprometo a asistir el día y
            a la hora indicados.
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorAlert message={error} />
        </div>
      )}

      <button
        onClick={inscribir}
        disabled={!listo || enviando}
        className="mt-5 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Inscribiendo…" : "Confirmar inscripción"}
      </button>

      {formPaciente && (
        <PacienteForm onCerrar={() => setFormPaciente(false)} onExito={onPacienteCreado} />
      )}
    </Tarjeta>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
