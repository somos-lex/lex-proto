"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAhora } from "@/lib/useAhora";
import {
  fechaARDe,
  listarMateriasHabilitadas,
  localARaUtcIso,
  publicarPractica,
  type Materia,
  type PracticaDetalle,
} from "@/lib/practicas";
import type { TipoPaciente } from "@/lib/pacientes";
import { ApiError } from "@/lib/api";
import { ErrorAlert, Field, Input, Select } from "@/components/ui";

const DURACIONES = [30, 45, 60, 90, 120, 180, 240];

// Alta de una práctica. El selector solo ofrece las materias para las que el estudiante
// puede publicar HOY (carrera verificada + año mínimo): la misma regla que valida el
// backend, así no se ofrece algo que después se rechaza.
export function PublicarPracticaForm({
  onCerrar,
  onPublicada,
}: {
  onCerrar: () => void;
  onPublicada: (p: PracticaDetalle) => void;
}) {
  const ahora = useAhora();
  const [materias, setMaterias] = useState<Materia[] | null>(null);
  const [cargaError, setCargaError] = useState<string | null>(null);

  const [materiaId, setMateriaId] = useState(0);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("09:00");
  const [duracion, setDuracion] = useState(60);
  const [lugar, setLugar] = useState("");
  const [tipo, setTipo] = useState<TipoPaciente>("Humano");
  const [requisitos, setRequisitos] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    listarMateriasHabilitadas()
      .then((data) => {
        if (!cancelado) setMaterias(data);
      })
      .catch((err) => {
        if (!cancelado)
          setCargaError(err instanceof ApiError ? err.message : "No pudimos cargar tus materias.");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  function elegirMateria(id: number) {
    setMateriaId(id);
    // Sugerencia, no regla: en Medicina Veterinaria el paciente casi siempre es un animal.
    const m = materias?.find((x) => x.id === id);
    if (m) setTipo(/veterin/i.test(m.carreraNombre) ? "Animal" : "Humano");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!materiaId) return setError("Elegí la materia.");
    if (!fecha || !hora) return setError("Indicá fecha y hora de la práctica.");
    if (!lugar.trim()) return setError("Indicá el lugar (cátedra, aula o box).");

    setEnviando(true);
    try {
      const practica = await publicarPractica({
        materiaId,
        fechaHoraInicio: localARaUtcIso(fecha, hora),
        duracionMinutos: duracion,
        lugar: lugar.trim(),
        tipoPacienteRequerido: tipo,
        requisitosPrevios: requisitos.trim() || undefined,
      });
      onPublicada(practica);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos publicar la práctica.");
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCerrar}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">Publicar práctica</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            ✕
          </button>
        </div>

        {cargaError && (
          <div className="mt-4">
            <ErrorAlert message={cargaError} />
          </div>
        )}

        {materias === null && !cargaError && <div className="mt-4 h-64 animate-pulse rounded-xl bg-slate-100" />}

        {materias !== null && materias.length === 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Todavía no podés publicar prácticas.</p>
            <p className="mt-1">
              Hace falta que tu carrera esté verificada por LEX y que cursés al menos el año de la
              materia. Si ya pediste la verificación, está pendiente de revisión.
            </p>
            <Link href="/practicas" className="mt-2 inline-block font-semibold text-amber-900 underline">
              Ver prácticas publicadas
            </Link>
          </div>
        )}

        {materias !== null && materias.length > 0 && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && <ErrorAlert message={error} />}

            <Field label="Materia" htmlFor="materia">
              <Select id="materia" value={materiaId} onChange={(e) => elegirMateria(Number(e.target.value))}>
                <option value={0}>Elegí una materia…</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} — {m.carreraNombre} ({m.anioMinimo}° año)
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha" htmlFor="fecha">
                <Input
                  id="fecha"
                  type="date"
                  min={ahora !== null ? fechaARDe(ahora) : undefined}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </Field>
              <Field label="Hora (Argentina)" htmlFor="hora">
                <Input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Duración" htmlFor="duracion">
                <Select id="duracion" value={duracion} onChange={(e) => setDuracion(Number(e.target.value))}>
                  {DURACIONES.map((d) => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Paciente" htmlFor="tipo">
                <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoPaciente)}>
                  <option value="Humano">Humano</option>
                  <option value="Animal">Animal</option>
                </Select>
              </Field>
            </div>

            <Field label="Lugar" htmlFor="lugar">
              <Input
                id="lugar"
                value={lugar}
                maxLength={200}
                placeholder="Ej: Clínica de la FOUNNE, Av. Libertad 5450, box 12"
                onChange={(e) => setLugar(e.target.value)}
              />
            </Field>

            <Field label="Requisitos previos (opcional)" htmlFor="requisitos">
              <textarea
                id="requisitos"
                rows={3}
                maxLength={2000}
                value={requisitos}
                placeholder="Ej: el animal debe tener el plan de vacunación al día y venir en ayunas."
                onChange={(e) => setRequisitos(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-focus/20"
              />
            </Field>

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {enviando ? "Publicando…" : "Publicar práctica"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
