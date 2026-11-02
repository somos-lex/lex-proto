// Portada generada (D7, componente "Portada" del sistema de diseño): la "ficha
// de categoría" de una app de pagos llevada a escala de portada. Un chip con el
// pictograma del tema y sus anillos, sobre el tinte de la vertical. Sin fotos.
//
// Forma por vertical (se distinguen sin color): Salud, anillos llenos y chip
// circular; Clases, anillos punteados y chip circular; Proyecto cerrado,
// cuadrados redondeados concéntricos y chip cuadrado. hash(tema) mod 3 elige la
// posición: el mismo tema da siempre la misma portada.

import type { TipoServicio } from "@/lib/servicios";
import { Icono, type NombreIcono } from "@/components/Icono";

const VERTICAL: Record<TipoServicio, { nombre: string; texto: string; fondo: string; relleno: string; trazo: string; pictoColor: string }> = {
  ProyectoCerrado: {
    nombre: "Proyecto cerrado",
    texto: "text-v-proyecto",
    fondo: "fill-v-proyecto-soft",
    relleno: "fill-v-proyecto",
    trazo: "stroke-v-proyecto",
    pictoColor: "text-v-proyecto-soft",
  },
  Clase: {
    nombre: "Clases",
    texto: "text-v-clases",
    fondo: "fill-v-clases-soft",
    relleno: "fill-v-clases",
    trazo: "stroke-v-clases",
    pictoColor: "text-v-clases-soft",
  },
  Salud: {
    nombre: "Salud",
    texto: "text-v-salud",
    fondo: "fill-v-salud-soft",
    relleno: "fill-v-salud",
    trazo: "stroke-v-salud",
    pictoColor: "text-v-salud-soft",
  },
};

// Pictograma por tema. Hace falta uno por entrada del catálogo y por materia
// frecuente; mientras tanto, por palabra clave, y si no, el de la vertical.
const PICTOS: [RegExp, NombreIcono][] = [
  [/odont|dent|bucal|higiene/i, "tooth"],
  [/vacun|inyec/i, "syringe"],
  [/veterin|mascota|perro|gato/i, "paw"],
  [/web|sitio|p[aá]gina/i, "browser"],
  [/tienda|e-?commerce|venta/i, "bag"],
  [/matem|[aá]lgebra|c[aá]lculo/i, "sigma"],
  [/program|python|java|c[oó]digo|software/i, "code"],
];
const PICTO_VERTICAL: Record<TipoServicio, NombreIcono> = {
  ProyectoCerrado: "briefcase",
  Clase: "cap",
  Salud: "steth",
};

export function pictogramaDe(tipo: TipoServicio, tema: string): NombreIcono {
  return PICTOS.find(([re]) => re.test(tema))?.[1] ?? PICTO_VERTICAL[tipo];
}

function hash(t: string) {
  let h = 2166136261;
  for (const ch of t) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function Figura({ tipo, cx, cy, r, anillos, k = 1, picto }: { tipo: TipoServicio; cx: number; cy: number; r: number; anillos: number[]; k?: number; picto: NombreIcono }) {
  const v = VERTICAL[tipo];
  const opacidades = [0.42, 0.26, 0.14, 0.07];
  const p = r * 1.12;
  return (
    <>
      {anillos.map((d, i) => {
        const R = r + d;
        if (tipo === "ProyectoCerrado")
          return <rect key={d} className={`fill-none ${v.trazo}`} x={cx - R} y={cy - R} width={R * 2} height={R * 2} rx={R * 0.42} strokeWidth={2 * k} opacity={opacidades[i]} />;
        if (tipo === "Clase")
          return <circle key={d} className={`fill-none ${v.trazo}`} cx={cx} cy={cy} r={R} strokeWidth={3 * k} strokeDasharray={`0.1 ${7 * k}`} strokeLinecap="round" opacity={opacidades[i] + 0.2} />;
        return <circle key={d} className={`fill-none ${v.trazo}`} cx={cx} cy={cy} r={R} strokeWidth={2 * k} opacity={opacidades[i]} />;
      })}
      {tipo === "ProyectoCerrado" ? (
        <rect className={v.relleno} x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={r * 0.42} />
      ) : (
        <circle className={v.relleno} cx={cx} cy={cy} r={r} />
      )}
      <foreignObject x={cx - p / 2} y={cy - p / 2} width={p} height={p}>
        <Icono nombre={picto} className={`size-full ${v.pictoColor}`} />
      </foreignObject>
    </>
  );
}

export function Portada({
  tipo,
  tema,
  ficha = false,
  className = "",
}: {
  tipo: TipoServicio;
  /** Nombre del catálogo sin el paréntesis de la carrera, o la materia en Clases. */
  tema: string;
  /** 21:8 en la ficha; 16:10 en la tarjeta. */
  ficha?: boolean;
  className?: string;
}) {
  const v = VERTICAL[tipo];
  const n = hash(tema) % 3;
  const W = 320;
  const H = ficha ? 160 : 200;
  const pos = ficha ? [{ x: 246, y: 82 }, { x: 262, y: 104 }, { x: 236, y: 64 }][n] : [{ x: 228, y: 98 }, { x: 246, y: 128 }, { x: 220, y: 76 }][n];
  return (
    <div aria-hidden="true" className={`relative overflow-hidden ${ficha ? "aspect-[21/8] rounded-card" : "aspect-[16/10] rounded-button"} ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="size-full">
        <rect className={v.fondo} width={W} height={H} />
        <Figura tipo={tipo} cx={pos.x} cy={pos.y} r={ficha ? 34 : 42} anillos={ficha ? [18, 40, 66, 96] : [20, 46, 76, 110]} picto={pictogramaDe(tipo, tema)} />
      </svg>
      <span className={`absolute top-3 left-3.5 text-[14px] font-semibold ${v.texto}`}>{v.nombre}</span>
      <span className={`absolute bottom-3 left-3.5 max-w-[58%] text-[15px] leading-[1.25] font-[620] tracking-[-0.005em] ${v.texto}`}>{tema}</span>
    </div>
  );
}

/** 88 × 88 para la fila mobile y los pendientes del panel. */
export function PortadaMini({ tipo, tema, tamano = 88 }: { tipo: TipoServicio; tema: string; tamano?: number }) {
  const v = VERTICAL[tipo];
  return (
    <div aria-hidden="true" className="shrink-0 overflow-hidden rounded-button" style={{ width: tamano, height: tamano }}>
      <svg viewBox="0 0 88 88" className="size-full">
        <rect className={v.fondo} width={88} height={88} />
        <Figura tipo={tipo} cx={44} cy={44} r={24} anillos={[11, 25]} k={0.8} picto={pictogramaDe(tipo, tema)} />
      </svg>
    </div>
  );
}
