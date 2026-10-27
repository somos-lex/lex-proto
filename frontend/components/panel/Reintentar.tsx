"use client";

// El error de un bloque del panel: dice qué no se pudo cargar, por qué, y
// ofrece "Reintentar" (componente "Aviso" del sistema, tono danger).

import { Boton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";

export function ErrorDeCarga({
  que,
  motivo,
  onReintentar,
  className = "",
}: {
  /** "No pudimos cargar tus trabajos." */
  que: string;
  /** El mensaje de useCarga (conexión, servidor o el del backend). */
  motivo?: string | null;
  onReintentar: () => void;
  className?: string;
}) {
  return (
    <Aviso
      tono="danger"
      titulo={que}
      className={className}
      acciones={
        <Boton variante="secundario" tamano="sm" onClick={onReintentar}>
          <Icono nombre="refresh" />
          Reintentar
        </Boton>
      }
    >
      {motivo}
    </Aviso>
  );
}
