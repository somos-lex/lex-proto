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
import { Aviso } from "@/components/ds/Aviso";
import { Cargando, Esqueleto } from "@/components/ds/Estados";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { HojaFormulario } from "@/components/panel/HojaFormulario";

const DURACIONES = [30, 45, 60, 90, 120, 180, 240];

// Alta de un turno del Banco. El selector solo ofrece las materias para las que el
// estudiante puede publicar HOY (carrera verificada + año mínimo): la misma regla que
// valida el backend, así no se ofrece algo que después se rechaza.
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
        if (!cancelado) setCargaError(err instanceof ApiError ? err.message : "No hay conexión con LEX. Cerrá y probá de nuevo.");
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
    if (!fecha || !hora) return setError("Indicá la fecha y la hora del turno.");
    if (!lugar.trim()) return setError("Indicá el lugar: la cátedra, el aula o el box.");

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
      setError(err instanceof ApiError ? err.message : "No pudimos publicar el turno. Probá de nuevo.");
      setEnviando(false);
    }
  }

  const titulo = "Publicar un turno";
  const descripcion = "Para una materia de tu carrera que necesita un paciente. Quien se inscribe se atiende sin costo.";

  if (cargaError)
    return (
      <HojaFormulario titulo={titulo} descripcion={descripcion} onCerrar={onCerrar}>
        <Aviso tono="danger" titulo="No pudimos cargar tus materias.">
          {cargaError}
        </Aviso>
      </HojaFormulario>
    );

  if (materias === null)
    return (
      <HojaFormulario titulo={titulo} descripcion={descripcion} onCerrar={onCerrar}>
        <Cargando etiqueta="Cargando tus materias">
          <div className="grid gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid gap-1.5">
                <Esqueleto className="h-4 w-24" />
                <Esqueleto className="h-12 rounded-control" />
              </div>
            ))}
          </div>
        </Cargando>
      </HojaFormulario>
    );

  if (materias.length === 0)
    return (
      <HojaFormulario titulo={titulo} descripcion={descripcion} onCerrar={onCerrar}>
        <Aviso
          tono="warn"
          titulo="Todavía no podés publicar turnos:"
          acciones={
            <>
              <Link href="/panel/perfil">Ver mi verificación</Link>
              <Link href="/practicas">Ver el Banco de Turnos</Link>
            </>
          }
        >
          hace falta que LEX verifique tu carrera y que cursés al menos el año de la materia. Si ya pediste la verificación, está en
          revisión.
        </Aviso>
      </HojaFormulario>
    );

  return (
    <HojaFormulario
      titulo={titulo}
      descripcion={descripcion}
      onCerrar={onCerrar}
      onSubmit={handleSubmit}
      enviando={enviando}
      error={error}
      enviar="Publicar el turno"
    >
      <div className="grid gap-5">
        <Field label="Materia" htmlFor="materia">
          <Select id="materia" value={materiaId} onChange={(e) => elegirMateria(Number(e.target.value))}>
            <option value={0}>Elegí una materia…</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.carreraNombre}, desde {m.anioMinimo}.º año)
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 items-end gap-3">
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

        <div className="grid grid-cols-2 items-end gap-3">
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
              <option value="Humano">Una persona</option>
              <option value="Animal">Una mascota</option>
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

        <Field label="Requisitos previos (opcional)" htmlFor="requisitos" ayuda="Lo que tiene que traer o cumplir quien se inscribe.">
          <Textarea
            id="requisitos"
            rows={3}
            maxLength={2000}
            value={requisitos}
            placeholder="Ej: el animal debe tener el plan de vacunación al día y venir en ayunas."
            onChange={(e) => setRequisitos(e.target.value)}
            aria-describedby="requisitos-ayuda"
          />
        </Field>
      </div>
    </HojaFormulario>
  );
}
