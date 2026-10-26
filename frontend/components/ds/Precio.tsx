// Precio (componente "Precio" del sistema de diseño): el monto como pieza
// tipográfica, siempre con unidad. En el Banco de Turnos, "Sin costo" ocupa
// ese mismo lugar.

import { Icono } from "@/components/Icono";
import { formatPrecio } from "@/lib/servicios";

export function Precio({
  monto,
  unidad,
  grande = false,
  className = "",
}: {
  monto: number;
  /** "por sesión", "por clase", "proyecto cerrado". Un monto sin unidad no se publica. */
  unidad: string;
  grande?: boolean;
  className?: string;
}) {
  return (
    <p className={`flex flex-wrap items-baseline gap-1.5 ${className}`}>
      <span className={`font-bold whitespace-nowrap tabular-nums ${grande ? "text-amount-lg" : "text-amount"}`}>
        {formatPrecio(monto)}
      </span>
      <span className="text-[14px] font-medium whitespace-nowrap text-ink-2">{unidad}</span>
    </p>
  );
}

export function SinCosto({ detalle, className = "" }: { detalle?: string; className?: string }) {
  return (
    <p className={`flex flex-wrap items-baseline gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1.5 self-center text-amount whitespace-nowrap text-on-accent-soft">
        <Icono nombre="tag" />
        Sin costo
      </span>
      {detalle && <span className="text-[14px] font-medium whitespace-nowrap text-ink-2">{detalle}</span>}
    </p>
  );
}
