import { formatFecha } from "@/lib/servicios";
import type { DetalleTrabajoProyectoCerrado } from "@/lib/trabajos";
import { Dato, Datos } from "@/components/trabajo/Datos";

const FORMATO: Record<string, string> = {
  Archivos: "Archivos",
  Link: "Un enlace",
  Ambos: "Archivos y un enlace",
};

export function DetalleProyectoCerrado({ detalle }: { detalle: DetalleTrabajoProyectoCerrado }) {
  return (
    <Datos>
      <Dato icono="calendar" rotulo="Fecha límite de entrega">
        {formatFecha(detalle.plazoEntregaFecha)}
      </Dato>
      <Dato icono="refresh" rotulo="Revisiones">
        {detalle.revisionesUsadas} de {detalle.revisionesMaximas} usadas
      </Dato>
      <Dato icono="file-check" rotulo="Formato de entrega">
        {FORMATO[detalle.formatoEntregaSnapshot] ?? detalle.formatoEntregaSnapshot}
      </Dato>
    </Datos>
  );
}
