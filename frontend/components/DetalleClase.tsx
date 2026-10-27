import type { DetalleTrabajoClase } from "@/lib/trabajos";
import { Dato, Datos } from "@/components/trabajo/Datos";

const MODALIDAD: Record<string, string> = {
  Online: "Online",
  Presencial: "Presencial",
  Ambas: "Online o presencial",
};

export function DetalleClase({ detalle }: { detalle: DetalleTrabajoClase }) {
  return (
    <Datos>
      <Dato icono="cap" rotulo="Materia">
        {detalle.materiaSnapshot}
      </Dato>
      <Dato icono="users" rotulo="Nivel">
        {detalle.nivelSnapshot}
      </Dato>
      <Dato icono="pin" rotulo="Modalidad">
        {MODALIDAD[detalle.modalidadSnapshot] ?? detalle.modalidadSnapshot}
      </Dato>
      <Dato icono="calendar" rotulo="Sesiones">
        {detalle.sesionesCompletadas} de {detalle.cantidadSesionesTotales} realizadas
      </Dato>
    </Datos>
  );
}
