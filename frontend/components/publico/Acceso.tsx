// Piezas comunes de ingresar y crear cuenta: la ruta de vuelta y el marco de la página.

import type { ReactNode } from "react";
import { Fila, Grupo } from "@/components/ds/Lista";

/** Solo rutas internas: empiezan con "/" y no con "//" ni "/\" (evita redirecciones abiertas). */
export function rutaSegura(volver?: string | null): string | null {
  if (!volver) return null;
  return volver.startsWith("/") && !volver.startsWith("//") && !volver.startsWith("/\\") ? volver : null;
}

/** "?volver=…" para pasar la ruta de vuelta entre ingresar y crear cuenta. */
export function conVolver(ruta: string, volver: string | null) {
  return volver ? `${ruta}?volver=${encodeURIComponent(volver)}` : ruta;
}

export function MarcoAcceso({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-lex px-4 pt-6 md:px-6 lg:px-8 lg:pt-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,440px)_minmax(0,400px)] lg:justify-between lg:gap-16">
        <div className="min-w-0">{children}</div>
        <Grupo titulo="Qué te asegura LEX" className="lg:mt-2">
          <Fila
            icono="id"
            tonoTesela="ok"
            titulo="Carrera verificada por LEX"
            descripcion="Cada estudiante carga su constancia de alumno regular y un admin de LEX la revisa."
          />
          <Fila icono="shield" titulo="Pago protegido" descripcion="LEX guarda tu pago y se lo pasa al estudiante a medida que cumple." />
          <Fila icono="calendar" tonoTesela="acento" titulo="Banco de Turnos" descripcion="Atención sin costo con estudiantes de salud, en la cátedra." />
        </Grupo>
      </div>
    </div>
  );
}
