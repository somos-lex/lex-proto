// Primitivas de formulario (componente "Campo" del sistema de diseño).
// Mantienen la API de siempre (Input, Select, Field, SubmitButton, ErrorAlert)
// para que todos los formularios tomen el estilo nuevo sin cambiar su código.
//
// Campo: rótulo arriba (15/600), control de 48 px con texto de 16 px (iOS no hace
// zoom), borde line-strong (≥ 3:1), foco en `focus`, error con aria-invalid.
// Para asociar ayuda o error, poné en el control
// aria-describedby={`${htmlFor}-ayuda`} o `${htmlFor}-error`.

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";

const baseField =
  "w-full rounded-control border border-line-strong bg-surface px-3.5 text-base text-ink outline-none transition-colors placeholder:text-ink-3 focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus aria-invalid:border-danger aria-invalid:shadow-[inset_0_0_0_1px_var(--color-danger)] disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} className={`${baseField} min-h-12 ${className}`} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={`${baseField} min-h-24 py-3 leading-[1.5] ${className}`} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...props }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={`${baseField} min-h-12 appearance-none pr-11 ${className}`} {...props}>
          {children}
        </select>
        <Icono nombre="chev-d" className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-ink-2" />
      </div>
    );
  },
);

export function Field({
  label,
  htmlFor,
  ayuda,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  /** Texto de ayuda debajo del control (id `${htmlFor}-ayuda`). */
  ayuda?: ReactNode;
  /** Dice cómo arreglarlo: "La matrícula tiene 5 dígitos." (id `${htmlFor}-error`). */
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-[15px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {ayuda && !error && (
        <p id={`${htmlFor}-ayuda`} className="text-[14px] text-ink-2">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="flex items-start gap-1.5 text-[14px] font-medium text-danger">
          <Icono nombre="alert-circle" className="size-[18px]" />
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  loading,
}: {
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading || undefined}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-button bg-accent px-5 text-base font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3"
    >
      {loading && (
        <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
      )}
      {loading ? "Procesando…" : children}
    </button>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return <Aviso tono="danger">{message}</Aviso>;
}
