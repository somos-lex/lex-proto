// Botón del sistema de diseño (ver el componente "Boton" del sistema).
// clasesBoton() sirve también para <Link>, que no puede ser un <button>.

import type { ButtonHTMLAttributes } from "react";

export type VarianteBoton =
  | "primario"
  | "fuerte"
  | "secundario"
  | "tonal"
  | "fantasma"
  | "texto"
  | "peligro";

export type TamanoBoton = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold leading-[1.2] no-underline transition-colors aria-disabled:cursor-not-allowed aria-disabled:bg-surface-2 aria-disabled:text-ink-3 aria-disabled:shadow-none disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3 disabled:shadow-none";

const VARIANTES: Record<VarianteBoton, string> = {
  primario: "bg-accent text-on-accent hover:bg-accent-hover",
  fuerte: "bg-inverse text-canvas",
  secundario: "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)] hover:bg-surface-2",
  tonal: "bg-surface-2 text-ink hover:bg-surface-3",
  fantasma: "bg-transparent text-link hover:bg-accent-soft",
  texto: "bg-transparent text-ink hover:bg-surface-2",
  peligro: "bg-surface text-danger-ink shadow-[inset_0_0_0_1px_var(--color-danger)]",
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: "min-h-11 rounded-control text-[15px]",
  md: "min-h-12 rounded-button text-base",
  lg: "min-h-13 rounded-button text-[17px]",
};

const PADDING: Record<TamanoBoton, string> = { sm: "px-4", md: "px-5", lg: "px-6" };

// Los botones de texto y fantasma llevan menos padding lateral.
const LIVIANOS: VarianteBoton[] = ["fantasma", "texto"];

export function clasesBoton({
  variante = "primario",
  tamano = "md",
  bloque = false,
  className = "",
}: {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  bloque?: boolean;
  className?: string;
} = {}) {
  return [
    BASE,
    VARIANTES[variante],
    TAMANOS[tamano],
    LIVIANOS.includes(variante) ? "px-3" : PADDING[tamano],
    bloque ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Boton({
  variante,
  tamano,
  bloque,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  bloque?: boolean;
}) {
  return (
    <button
      type={type}
      className={clasesBoton({ variante, tamano, bloque, className })}
      {...props}
    />
  );
}
