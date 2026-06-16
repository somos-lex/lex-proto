"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  crearPaciente,
  listarMisPacientes,
  type Paciente,
} from "@/lib/pacientes";
import { ApiError } from "@/lib/api";
import { RequireRole } from "@/components/RequireRole";
import { ErrorAlert, Field, Input, SubmitButton } from "@/components/ui";

export default function MisPacientesPage() {
  return (
    <RequireRole roles={["Cliente"]} vista="Cliente">
      <MisPacientes />
    </RequireRole>
  );
}

function MisPacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [edad, setEdad] = useState("");
  const [notas, setNotas] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    listarMisPacientes()
      .then((data) => {
        if (!cancelado) setPacientes(data);
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar tus pacientes.",
          );
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const edadNum = edad.trim() ? Number(edad) : null;
    if (edadNum !== null && (!Number.isInteger(edadNum) || edadNum < 0 || edadNum > 130)) {
      setFormError("La edad debe ser un número entre 0 y 130.");
      return;
    }

    setSubmitting(true);
    try {
      const nuevo = await crearPaciente({
        nombreCompleto: nombreCompleto.trim(),
        edad: edadNum,
        notas: notas.trim() || null,
      });
      setPacientes((prev) => [nuevo, ...prev]);
      setNombreCompleto("");
      setEdad("");
      setNotas("");
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "No pudimos registrar el paciente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Mis pacientes
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Las personas a tu cargo para las que podés contratar servicios de salud.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        {/* Listado */}
        <div className="lg:order-1 order-2">
          {error && <ErrorAlert message={error} />}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
                />
              ))}
            </div>
          ) : pacientes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
              <p className="font-semibold text-foreground">
                Todavía no registraste pacientes
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Registrá uno con el formulario para poder contratar servicios de
                salud.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pacientes.map((p) => (
                <li
                  key={p.pacienteId}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">
                      {p.nombreCompleto}
                    </span>
                    {p.edad != null && (
                      <span className="text-sm text-gray-500">{p.edad} años</span>
                    )}
                  </div>
                  {p.notas && (
                    <p className="mt-1 text-sm text-gray-600">{p.notas}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Formulario de alta */}
        <div className="lg:order-2 order-1">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24"
          >
            <h2 className="font-semibold text-foreground">Registrar paciente</h2>
            <div className="mt-4 space-y-4">
              {formError && <ErrorAlert message={formError} />}
              <Field label="Nombre completo" htmlFor="nombre">
                <Input
                  id="nombre"
                  required
                  maxLength={150}
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Nombre del paciente"
                />
              </Field>
              <Field label="Edad (opcional)" htmlFor="edad">
                <Input
                  id="edad"
                  type="number"
                  min="0"
                  max="130"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  placeholder="Ej: 45"
                />
              </Field>
              <Field label="Notas (opcional)" htmlFor="notas">
                <textarea
                  id="notas"
                  rows={3}
                  maxLength={1000}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Información relevante…"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </Field>
              <SubmitButton loading={submitting}>Registrar</SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
