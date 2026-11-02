"use client";

import Link from "next/link";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";

// Error inesperado al cargar una página: dice qué pasó y qué hacer, con "Reintentar".
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lex px-4 pt-10 md:px-6 lg:px-8 lg:pt-16">
      <div role="alert" className="grid max-w-xl justify-items-start gap-3">
        <span className="grid size-11 place-items-center rounded-control bg-danger-soft text-danger-ink">
          <Icono nombre="alert-circle" className="size-6" />
        </span>
        <h1 className="text-title-1-mobile lg:text-title-1">No pudimos cargar esta página</h1>
        <p className="text-[17px] leading-[1.5] text-ink-2">
          Puede ser un problema de conexión o algo de nuestro lado. Probá de nuevo en un momento; si sigue pasando, volvé
          al inicio.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Boton onClick={reset}>Reintentar</Boton>
          <Link href="/" className={clasesBoton({ variante: "secundario" })}>
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
