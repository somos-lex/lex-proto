"use client";

// El pago protegido de un trabajo: cuánto se pagó, cuánto va al estudiante y
// cuánto es la comisión de LEX, en qué está y el libro de movimientos. Nunca
// "escrow": el concepto es pago protegido.

import { useCallback, useEffect, useState } from "react";
import {
  listarMisPagos,
  obtenerPagoDetalle,
  type EstadoPago,
  type MovimientoPagoResponse,
  type PagoDetalleResponse,
  type TipoMovimientoPago,
} from "@/lib/pagos";
import type { TrabajoResponse } from "@/lib/trabajos";
import type { RolEnTrabajo } from "@/lib/transicionesTrabajo";
import { formatPrecio } from "@/lib/servicios";
import { Boton } from "@/components/Boton";
import { Icono, type NombreIcono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Chip, type TonoChip } from "@/components/ds/Chip";
import { Esqueleto } from "@/components/ds/Estados";
import { Tesela } from "@/components/ds/Lista";
import { mensajeDeError } from "@/components/trabajo/errores";
import { fechaHora } from "@/components/trabajo/estado";

const ESTADO_PAGO: Record<EstadoPago, { cliente: string; estudiante: string; tono: TonoChip; icono: NombreIcono }> = {
  Retenido: { cliente: "Protegido por LEX", estudiante: "Protegido por LEX", tono: "neutro", icono: "shield" },
  ParcialmenteLiberado: { cliente: "Liberándose", estudiante: "Cobrando por sesión", tono: "neutro", icono: "refresh" },
  Liberado: { cliente: "Pagado al estudiante", estudiante: "Cobrado", tono: "ok", icono: "check-circle" },
  Reembolsado: { cliente: "Devuelto", estudiante: "Devuelto al cliente", tono: "neutro", icono: "refresh" },
  EnDisputa: { cliente: "Congelado", estudiante: "Congelado", tono: "danger", icono: "alert" },
};

const MOVIMIENTOS_A_LA_VISTA = 4;

export function PagoProgreso({ trabajo, rolUsuario }: { trabajo: TrabajoResponse; rolUsuario: RolEnTrabajo }) {
  const [pago, setPago] = useState<PagoDetalleResponse | null | "sin-pago">(null);
  const [error, setError] = useState<string | null>(null);
  const [todos, setTodos] = useState(false);

  const cargar = useCallback(async () => {
    setError(null);
    setPago(null);
    try {
      const resumen = (await listarMisPagos()).find((p) => p.trabajoId === trabajo.id);
      // Un trabajo anterior al módulo de pagos no tiene pago: no se muestra nada.
      setPago(resumen ? await obtenerPagoDetalle(resumen.id) : "sin-pago");
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }, [trabajo.id]);

  useEffect(() => {
    let vigente = true;
    listarMisPagos()
      .then(async (resumenes) => {
        const resumen = resumenes.find((p) => p.trabajoId === trabajo.id);
        const detalle = resumen ? await obtenerPagoDetalle(resumen.id) : "sin-pago";
        if (vigente) setPago(detalle);
      })
      .catch((err) => vigente && setError(mensajeDeError(err)));
    return () => {
      vigente = false;
    };
  }, [trabajo.id]);

  const titulo = (
    <h2 id="titulo-pago" className="flex items-center gap-2 text-title-3">
      <Icono nombre="shield" className="size-5.5 text-ink-2" />
      Pago protegido
    </h2>
  );

  if (error) {
    return (
      <section aria-labelledby="titulo-pago" className="grid gap-3">
        {titulo}
        <Aviso
          tono="danger"
          titulo="No pudimos cargar el pago."
          acciones={
            <Boton variante="secundario" tamano="sm" onClick={cargar}>
              <Icono nombre="refresh" />
              Reintentar
            </Boton>
          }
        >
          {error}
        </Aviso>
      </section>
    );
  }
  if (pago === "sin-pago") return null;
  if (pago === null) {
    return (
      <section aria-labelledby="titulo-pago" aria-busy="true" className="grid gap-3 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
        {titulo}
        <span className="sr-only">Cargando el pago</span>
        <Esqueleto className="h-8 w-36" />
        <Esqueleto className="h-2 w-full rounded-pill" />
        <Esqueleto className="h-4 w-4/5" />
        <Esqueleto className="h-4 w-3/5" />
      </section>
    );
  }

  const soyEstudiante = rolUsuario === "Estudiante";
  const est = ESTADO_PAGO[pago.estado];
  const liberado = suma(pago.movimientos, "LiberacionEstudiante");
  const devuelto = suma(pago.movimientos, "Reembolso");
  const progreso = pago.montoAEstudiante > 0 ? Math.min(100, Math.round((liberado / pago.montoAEstudiante) * 100)) : 0;
  const porSesiones = trabajo.tipo !== "ProyectoCerrado";
  const comision = `Comisión de LEX (${pago.porcentajeComisionLex.toLocaleString("es-AR")} %)`;
  const movimientos = [...pago.movimientos].sort((a, b) => a.fechaMovimiento.localeCompare(b.fechaMovimiento) || a.id - b.id);
  const visibles = todos ? movimientos : movimientos.slice(0, MOVIMIENTOS_A_LA_VISTA);

  return (
    <section aria-labelledby="titulo-pago" className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      <div className="grid gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {titulo}
          <Chip tono={est.tono} icono={est.icono}>
            {soyEstudiante ? est.estudiante : est.cliente}
          </Chip>
        </div>

        <div>
          <p className="text-[14px] font-medium text-ink-2">{soyEstudiante ? `${trabajo.clienteNombre} pagó` : "Pagaste"}</p>
          <p className="text-amount-lg">{formatPrecio(pago.montoTotal)}</p>
        </div>

        <p className="text-secondary text-ink-2">{explicacion(pago.estado, soyEstudiante, porSesiones, trabajo)}</p>

        {pago.estado !== "Reembolsado" && (
          <div className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-[15px]">
              <span className="text-ink-2">{soyEstudiante ? "Cobraste" : `Pagado a ${trabajo.estudianteNombre}`}</span>
              <span className="font-semibold">
                {formatPrecio(liberado)} <span className="font-normal text-ink-2">de {formatPrecio(pago.montoAEstudiante)}</span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={soyEstudiante ? "Lo que ya cobraste" : `Lo que ya se le pagó a ${trabajo.estudianteNombre}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progreso}
              aria-valuetext={`${formatPrecio(liberado)} de ${formatPrecio(pago.montoAEstudiante)}`}
              className="h-2 overflow-hidden rounded-pill bg-surface-2"
            >
              <div className="h-full rounded-pill bg-ok" style={{ width: `${progreso}%` }} />
            </div>
          </div>
        )}

        <dl className="grid gap-1.5 border-t border-line pt-3.5 text-[15px]">
          {/* Devuelto, el reparto ya no aplica: queda solo lo que volvió. */}
          {devuelto === 0 && (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-2">{soyEstudiante ? "Para vos" : `Para ${trabajo.estudianteNombre}`}</dt>
                <dd className="font-semibold">{formatPrecio(pago.montoAEstudiante)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-2">{comision}</dt>
                <dd className="font-semibold">{formatPrecio(pago.montoComisionCalculada)}</dd>
              </div>
            </>
          )}
          {devuelto > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">{soyEstudiante ? `Devuelto a ${trabajo.clienteNombre}` : "Te devolvimos"}</dt>
              <dd className="font-semibold">{formatPrecio(devuelto)}</dd>
            </div>
          )}
        </dl>
      </div>

      {movimientos.length > 0 && (
        <div className="border-t border-line">
          <h3 className="px-5 pt-4 pb-1 text-[15px] font-semibold text-ink-2">Movimientos</h3>
          <ul>
            {visibles.map((m) => (
              <Movimiento key={m.id} m={m} trabajo={trabajo} soyEstudiante={soyEstudiante} />
            ))}
          </ul>
          {movimientos.length > MOVIMIENTOS_A_LA_VISTA && (
            <div className="px-3 pb-3">
              <Boton variante="fantasma" tamano="sm" onClick={() => setTodos((v) => !v)} aria-expanded={todos}>
                {todos ? "Ver menos" : `Ver los ${movimientos.length} movimientos`}
              </Boton>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function explicacion(estado: EstadoPago, soyEstudiante: boolean, porSesiones: boolean, t: TrabajoResponse): string {
  const cuando = porSesiones
    ? "a medida que se marca cada sesión como realizada"
    : soyEstudiante
      ? `cuando ${t.clienteNombre} confirme la entrega`
      : "cuando confirmes la entrega";
  switch (estado) {
    case "Retenido":
      return soyEstudiante
        ? `${t.clienteNombre} ya pagó. LEX guarda el pago y te lo paga ${cuando}.`
        : `LEX guarda tu pago y se lo paga a ${t.estudianteNombre} ${cuando}. Si el trabajo se cancela, te lo devolvemos.`;
    case "ParcialmenteLiberado":
      return soyEstudiante ? "Cobrás la parte de cada sesión cuando la marcás como realizada." : `${t.estudianteNombre} cobra la parte de cada sesión cuando la marca como realizada.`;
    case "Liberado":
      return soyEstudiante ? "Ya cobraste lo que te correspondía." : `${t.estudianteNombre} ya cobró. LEX se quedó con su comisión.`;
    case "Reembolsado":
      return soyEstudiante ? `El trabajo se canceló y LEX le devolvió el pago a ${t.clienteNombre}.` : "El trabajo se canceló y LEX te devolvió el pago.";
    case "EnDisputa":
      return "Hay una disputa abierta: el pago queda congelado, no se libera ni se devuelve hasta que se resuelva.";
  }
}

const MOV: Record<TipoMovimientoPago, { icono: NombreIcono; tono?: "ok" }> = {
  Retencion: { icono: "shield" },
  LiberacionEstudiante: { icono: "check-circle", tono: "ok" },
  ComisionLex: { icono: "receipt" },
  Reembolso: { icono: "refresh" },
  Ajuste: { icono: "info" },
};

function tituloMovimiento(tipo: TipoMovimientoPago, t: TrabajoResponse, soyEstudiante: boolean) {
  switch (tipo) {
    case "Retencion":
      return soyEstudiante ? `Pagó ${t.clienteNombre}` : "Pagaste";
    case "LiberacionEstudiante":
      return soyEstudiante ? "Cobraste" : `Pagado a ${t.estudianteNombre}`;
    case "ComisionLex":
      return "Comisión de LEX";
    case "Reembolso":
      return soyEstudiante ? `Devuelto a ${t.clienteNombre}` : "Te devolvimos el pago";
    case "Ajuste":
      return "Ajuste";
  }
}

function Movimiento({ m, trabajo, soyEstudiante }: { m: MovimientoPagoResponse; trabajo: TrabajoResponse; soyEstudiante: boolean }) {
  const meta = MOV[m.tipo];
  return (
    <li className="relative flex min-h-16 items-center gap-3.5 px-5 py-3 before:absolute before:top-0 before:right-0 before:left-[78px] before:h-px before:bg-line first:before:hidden">
      <Tesela icono={meta.icono} tono={meta.tono} />
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-[1.35] font-semibold">{tituloMovimiento(m.tipo, trabajo, soyEstudiante)}</span>
        <span className="block text-secondary text-ink-2">{fechaHora(m.fechaMovimiento)}</span>
      </span>
      <span className="shrink-0 text-base font-semibold">{formatPrecio(m.monto)}</span>
    </li>
  );
}

function suma(movimientos: MovimientoPagoResponse[], tipo: TipoMovimientoPago): number {
  return movimientos.filter((m) => m.tipo === tipo).reduce((acc, m) => acc + m.monto, 0);
}
