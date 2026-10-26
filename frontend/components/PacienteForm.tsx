"use client";

import { useState, type FormEvent } from "react";
import {
  crearPaciente,
  type PacienteResponse,
  type TipoPaciente,
} from "@/lib/pacientes";
import { ApiError } from "@/lib/api";
import { Boton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Dialogo } from "@/components/ds/Dialogo";
import { Field, Input, Textarea } from "@/components/ui";

// Solo alta: el backend no expone edición ni borrado de pacientes (POST/GET únicamente).
export function PacienteForm({
  onCerrar,
  onExito,
}: {
  onCerrar: () => void;
  onExito: (p: PacienteResponse) => void;
}) {
  const [tipo, setTipo] = useState<TipoPaciente>("Humano");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [notas, setNotas] = useState("");

  // Humano
  const [esTitular, setEsTitular] = useState(false);
  const [dni, setDni] = useState("");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");

  // Animal
  const [especie, setEspecie] = useState("");
  const [raza, setRaza] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // La fecha del input date ("YYYY-MM-DD") se manda como ISO UTC para que Npgsql la
  // acepte en la columna timestamptz.
  function fechaIso(): string | undefined {
    return fechaNacimiento ? `${fechaNacimiento}T00:00:00Z` : undefined;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombreCompleto.trim()) return setError("Poné el nombre completo.");
    if (tipo === "Animal" && !especie.trim())
      return setError("Indicá la especie del animal.");

    setSubmitting(true);
    try {
      const nuevo =
        tipo === "Humano"
          ? await crearPaciente({
              tipo: "Humano",
              nombreCompleto: nombreCompleto.trim(),
              esTitular,
              fechaNacimiento: fechaIso(),
              dni: dni.trim() || undefined,
              contactoEmergenciaNombre: contactoNombre.trim() || undefined,
              contactoEmergenciaTelefono: contactoTelefono.trim() || undefined,
              notasRelevantes: notas.trim() || undefined,
            })
          : await crearPaciente({
              tipo: "Animal",
              nombreCompleto: nombreCompleto.trim(),
              esTitular: false,
              fechaNacimiento: fechaIso(),
              especie: especie.trim(),
              raza: raza.trim() || undefined,
              notasRelevantes: notas.trim() || undefined,
            });
      onExito(nuevo);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No pudimos guardar los datos.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialogo abierto={true} onCerrar={onCerrar} titulo="Agregar persona o mascota">
      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && (
          <Aviso tono="danger" titulo="Revisá los datos">
            {error}
          </Aviso>
        )}

        {/* Selector de tipo */}
        <div
          role="radiogroup"
          aria-label="Tipo"
          className="grid grid-cols-2 gap-1 rounded-control bg-surface-2 p-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={tipo === "Humano"}
            onClick={() => setTipo("Humano")}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-button py-2 text-[15px] font-semibold transition-colors ${
              tipo === "Humano"
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            <Icono nombre="user" className="size-4.5" />
            <span>Persona</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={tipo === "Animal"}
            onClick={() => setTipo("Animal")}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-button py-2 text-[15px] font-semibold transition-colors ${
              tipo === "Animal"
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            <Icono nombre="paw" className="size-4.5" />
            <span>Mascota</span>
          </button>
        </div>

        <Field label="Nombre completo" htmlFor="nombre">
          <Input
            id="nombre"
            required
            maxLength={150}
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder={tipo === "Animal" ? "Ej: Firulais" : "Ej: Lucas Paz"}
          />
        </Field>

        {tipo === "Humano" ? (
          <>
            <label className="flex cursor-pointer items-center gap-2.5 text-[15px] font-medium text-ink">
              <input
                type="checkbox"
                className="size-5 rounded-sm accent-accent"
                checked={esTitular}
                onChange={(e) => setEsTitular(e.target.checked)}
              />
              <span>Es titular (el paciente sos vos)</span>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="DNI (opcional)" htmlFor="dni">
                <Input
                  id="dni"
                  inputMode="numeric"
                  maxLength={20}
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="30123456"
                />
              </Field>
              <Field label="Fecha de nacimiento (opcional)" htmlFor="fnac">
                <Input
                  id="fnac"
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Contacto de emergencia (opcional)" htmlFor="cnom">
                <Input
                  id="cnom"
                  maxLength={150}
                  value={contactoNombre}
                  onChange={(e) => setContactoNombre(e.target.value)}
                  placeholder="Nombre"
                />
              </Field>
              <Field label="Teléfono de emergencia (opcional)" htmlFor="ctel">
                <Input
                  id="ctel"
                  inputMode="tel"
                  maxLength={40}
                  value={contactoTelefono}
                  onChange={(e) => setContactoTelefono(e.target.value)}
                  placeholder="+54 9 …"
                />
              </Field>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Especie" htmlFor="especie">
                <Input
                  id="especie"
                  required
                  maxLength={60}
                  value={especie}
                  onChange={(e) => setEspecie(e.target.value)}
                  placeholder="Perro, gato, ave…"
                />
              </Field>
              <Field label="Raza (opcional)" htmlFor="raza">
                <Input
                  id="raza"
                  maxLength={60}
                  value={raza}
                  onChange={(e) => setRaza(e.target.value)}
                  placeholder="Labrador, mestizo…"
                />
              </Field>
            </div>
            <Field label="Fecha de nacimiento (opcional)" htmlFor="fnac-a">
              <Input
                id="fnac-a"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
              />
            </Field>
          </>
        )}

        <Field
          label="Notas relevantes (opcional)"
          htmlFor="notas"
          ayuda="Alergias, medicación o antecedentes que el profesional deba saber."
        >
          <Textarea
            id="notas"
            rows={3}
            maxLength={2000}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Información médica relevante…"
          />
        </Field>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton
            type="button"
            variante="secundario"
            onClick={onCerrar}
            disabled={submitting}
          >
            Cancelar
          </Boton>
          <Boton type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Agregar"}
          </Boton>
        </div>
      </form>
    </Dialogo>
  );
}
