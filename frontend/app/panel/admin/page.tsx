"use client";

// Panel de ingresos de LEX (solo Admin).
//
// Todo lo que se muestra acá es COMISIÓN de LEX, nunca volumen transaccionado:
// el endpoint agrega Pago.MontoComisionCalculada por EstadoPago, así que no
// tenemos ni el bruto del pago ni el neto liberado al estudiante. Los labels
// dicen "comisión" a propósito para no leerse como GMV.

import { useEffect, useState } from "react";
import {
  obtenerIngresosAdmin,
  type IngresosAdminResponse,
  type IngresosPorVertical,
} from "@/lib/admin";
import { formatPrecio, tipoEtiqueta, type TipoServicio } from "@/lib/servicios";
import { ApiError } from "@/lib/api";
import { RequireRole } from "@/components/RequireRole";
import { ErrorAlert } from "@/components/ui";

const VERTICALES: TipoServicio[] = ["ProyectoCerrado", "Clase", "Salud"];

// El backend siempre manda las 3 verticales, pero no dependemos de eso.
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

  useEffect(() => {
    let cancelado = false;
    obtenerIngresosAdmin()
      .then((data) => {
        if (!cancelado) setDatos(data);
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
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Ingresos de LEX
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Comisión efectiva (pagos ya liberados) y potencial (retenida en escrow),
        con breakdown por vertical.
      </p>

      {error && (
        <div className="mt-6">
          <ErrorAlert message={error} />
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
        </div>
      ) : datos ? (
        <>
          {/* ZONA 1 — números destacados */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              detalle={`${datos.cantidadPagosRetenidos} en escrow · ${datos.cantidadPagosReembolsados} reembolsado${
                datos.cantidadPagosReembolsados === 1 ? "" : "s"
              }`}
            />
          </div>

          {/* Card de apoyo */}
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-slate-50/60 px-5 py-4">
            <span className="text-lg font-semibold text-slate-900">
              {formatPrecio(datos.ingresoPromedioPorTrabajoCompletado)}
            </span>
            <span className="text-sm text-slate-600">
              de comisión promedio por trabajo cobrado
            </span>
            <span className="text-xs text-slate-400">
              (sobre pagos liberados)
            </span>
          </div>

          {/* ZONA 2 — breakdown por vertical */}
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <Th align="left">Vertical</Th>
                    <Th>Trabajos</Th>
                    <Th>Comisión liberada</Th>
                    <Th>Comisión retenida</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {VERTICALES.map((vertical) => {
                    const v = datos.breakdownPorVertical[vertical] ?? VACIA;
                    return (
                      <tr key={vertical} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          {tipoEtiqueta(vertical)}
                        </td>
                        <Td>{v.cantidadTrabajos}</Td>
                        <Td>{formatPrecio(v.comisionLiberada)}</Td>
                        <Td>{formatPrecio(v.comisionRetenida)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr className="font-semibold text-slate-900">
                    <td className="px-5 py-3.5">Total</td>
                    <Td>{datos.cantidadTrabajosConPago}</Td>
                    <Td>{formatPrecio(datos.comisionLiberada)}</Td>
                    <Td>{formatPrecio(datos.comisionRetenida)}</Td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
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
      className={`rounded-xl border px-5 py-6 ${
        destacada
          ? "border-indigo-200 bg-indigo-50/60"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-3xl font-bold tracking-tight tabular-nums ${
          destacada ? "text-indigo-700" : "text-slate-900"
        }`}
      >
        {valor}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{detalle}</p>
    </div>
  );
}

function Th({
  children,
  align = "right",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "left" ? "text-left" : "text-right"
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-5 py-3.5 text-right tabular-nums text-slate-700">
      {children}
    </td>
  );
}
