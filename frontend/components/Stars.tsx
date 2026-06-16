"use client";

// Iconografía de calificación reutilizable.

import { useState } from "react";

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M9.05 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.354 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
    </svg>
  );
}

/** Calificación compacta: una estrella + número. Para tarjetas y encabezados. */
export function RatingBadge({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  if (!value || value <= 0) {
    return (
      <span className={`text-xs font-medium text-gray-400 ${className}`}>
        Sin calificación
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <StarIcon className="h-4 w-4 text-amber-400" />
      <span className="text-sm font-semibold text-foreground">
        {value.toFixed(1)}
      </span>
    </span>
  );
}

/** Fila de 5 estrellas, rellenas según el puntaje (1-5). Para reseñas. */
export function StarsRow({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={`h-4 w-4 ${i <= value ? "text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </span>
  );
}

/** Selector de puntaje interactivo (1-5). Doradas al pasar/seleccionar, con
 *  previsualización en hover. Para dejar una reseña. */
export function StarsInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (puntaje: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const mostrado = hover || value;

  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label="Puntaje"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} estrella${i > 1 ? "s" : ""}`}
          onMouseEnter={() => !disabled && setHover(i)}
          onMouseLeave={() => setHover(0)}
          onFocus={() => !disabled && setHover(i)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(i)}
          className="rounded p-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed"
        >
          <StarIcon
            className={`h-8 w-8 transition ${
              i <= mostrado ? "text-amber-400" : "text-gray-200 hover:text-amber-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
