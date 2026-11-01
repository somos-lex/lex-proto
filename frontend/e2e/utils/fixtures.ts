// `test` extendido con un fixture automático que fija la apariencia (claro/oscuro)
// ANTES de que corra cualquier script de la página, leyendo el nombre del proyecto
// (mobile-light, mobile-dark, desktop-light, desktop-dark). Así no hay que repetir
// la lógica en cada spec: alcanza con importar `test`/`expect` desde este módulo.
import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ _tema: void }>({
  _tema: [
    async ({ page }, use, testInfo) => {
      const modo = testInfo.project.name.endsWith("dark") ? "oscuro" : "claro";
      await page.addInitScript((m) => {
        try {
          localStorage.setItem("lex-apariencia", m);
        } catch {
          // Almacenamiento no disponible (ej. contexto restringido): sin tema persistido no rompe la página.
        }
      }, modo);
      await use();
    },
    { auto: true },
  ],
});

export { expect };

/** Junta errores de consola y excepciones no atrapadas durante el test. */
export function capturarErroresDeConsola(page: import("@playwright/test").Page): string[] {
  const errores: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errores.push(msg.text());
  });
  page.on("pageerror", (err) => errores.push(err.message));
  return errores;
}
