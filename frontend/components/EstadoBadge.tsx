import { ESTADO_META, type EstadoTrabajo } from "@/lib/trabajos";

export function EstadoBadge({ estado }: { estado: EstadoTrabajo }) {
  const meta = ESTADO_META[estado];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.classes}`}
    >
      {meta.label}
    </span>
  );
}
