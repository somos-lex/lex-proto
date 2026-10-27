"use client";

// Panel de ingresos de LEX (solo Admin).
//
// Todo lo que se muestra acá es COMISIÓN de LEX, nunca volumen transaccionado:
// el endpoint agrega Pago.MontoComisionCalculada por EstadoPago, así que no
// tenemos ni el bruto del pago ni el neto liberado al estudiante. Los labels
// dicen "comisión" a propósito para no leerse como GMV.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  obtenerIngresosAdmin,
  type IngresosAdminResponse,
  type IngresosPorVertical,
} from "@/lib/admin";
import { formatPrecio, tipoEtiqueta, type TipoServicio } from "@/lib/servicios";
import { ApiError } from "@/lib/api";
import { RequireRole } from "@/components/RequireRole";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Cargando, Esqueleto } from "@/components/ds/Estados";
import { EncabezadoPagina, Pagina, TituloSeccion } from "@/components/trabajo/Pagina";

const VERTICALES: TipoServicio[] = ["ProyectoCerrado", "Clase", "Salud"];

const VACIA: IngresosPorVertical = {
  cantidadTrabajos: 0,
  comisionLiberada: 0,
  comisionRetenida: 0,
};

export default function AdminIngresosPage() {
  return (
    <RequireRole roles={["Admin"]}>
      <AdminIngresos />
    </RequireRole>
  );
}

function AdminIngresos() {
  const [datos, setDatos] = useState<IngresosAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelado = false;
    obtenerIngresosAdmin()
      .then((data) => {
        if (!cancelado) {
          setDatos(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelado)
          setError(
            err instanceof ApiError
              ? err.message
              : "No pudimos cargar el panel de ingresos.",
          );
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [version]);

  function recargar() {
    setLoading(true);
    setError(null);
    setVersion((v) => v + 1);
  }

  return (
    <Pagina>
      <EncabezadoPagina
        titulo="Ingresos de LEX"
        bajada="Comisión efectiva (pagos ya liberados) y potencial (retenida en pago protegido), con desglose por vertical."
        acciones={
          <Link
            href="/panel/admin/verificaciones"
            className={clasesBoton({ variante: "secundario" })}
          >
            <span>Verificaciones pendientes</span>
            <Icono nombre="chev-r" className="size-4" />
          </Link>
        }
      />

      {error && (
        <div className="mt-6">
          <Aviso
            tono="danger"
            titulo="No pudimos cargar los ingresos"
            acciones={
              <Boton variante="secundario" onClick={recargar}>
                Reintentar
              </Boton>
            }
          >
            {error}
          </Aviso>
        </div>
      )}

      {loading ? (
        <Cargando etiqueta="Cargando ingresos de LEX">
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <EsqueletoMetrica />
              <EsqueletoMetrica />
              <EsqueletoMetrica />
            </div>
            <Esqueleto className="h-48 w-full rounded-card" />
          </div>
        </Cargando>
      ) : datos ? (
        <div className="mt-8 space-y-8">
          {/* Métricas destacadas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Metrica
              valor={formatPrecio(datos.comisionTotal)}
              label="Comisión LEX total"
              detalle="Liberada + retenida (excluye reembolsos)"
              destacada
            />
            <Metrica
              valor={formatPrecio(datos.comisionLiberada)}
              label="Comisión liberada"
              detalle={`${datos.cantidadPagosLiberados} pago${
                datos.cantidadPagosLiberados === 1 ? "" : "s"
              } liberado${datos.cantidadPagosLiberados === 1 ? "" : "s"}`}
            />
            <Metrica
              valor={String(datos.cantidadTrabajosConPago)}
              label="Trabajos con pago"
              detalle={`${datos.cantidadPagosRetenidos} en pago protegido · ${datos.cantidadPagosReembolsados} reembolsado${
                datos.cantidadPagosReembolsados === 1 ? "" : "s"
              }`}
            />
          </div>

          {/* Tarjeta de promedio */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-card bg-surface p-4 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
            <span className="text-title-3 font-semibold text-ink">
              {formatPrecio(datos.ingresoPromedioPorTrabajoCompletado)}
            </span>
            <span className="text-[15px] text-ink-2">
              de comisión promedio por trabajo cobrado
            </span>
            <span className="text-[13px] text-ink-3">
              (sobre pagos liberados)
            </span>
          </div>

          {/* Desglose por vertical */}
          <section>
            <TituloSeccion>Desglose por vertical</TituloSeccion>
            <div className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-line text-[15px]">
                  <thead>
                    <tr className="bg-surface-2 text-ink-2">
                      <th scope="col" className="px-5 py-3 text-left font-semibold">Vertical</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Trabajos</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Comisión liberada</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Comisión retenida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {VERTICALES.map((vertical) => {
                      const v = datos.breakdownPorVertical[vertical] ?? VACIA;
                      return (
                        <tr key={vertical} className="hover:bg-surface-2/60 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-ink">
                            {tipoEtiqueta(vertical)}
                          </td>
                          <td className="px-5 py-3.5 text-right text-ink-2 tabular-nums">
                            {v.cantidadTrabajos}
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium text-ink tabular-nums">
                            {formatPrecio(v.comisionLiberada)}
                          </td>
                          <td className="px-5 py-3.5 text-right text-ink-2 tabular-nums">
                            {formatPrecio(v.comisionRetenida)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-line bg-surface-2">
                    <tr className="font-semibold text-ink">
                      <td className="px-5 py-3.5">Total</td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        {datos.cantidadTrabajosConPago}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-ink tabular-nums">
                        {formatPrecio(datos.comisionLiberada)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-ink-2 tabular-nums">
                        {formatPrecio(datos.comisionRetenida)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </Pagina>
  );
}

function Metrica({
  valor,
  label,
  detalle,
  destacada,
}: {
  valor: string;
  label: string;
  detalle: string;
  destacada?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-card p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none ${
        destacada
          ? "bg-accent-soft shadow-[0_0_0_1.5px_var(--color-accent)]"
          : "bg-surface"
      }`}
    >
      <div>
        <p className="text-[14px] font-semibold text-ink-2">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-ink">
          {valor}
        </p>
      </div>
      <p className="mt-3 text-[13px] text-ink-3">{detalle}</p>
    </div>
  );
}

function EsqueletoMetrica() {
  return (
    <div
      aria-hidden="true"
      className="rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none"
    >
      <Esqueleto className="h-4 w-2/5" />
      <Esqueleto className="mt-3 h-8 w-3/5" />
      <Esqueleto className="mt-3 h-3.5 w-4/5" />
    </div>
  );
}
