"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  crearServicioSalud,
  actualizarServicioSalud,
  esSalud,
  type ModalidadSalud,
  type ServicioDetalleResponse,
} from "@/lib/servicios";
import {
  listarServiciosPermitidos,
  listarSupervisores,
  type CatalogoServicioResponse,
  type ProfesionalSupervisorResponse,
} from "@/lib/catalogo";
import type { CarreraPortafolio } from "@/lib/portafolio";
import { ApiError } from "@/lib/api";
import { Field, Input, Select } from "@/components/ui";
import { FormShell } from "@/components/ServicioFormProyectoCerrado";

const MODALIDADES: ModalidadSalud[] = ["Domicilio", "Consultorio", "Ambas"];

export function ServicioFormSalud({
  servicio,
  carreras,
  anioCursado,
  onCerrar,
  onExito,
}: {
  servicio?: ServicioDetalleResponse;
  carreras: CarreraPortafolio[];
  anioCursado: number;
  onCerrar: () => void;
  onExito: () => void;
}) {
  const editando = Boolean(servicio);
  const detalle = servicio && esSalud(servicio) ? servicio.detalle : undefined;

  const [carreraId, setCarreraId] = useState<number>(
    carreras[0]?.carreraId ?? 0,
  );
  const [catalogo, setCatalogo] = useState<CatalogoServicioResponse[]>([]);
  const [supervisores, setSupervisores] = useState<
    ProfesionalSupervisorResponse[]
  >([]);
  const [catalogoServicioId, setCatalogoServicioId] = useState<number>(
    detalle?.catalogoServicioId ?? 0,
  );
  const [supervisorId, setSupervisorId] = useState<number>(
    detalle?.supervisorId ?? 0,
  );
  const [titulo, setTitulo] = useState(servicio?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(servicio?.descripcion ?? "");
  const [precio, setPrecio] = useState(servicio ? String(servicio.precio) : "");
  const [modalidad, setModalidad] = useState<ModalidadSalud>(
    detalle?.modalidad ?? "Consultorio",
  );
  const [duracion, setDuracion] = useState(
    detalle ? String(detalle.duracionMinutosSesion) : "45",
  );
  const [imagenUrl, setImagenUrl] = useState(servicio?.imagenUrl ?? "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Supervisores matriculados (una sola vez).
  useEffect(() => {
    let cancelado = false;
    listarSupervisores()
      .then((s) => !cancelado && setSupervisores(s))
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar los supervisores.",
          );
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Catalogo de Salud para la carrera + año.
  useEffect(() => {
    let cancelado = false;
    if (!carreraId || anioCursado <= 0) {
      setCatalogo([]);
      return;
    }
    listarServiciosPermitidos(carreraId, anioCursado)
      .then((entradas) => {
        if (!cancelado)
          setCatalogo(entradas.filter((e) => e.tipoServicio === "Salud"));
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError ? err.message : "No pudimos cargar el catálogo.",
          );
      });
    return () => {
      cancelado = true;
    };
  }, [carreraId, anioCursado]);

  const seleccionado = useMemo(
    () => catalogo.find((c) => c.id === catalogoServicioId),
    [catalogo, catalogoServicioId],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!catalogoServicioId) return setError("Elegí un servicio del catálogo.");
    if (!supervisorId) return setError("Elegí un supervisor matriculado.");

    const precioNum = Number(precio);
    if (!Number.isFinite(precioNum) || precioNum <= 0)
      return setError("El precio debe ser un número mayor a 0.");

    const duracionNum = Number(duracion);
    if (!Number.isInteger(duracionNum) || duracionNum <= 0)
      return setError("La duración por sesión debe ser un entero de minutos.");

    const req = {
      titulo: titulo.trim() || (seleccionado?.nombre ?? ""),
      descripcion: descripcion.trim(),
      precio: precioNum,
      catalogoServicioId,
      supervisorId,
      modalidad,
      duracionMinutosSesion: duracionNum,
      imagenUrl: imagenUrl.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (servicio) await actualizarServicioSalud(servicio.id, req);
      else await crearServicioSalud(req);
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
      titulo={editando ? "Editar servicio de salud" : "Publicar servicio de salud"}
      onCerrar={onCerrar}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
      submitLabel={editando ? "Guardar cambios" : "Publicar"}
    >
      {carreras.length > 1 && (
        <Field label="Carrera" htmlFor="carrera">
          <Select
            id="carrera"
            value={carreraId}
            onChange={(e) => {
              setCarreraId(Number(e.target.value));
              setCatalogoServicioId(0);
            }}
          >
            {carreras.map((c) => (
              <option key={c.carreraId} value={c.carreraId}>
                {c.carrera}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Práctica del catálogo" htmlFor="catalogo">
        <Select
          id="catalogo"
          value={catalogoServicioId}
          onChange={(e) => setCatalogoServicioId(Number(e.target.value))}
        >
          <option value={0}>Elegí una práctica…</option>
          {catalogo.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </Field>

      {seleccionado && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {seleccionado.descripcion}
          {seleccionado.observaciones && (
            <span className="mt-1 block text-slate-400">
              {seleccionado.observaciones}
            </span>
          )}
        </p>
      )}

      <Field label="Supervisor matriculado" htmlFor="supervisor">
        <Select
          id="supervisor"
          value={supervisorId}
          onChange={(e) => setSupervisorId(Number(e.target.value))}
        >
          <option value={0}>Elegí un supervisor…</option>
          {supervisores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombreCompleto} — Matrícula {s.matricula}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Título" htmlFor="titulo">
        <Input
          id="titulo"
          maxLength={150}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder={seleccionado?.nombre ?? "Título del servicio"}
        />
      </Field>

      <Field label="Descripción" htmlFor="descripcion">
        <textarea
          id="descripcion"
          rows={3}
          maxLength={1000}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Contá en qué consiste la práctica…"
          className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </Field>

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
            placeholder="12000"
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

      <Field label="Modalidad" htmlFor="modalidad">
        <Select
          id="modalidad"
          value={modalidad}
          onChange={(e) => setModalidad(e.target.value as ModalidadSalud)}
        >
          {MODALIDADES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </Field>

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
