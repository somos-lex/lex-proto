// Orquesta el modo "mock" de las pruebas E2E:
//   1. `next build` con NEXT_PUBLIC_API_URL apuntando al mock-server (puerto 3391).
//      NEXT_PUBLIC_* se hornea en build-time, por eso no basta con fijarlo al arrancar.
//   2. `playwright test`, que levanta el mock-server y `next start -p 3302` como
//      webServer (ver playwright.config.ts) y corre smoke + visual contra ellos.
//
// Pasa cualquier argumento (ej. --update-snapshots) directo a playwright test.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = resolve(__dirname, "..", "..");
const MOCK_API_PORT = 3391;

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    cwd: FRONTEND_DIR,
    env: { ...process.env, NEXT_PUBLIC_API_URL: `http://localhost:${MOCK_API_PORT}` },
  });
  return r.status ?? 1;
}

const codigoBuild = run("npx", ["next", "build"]);
if (codigoBuild !== 0) process.exit(codigoBuild);

const extra = process.argv.slice(2);
const codigoTest = run("npx", ["playwright", "test", "-c", "e2e/playwright.config.ts", ...extra]);
process.exit(codigoTest);
