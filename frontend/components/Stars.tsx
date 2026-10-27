"use client";

// Calificación (pieza "calif" de la tarjeta del sistema de diseño): la estrella va en
// `star` y el número en `ink`. Sin "Sin reseñas" (F3-4): con cero reseñas no se
// muestra nada, para no castigar a quien recién empieza.

import { useState } from "react";
import { formatCalificacion } from "@/components/publico/presentacion";

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
    </svg>
  );
}

/** Calificación compacta: una estrella y el promedio ("4,0"). Nada si no hay reseñas. */
export function RatingBadge({ value, className = "" }: { value: number; className?: string }) {
  if (!value || value <= 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[14px] font-semibold whitespace-nowrap text-ink tabular-nums ${className}`}>
      <StarIcon className="size-4 text-star" />
      {formatCalificacion(value)}
      <span className="sr-only"> de 5 en reseñas</span>
    </span>
  );
}

/** Fila de 5 estrellas, rellenas según el puntaje (1-5). Para reseñas. */
export function StarsRow({ value }: { value: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} className={`size-4 ${i <= value ? "text-star" : "text-line-strong"}`} />
      ))}
    </span>
  );
}

/** Selector de puntaje (1-5) para dejar una reseña. Cada estrella es un objetivo de 44 px. */
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
    <div className="inline-flex items-center" role="radiogroup" aria-label="Puntaje">
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
          className="grid size-11 place-items-center rounded-control disabled:cursor-not-allowed"
        >
          <StarIcon className={`size-8 transition-colors ${i <= mostrado ? "text-star" : "text-line-strong"}`} />
        </button>
      ))}
    </div>
  );
}
