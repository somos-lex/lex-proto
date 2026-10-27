import type { EstadoSesion } from "@/lib/sesiones";
import { Chip, type TonoChip } from "@/components/ds/Chip";
import type { NombreIcono } from "@/components/Icono";

// Realizada es verde porque alguien la confirmó (el estudiante la marcó). Ninguno
// depende solo del color: todos llevan ícono y texto.
const ESTADO: Record<EstadoSesion, { etiqueta: string; tono: TonoChip; icono: NombreIcono }> = {
  Pendiente: { etiqueta: "Pendiente", tono: "neutro", icono: "clock" },
  Realizada: { etiqueta: "Realizada", tono: "ok", icono: "check-circle" },
  Cancelada: { etiqueta: "Cancelada", tono: "neutro", icono: "x" },
  NoAsistio: { etiqueta: "No asistió", tono: "neutro", icono: "alert-circle" },
};

export default function EstadoSesionBadge({ estado }: { estado: EstadoSesion }) {
  const e = ESTADO[estado];
  return (
    <Chip tono={e.tono} icono={e.icono}>
      {e.etiqueta}
    </Chip>
  );
}
