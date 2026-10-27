"use client";

// Alta y edición de un horario semanal (un bloque de disponibilidad), en la hoja
// de formularios del panel.

import { useState, type FormEvent } from "react";
import {
  crearBloque,
  actualizarBloque,
  DIAS_SEMANA,
  type BloqueDisponibilidadResponse,
  type DiaSemana,
} from "@/lib/disponibilidad";
import { ApiError } from "@/lib/api";
import { Field, Input, Select } from "@/components/ui";
import { HojaFormulario } from "@/components/panel/HojaFormulario";

// El input HTML type="time" trabaja con "HH:mm"; el backend espera "HH:mm:ss".
function aHoraBackend(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}
function aHoraInput(hhmmss: string): string {
  return hhmmss.slice(0, 5);
}

export function BloqueDisponibilidadForm({
  bloque,
  onCerrar,
  onExito,
}: {
  bloque?: BloqueDisponibilidadResponse;
  onCerrar: () => void;
  onExito: (guardado: { diaSemana: DiaSemana; horaInicio: string; horaFin: string }) => void;
}) {
  const editando = Boolean(bloque);
  const [diaSemana, setDiaSemana] = useState<DiaSemana>(bloque?.diaSemana ?? "Lunes");
  const [horaInicio, setHoraInicio] = useState(bloque ? aHoraInput(bloque.horaInicio) : "09:00");
  const [horaFin, setHoraFin] = useState(bloque ? aHoraInput(bloque.horaFin) : "12:00");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const finAntes = !!horaInicio && !!horaFin && horaInicio >= horaFin;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!horaInicio || !horaFin) return setError("Completá las dos horas.");
    if (horaInicio >= horaFin) return setError("La hora de fin tiene que ser después de la de inicio.");

    const req = {
      diaSemana,
      horaInicio: aHoraBackend(horaInicio),
      horaFin: aHoraBackend(horaFin),
    };

    setSubmitting(true);
    try {
      if (bloque) await actualizarBloque(bloque.id, req);
      else await crearBloque(req);
      onExito(req);
    } catch (err) {
      // El backend puede devolver 400 por superposición con otro bloque del mismo día.
      setError(err instanceof ApiError ? err.message : "No pudimos guardar el horario. Probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <HojaFormulario
      titulo={editando ? "Editar horario" : "Agregar horario"}
      descripcion="Se repite cada semana. Quien contrata elige un turno dentro de este horario."
      onCerrar={onCerrar}
      onSubmit={handleSubmit}
      enviando={submitting}
      error={error}
      enviar={editando ? "Guardar cambios" : "Agregar horario"}
    >
      <div className="grid gap-5">
        <Field label="Día" htmlFor="dia">
          <Select id="dia" value={diaSemana} onChange={(e) => setDiaSemana(e.target.value as DiaSemana)}>
            {DIAS_SEMANA.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.etiqueta}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 items-start gap-3">
          <Field label="Desde" htmlFor="inicio">
            <Input id="inicio" type="time" required value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </Field>
          <Field label="Hasta" htmlFor="fin" error={finAntes ? "Tiene que ser después de la hora de inicio." : null}>
            <Input
              id="fin"
              type="time"
              required
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              aria-invalid={finAntes || undefined}
              aria-describedby={finAntes ? "fin-error" : undefined}
            />
          </Field>
        </div>
        <p className="-mt-2 text-[14px] text-ink-2">En hora de Argentina.</p>
      </div>
    </HojaFormulario>
  );
}
