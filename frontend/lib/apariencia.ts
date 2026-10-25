// Apariencia (claro / oscuro) del sistema de diseño.
//
// El servidor siempre pinta <html data-theme="light">. SCRIPT_APARIENCIA corre en
// <head>, antes del primer pintado, y fija data-theme según lo que eligió la
// persona en este dispositivo (localStorage) o, en "sistema", según su sistema
// operativo. Así no hay parpadeo ni error de hidratación (ver la guía
// "preventing-flash-before-hydration" de Next).
//
// OSCURO_HABILITADO queda en false hasta cerrar la Fase 4 del rediseño: las
// pantallas que todavía no migraron al sistema usan colores fijos de claro
// (bg-white, text-gray-900…) y en oscuro quedarían mezcladas. Mientras tanto,
// todo se ve en claro y el control "Apariencia" no se muestra.

export type Apariencia = "sistema" | "claro" | "oscuro";

export const OSCURO_HABILITADO = false;

export const CLAVE_APARIENCIA = "lex-apariencia";
export const EVENTO_APARIENCIA = "lex-apariencia";
export const CONSULTA_OSCURO = "(prefers-color-scheme: dark)";

export const OPCIONES_APARIENCIA: { valor: Apariencia; etiqueta: string }[] = [
  { valor: "sistema", etiqueta: "Según el sistema" },
  { valor: "claro", etiqueta: "Claro" },
  { valor: "oscuro", etiqueta: "Oscuro" },
];

/** Script en línea para <head>: la misma lógica que useApariencia, sin React. */
export const SCRIPT_APARIENCIA = OSCURO_HABILITADO
  ? `(function(){try{var a=localStorage.getItem("${CLAVE_APARIENCIA}");var o=a==="oscuro"||(a!=="claro"&&matchMedia("${CONSULTA_OSCURO}").matches);document.documentElement.dataset.theme=o?"dark":"light"}catch(e){}})()`
  : "";
