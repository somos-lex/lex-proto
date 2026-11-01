// Orquesta el modo "real" (humo, de solo lectura) de las pruebas E2E:
// build normal (usa el `.env.local` del worktree, que ya apunta al backend
// compartido de solo lectura en http://localhost:5156) y corre SOLO
// e2e/tests/smoke-real.spec.ts (sin capturas, sin escrituras).
//
// No levanta el backend: lo da por ya corriendo (lo levanta el orquestador).

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = resolve(__dirname, "..", "..");

function run(cmd, args, extraEnv = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    cwd: FRONTEND_DIR,
    env: { ...process.env, ...extraEnv },
  });
  return r.status ?? 1;
}

const codigoBuild = run("npx", ["next", "build"]);
if (codigoBuild !== 0) process.exit(codigoBuild);

const codigoTest = run("npx", ["playwright", "test", "-c", "e2e/playwright.config.ts"], { E2E_REAL: "1" });
process.exit(codigoTest);
