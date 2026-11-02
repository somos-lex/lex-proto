// Riel (componente "Riel" del sistema de diseño): un proceso como nodos sobre
// una línea. El nodo violeta dice dónde estás.

import { Icono, type NombreIcono } from "@/components/Icono";

export type EstadoPaso = "hecho" | "actual" | "ok" | "mal" | "pendiente";

const PARA_LECTOR: Record<EstadoPaso, string> = {
  hecho: "hecho",
  actual: "estado actual",
  ok: "listo",
  mal: "no pasó",
  pendiente: "pendiente",
};

const TEXTO: Record<EstadoPaso, string> = {
  hecho: "text-ink-2",
  actual: "font-[650] text-ink",
  ok: "font-[650] text-ok-ink",
  mal: "font-[650] text-danger-ink",
  pendiente: "text-ink-3",
};

const NODO: Record<EstadoPaso, string> = {
  hecho: "bg-ink-2",
  actual: "bg-accent shadow-[0_0_0_4px_var(--color-accent-soft)]",
  ok: "bg-ok shadow-[0_0_0_4px_var(--color-ok-soft)]",
  mal: "bg-danger shadow-[0_0_0_4px_var(--color-danger-soft)]",
  pendiente: "bg-surface shadow-[inset_0_0_0_2px_var(--color-line-strong)]",
};

/** Riel de estado, horizontal. Hasta seis pasos. Con más de tres, en mobile
 *  los rótulos no entran uno al lado del otro: se muestran solo los nodos y,
 *  debajo, el paso en el que está ("Pendiente · paso 1 de 5"). */
export function Riel({
  pasos,
  etiqueta,
}: {
  pasos: { texto: string; estado: EstadoPaso }[];
  /** Nombre del riel para lectores, por ejemplo "Estado del trabajo 232". */
  etiqueta: string;
}) {
  const compacto = pasos.length > 3;
  const iActual = Math.max(
    pasos.findIndex((p) => p.estado === "actual"),
    pasos.findLastIndex((p) => p.estado !== "pendiente"),
  );
  const resumen = iActual >= 0 ? pasos[iActual] : pasos[0];
  return (
    <div>
      <ol aria-label={etiqueta} className="grid auto-cols-[minmax(0,1fr)] grid-flow-col">
        {pasos.map((p, i) => {
          const ultimo = i === pasos.length - 1;
          const conMarca = p.estado === "hecho" || p.estado === "ok" || p.estado === "mal";
          return (
            <li
              key={p.texto}
              aria-current={p.estado === "actual" ? "step" : undefined}
              className={`relative pt-6 pr-1.5 text-[14px] leading-[1.3] font-medium ${TEXTO[p.estado]}`}
            >
              {!ultimo && (
                <span
                  aria-hidden="true"
                  className={`absolute top-[7px] right-0.5 left-[18px] h-0.5 rounded-sm ${p.estado === "hecho" ? "bg-ink-2" : "bg-line"}`}
                />
              )}
              <span aria-hidden="true" className={`absolute top-0 left-0 grid size-4 place-items-center rounded-full ${NODO[p.estado]}`}>
                {conMarca && (
                  <svg viewBox="0 0 24 24" className="size-2.5 text-surface" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d={p.estado === "mal" ? "M7 7l10 10M17 7 7 17" : "m5 12.5 4.5 4.5L19 7.5"} />
                  </svg>
                )}
              </span>
              <span className={compacto ? "max-sm:sr-only" : ""}>{p.texto}</span>
              <span className="sr-only">, {PARA_LECTOR[p.estado]}</span>
            </li>
          );
        })}
      </ol>
      {compacto && (
        <p aria-hidden="true" className={`mt-2 text-[14px] leading-[1.3] sm:hidden ${TEXTO[resumen.estado]}`}>
          {resumen.texto} · paso {pasos.indexOf(resumen) + 1} de {pasos.length}
        </p>
      )}
    </div>
  );
}

/** Riel explicativo, vertical: cuenta un proceso antes de que pase
 *  (por ejemplo, "Tu pago, protegido" junto al botón de contratar). */
export function RielExplicativo({
  pasos,
  etiqueta,
}: {
  pasos: { icono: NombreIcono; titulo: string; descripcion: string }[];
  etiqueta: string;
}) {
  return (
    <ol aria-label={etiqueta}>
      {pasos.map((p, i) => (
        <li key={p.titulo} className={`relative grid grid-cols-[40px_minmax(0,1fr)] gap-3 ${i < pasos.length - 1 ? "pb-4" : ""}`}>
          {i < pasos.length - 1 && (
            <span aria-hidden="true" className="absolute top-11 bottom-1 left-[19px] w-0.5 rounded-sm bg-line" />
          )}
          <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-ink">
            <Icono nombre={p.icono} />
          </span>
          <div>
            <p className="pt-0.5 text-base leading-[1.35] font-semibold">{p.titulo}</p>
            <p className="text-[15px] leading-[1.4] text-ink-2">{p.descripcion}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** El riel del pago protegido. `quien` es el nombre del estudiante.
 *  `liberacion` lo decide quien lo usa según cómo libera el pago esa vertical
 *  en el backend (por sesión en Salud y Clases; verificarlo antes de usarlo en
 *  Proyecto cerrado). `conConsentimiento` solo en Salud. */
export function RielPagoProtegido({
  quien,
  liberacion = "sesiones",
  conConsentimiento = false,
}: {
  quien: string;
  liberacion?: "sesiones" | "entrega";
  conConsentimiento?: boolean;
}) {
  return (
    <RielExplicativo
      etiqueta="Cómo funciona el pago protegido"
      pasos={[
        {
          icono: "card",
          titulo: "Pagás al contratar",
          descripcion: conConsentimiento ? "Junto con el consentimiento firmado." : "El pago queda protegido desde el primer momento.",
        },
        { icono: "shield", titulo: "LEX guarda el pago", descripcion: `Si ${quien} no acepta el trabajo, te lo devolvemos.` },
        liberacion === "sesiones"
          ? { icono: "check-circle", titulo: "Se libera sesión por sesión", descripcion: "Cuando cada sesión se marca como realizada." }
          : { icono: "check-circle", titulo: "Se libera con la entrega", descripcion: "Cuando confirmás que recibiste el trabajo." },
      ]}
    />
  );
}
