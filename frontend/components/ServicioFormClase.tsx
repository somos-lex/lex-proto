"use client";

import { useState, type FormEvent } from "react";
import {
  crearServicioClase,
  actualizarServicioClase,
  esClase,
  type ModalidadClase,
  type NivelClase,
  type ServicioDetalleResponse,
} from "@/lib/servicios";
import { ApiError } from "@/lib/api";
import { Field, Input, Select } from "@/components/ui";
import { FormShell } from "@/components/ServicioFormProyectoCerrado";

const NIVELES: NivelClase[] = [
  "Primario",
  "Secundario",
  "Universitario",
  "Adulto",
  "Idioma",
  "Otro",
];
const MODALIDADES: ModalidadClase[] = ["Online", "Presencial", "Ambas"];

export function ServicioFormClase({
  servicio,
  onCerrar,
  onExito,
}: {
  servicio?: ServicioDetalleResponse;
  onCerrar: () => void;
  onExito: () => void;
}) {
  const editando = Boolean(servicio);
  const detalle = servicio && esClase(servicio) ? servicio.detalle : undefined;

  const [titulo, setTitulo] = useState(servicio?.titulo ?? "");
  const [materia, setMateria] = useState(detalle?.materia ?? "");
  const [descripcion, setDescripcion] = useState(servicio?.descripcion ?? "");
  const [nivel, setNivel] = useState<NivelClase>(detalle?.nivel ?? "Universitario");
  const [modalidad, setModalidad] = useState<ModalidadClase>(
    detalle?.modalidad ?? "Online",
  );
  const [precio, setPrecio] = useState(servicio ? String(servicio.precio) : "");
  const [duracion, setDuracion] = useState(
    detalle ? String(detalle.duracionMinutosSesion) : "60",
  );
  const [esPaquete, setEsPaquete] = useState(detalle?.esPaquete ?? false);
  const [cantidadSesiones, setCantidadSesiones] = useState(
    detalle?.cantidadSesionesPaquete != null
      ? String(detalle.cantidadSesionesPaquete)
      : "",
  );
  const [imagenUrl, setImagenUrl] = useState(servicio?.imagenUrl ?? "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) return setError("Poné un título.");
    if (!materia.trim()) return setError("Indicá la materia.");

    const precioNum = Number(precio);
    if (!Number.isFinite(precioNum) || precioNum <= 0)
      return setError("El precio debe ser un número mayor a 0.");

    const duracionNum = Number(duracion);
    if (!Number.isInteger(duracionNum) || duracionNum <= 0)
      return setError("La duración por sesión debe ser un entero de minutos.");

    let sesionesNum: number | undefined;
    if (esPaquete) {
      sesionesNum = Number(cantidadSesiones);
      if (!Number.isInteger(sesionesNum) || sesionesNum <= 1)
        return setError("Un paquete debe tener 2 o más sesiones.");
    }

    const req = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      precio: precioNum,
      materia: materia.trim(),
      nivel,
      modalidad,
      duracionMinutosSesion: duracionNum,
      esPaquete,
      cantidadSesionesPaquete: sesionesNum,
      imagenUrl: imagenUrl.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (servicio) await actualizarServicioClase(servicio.id, req);
      else await crearServicioClase(req);
      onExito();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No pudimos guardar el servicio.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormShell
      titulo={editando ? "Editar clase" : "Publicar clase / tutoría"}
      onCerrar={onCerrar}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
      submitLabel={editando ? "Guardar cambios" : "Publicar"}
    >
      <Field label="Título" htmlFor="titulo">
        <Input
          id="titulo"
          required
          maxLength={150}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Clases de cálculo para ingreso"
        />
      </Field>

      <Field label="Materia" htmlFor="materia">
        <Input
          id="materia"
          required
          maxLength={100}
          value={materia}
          onChange={(e) => setMateria(e.target.value)}
          placeholder="Ej: Matemática, Inglés"
        />
      </Field>

      <Field label="Descripción" htmlFor="descripcion">
        <textarea
          id="descripcion"
          rows={3}
          maxLength={1000}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Contá cómo son tus clases…"
          className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nivel" htmlFor="nivel">
          <Select
            id="nivel"
            value={nivel}
            onChange={(e) => setNivel(e.target.value as NivelClase)}
          >
            {NIVELES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Modalidad" htmlFor="modalidad">
          <Select
            id="modalidad"
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value as ModalidadClase)}
          >
            {MODALIDADES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio ($)" htmlFor="precio">
          <Input
            id="precio"
            type="number"
            min="1"
            step="any"
            required
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="8000"
          />
        </Field>
        <Field label="Duración por sesión (min)" htmlFor="duracion">
          <Input
            id="duracion"
            type="number"
            min="1"
            step="1"
            required
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          className="accent-indigo-600"
          checked={esPaquete}
          onChange={(e) => setEsPaquete(e.target.checked)}
        />
        <span>Es un paquete de varias sesiones</span>
      </label>

      {esPaquete && (
        <Field label="Cantidad de sesiones del paquete" htmlFor="sesiones">
          <Input
            id="sesiones"
            type="number"
            min="2"
            step="1"
            required
            value={cantidadSesiones}
            onChange={(e) => setCantidadSesiones(e.target.value)}
            placeholder="4"
          />
        </Field>
      )}

      <Field label="Imagen de portada (URL, opcional)" htmlFor="imagen">
        <Input
          id="imagen"
          type="url"
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
          placeholder="https://…"
        />
      </Field>
    </FormShell>
  );
}
