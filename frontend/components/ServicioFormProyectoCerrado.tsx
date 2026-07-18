"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  crearServicioProyectoCerrado,
  actualizarServicioProyectoCerrado,
  esProyectoCerrado,
  type FormatoEntrega,
  type ServicioDetalleResponse,
} from "@/lib/servicios";
import {
  listarServiciosPermitidos,
  type CatalogoServicioResponse,
} from "@/lib/catalogo";
import type { CarreraPortafolio } from "@/lib/portafolio";
import { ApiError } from "@/lib/api";
import { ErrorAlert, Field, Input, Select } from "@/components/ui";

const FORMATOS: FormatoEntrega[] = ["Archivos", "Link", "Ambos"];

export function ServicioFormProyectoCerrado({
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
  const detalle =
    servicio && esProyectoCerrado(servicio) ? servicio.detalle : undefined;

  const [carreraId, setCarreraId] = useState<number>(
    carreras[0]?.carreraId ?? 0,
  );
  const [catalogo, setCatalogo] = useState<CatalogoServicioResponse[]>([]);
  const [catalogoServicioId, setCatalogoServicioId] = useState<number>(
    detalle?.catalogoServicioId ?? 0,
  );
  const [titulo, setTitulo] = useState(servicio?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(servicio?.descripcion ?? "");
  const [precio, setPrecio] = useState(servicio ? String(servicio.precio) : "");
  const [plazoEntregaDias, setPlazoEntregaDias] = useState(
    detalle ? String(detalle.plazoEntregaDias) : "",
  );
  const [revisionesIncluidas, setRevisionesIncluidas] = useState(
    detalle ? String(detalle.revisionesIncluidas) : "2",
  );
  const [formatoEntrega, setFormatoEntrega] = useState<FormatoEntrega>(
    detalle?.formatoEntrega ?? "Archivos",
  );
  const [imagenUrl, setImagenUrl] = useState(servicio?.imagenUrl ?? "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Catalogo de ProyectoCerrado disponible para la carrera + año elegidos.
  useEffect(() => {
    let cancelado = false;
    if (!carreraId || anioCursado <= 0) {
      setCatalogo([]);
      return;
    }
    listarServiciosPermitidos(carreraId, anioCursado)
      .then((entradas) => {
        if (!cancelado)
          setCatalogo(entradas.filter((e) => e.tipoServicio === "ProyectoCerrado"));
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

    if (!catalogoServicioId) {
      setError("Elegí un servicio del catálogo.");
      return;
    }
    const precioNum = Number(precio);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      setError("El precio debe ser un número mayor a 0.");
      return;
    }
    const plazoNum = Number(plazoEntregaDias);
    if (!Number.isInteger(plazoNum) || plazoNum <= 0) {
      setError("El plazo de entrega debe ser un número entero de días mayor a 0.");
      return;
    }
    const revisionesNum = Number(revisionesIncluidas);
    if (!Number.isInteger(revisionesNum) || revisionesNum < 0) {
      setError("Las revisiones incluidas deben ser un número entero.");
      return;
    }

    const req = {
      titulo: titulo.trim() || (seleccionado?.nombre ?? ""),
      descripcion: descripcion.trim(),
      precio: precioNum,
      catalogoServicioId,
      plazoEntregaDias: plazoNum,
      revisionesIncluidas: revisionesNum,
      formatoEntrega,
      imagenUrl: imagenUrl.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (servicio) await actualizarServicioProyectoCerrado(servicio.id, req);
      else await crearServicioProyectoCerrado(req);
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
      titulo={editando ? "Editar proyecto cerrado" : "Publicar proyecto cerrado"}
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

      <Field label="Servicio del catálogo" htmlFor="catalogo">
        <Select
          id="catalogo"
          value={catalogoServicioId}
          onChange={(e) => setCatalogoServicioId(Number(e.target.value))}
        >
          <option value={0}>Elegí un servicio…</option>
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
          placeholder="Contá qué incluye el servicio…"
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
            placeholder="25000"
          />
        </Field>
        <Field label="Plazo de entrega (días)" htmlFor="plazo">
          <Input
            id="plazo"
            type="number"
            min="1"
            step="1"
            required
            value={plazoEntregaDias}
            onChange={(e) => setPlazoEntregaDias(e.target.value)}
            placeholder="7"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Revisiones incluidas" htmlFor="revisiones">
          <Input
            id="revisiones"
            type="number"
            min="0"
            step="1"
            value={revisionesIncluidas}
            onChange={(e) => setRevisionesIncluidas(e.target.value)}
          />
        </Field>
        <Field label="Formato de entrega" htmlFor="formato">
          <Select
            id="formato"
            value={formatoEntrega}
            onChange={(e) => setFormatoEntrega(e.target.value as FormatoEntrega)}
          >
            {FORMATOS.map((f) => (
              <option key={f} value={f}>
                {f === "Link" ? "Enlace" : f}
              </option>
            ))}
          </Select>
        </Field>
      </div>

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

// --- Shell de modal reutilizado por los tres forms de servicio ---
export function FormShell({
  titulo,
  onCerrar,
  onSubmit,
  submitting,
  error,
  submitLabel,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCerrar}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {error && <ErrorAlert message={error} />}
          {children}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Guardando…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
