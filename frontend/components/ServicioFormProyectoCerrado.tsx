"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  crearServicioProyectoCerrado,
  actualizarServicioProyectoCerrado,
  esProyectoCerrado,
  type FormatoEntrega,
  type ServicioDetalleResponse,
} from "@/lib/servicios";
import { listarServiciosPermitidos } from "@/lib/catalogo";
import type { CarreraPortafolio } from "@/lib/portafolio";
import { ApiError } from "@/lib/api";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { HojaFormulario } from "@/components/panel/HojaFormulario";
import { useCarga } from "@/components/panel/useCarga";

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

  // Catálogo de ProyectoCerrado disponible para la carrera + año elegidos.
  const catalogoCarga = useCarga(
    carreraId && anioCursado > 0 ? `catalogo-ProyectoCerrado-${carreraId}-${anioCursado}` : null,
    () => listarServiciosPermitidos(carreraId, anioCursado),
  );
  const catalogo = useMemo(
    () => (catalogoCarga.datos ?? []).filter((e) => e.tipoServicio === "ProyectoCerrado"),
    [catalogoCarga.datos],
  );

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

  const estadoCatalogo = catalogoCarga.error
    ? { error: `No pudimos cargar el catálogo. ${catalogoCarga.error}` }
    : catalogoCarga.datos && catalogo.length === 0
      ? { ayuda: "Tu carrera no tiene entradas de esta vertical en el catálogo para tu año." }
      : {};

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

      <Field label="Servicio del catálogo" htmlFor="catalogo" {...estadoCatalogo}>
        <Select
          id="catalogo"
          disabled={catalogoCarga.cargando}
          value={catalogoServicioId}
          onChange={(e) => setCatalogoServicioId(Number(e.target.value))}
        >
          <option value={0}>{catalogoCarga.cargando ? "Cargando el catálogo…" : "Elegí un servicio…"}</option>
          {catalogo.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </Field>

      {seleccionado && (
        <DetalleCatalogo descripcion={seleccionado.descripcion} observaciones={seleccionado.observaciones} />
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
        <Textarea
          id="descripcion"
          rows={3}
          maxLength={1000}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Contá qué incluye el servicio…"
        />
      </Field>

      <div className="grid grid-cols-2 items-end gap-3">
        <Field label="Precio ($)" htmlFor="precio">
          <Input
            id="precio"
            type="number"
            inputMode="numeric"
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
            inputMode="numeric"
            min="1"
            step="1"
            required
            value={plazoEntregaDias}
            onChange={(e) => setPlazoEntregaDias(e.target.value)}
            placeholder="7"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 items-end gap-3">
        <Field label="Revisiones incluidas" htmlFor="revisiones">
          <Input
            id="revisiones"
            type="number"
            inputMode="numeric"
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

// --- La hoja que comparten los tres formularios de servicio ---
export function FormShell({
  titulo,
  descripcion,
  onCerrar,
  onSubmit,
  submitting,
  error,
  submitLabel,
  children,
}: {
  titulo: string;
  descripcion?: React.ReactNode;
  onCerrar: () => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <HojaFormulario
      titulo={titulo}
      descripcion={descripcion}
      onCerrar={onCerrar}
      onSubmit={onSubmit}
      enviando={submitting}
      error={error}
      enviar={submitLabel}
    >
      <div className="grid gap-5">{children}</div>
    </HojaFormulario>
  );
}

/** La descripción de la entrada del catálogo elegida, para decidir con ella. */
export function DetalleCatalogo({ descripcion, observaciones }: { descripcion: string; observaciones?: string | null }) {
  return (
    <div className="-mt-2 rounded-control bg-surface-2 px-4 py-3 text-[15px] leading-[1.45] text-ink-2">
      <p>{descripcion}</p>
      {observaciones && <p className="mt-1">{observaciones}</p>}
    </div>
  );
}
