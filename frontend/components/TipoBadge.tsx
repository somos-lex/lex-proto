import { tipoBadgeClasses, tipoEtiqueta, type TipoServicio } from "@/lib/servicios";

export function TipoBadge({ tipo }: { tipo: TipoServicio }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tipoBadgeClasses(
        tipo,
      )}`}
    >
      {tipoEtiqueta(tipo)}
    </span>
  );
}
