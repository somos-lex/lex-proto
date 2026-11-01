// Inyecta una sesión demo por cookies (mismo formato que lib/session.ts) en vez de
// pasar por el formulario de login en cada test: más rápido y evita depender del
// flujo de login para probar pantallas que no son el login. El flujo de login en
// sí se prueba en e2e/tests/smoke.spec.ts con el formulario real.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { BrowserContext, Page } from "@playwright/test";

const FIXTURES_DIR = path.resolve(__dirname, "..", "fixtures");

function fx(nombre: string) {
  return JSON.parse(readFileSync(path.join(FIXTURES_DIR, `${nombre}.json`), "utf-8"));
}

const AUTH = fx("auth") as Record<string, { token: string; usuario: unknown }>;
const IDENTIDAD = fx("identidad") as Record<string, unknown>;

export type CuentaDemo = "sofia" | "diego";

export async function loginComo(pageOrContext: Page | BrowserContext, cuenta: CuentaDemo, baseURL = "http://localhost:3302") {
  const context = "context" in pageOrContext ? pageOrContext.context() : pageOrContext;
  const auth = AUTH[cuenta];
  const identidad = IDENTIDAD[cuenta];
  await context.addCookies([
    { name: "lex_token", value: encodeURIComponent(auth.token), url: baseURL },
    { name: "lex_user", value: encodeURIComponent(JSON.stringify(auth.usuario)), url: baseURL },
    { name: "lex_identidad", value: encodeURIComponent(JSON.stringify(identidad)), url: baseURL },
  ]);
}
