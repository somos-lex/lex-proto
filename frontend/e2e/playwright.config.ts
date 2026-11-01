import path from "node:path";
import { defineConfig } from "@playwright/test";

// Dos modos, elegidos por E2E_REAL (lo fijan los scripts en e2e/scripts/):
//   - mock (default): mock-server.mjs + next start, con fixtures estables. Corre
//     smoke.spec.ts y los visual-*.spec.ts (con capturas de regresión).
//   - real: solo smoke-real.spec.ts contra el backend compartido (solo lectura,
//     sin capturas). No levanta el backend: asume que ya está corriendo.
const REAL = process.env.E2E_REAL === "1";

const FRONTEND_DIR = path.resolve(__dirname, "..");
const APP_PORT = 3302;
const MOCK_API_PORT = 3391;

export default defineConfig({
  testDir: "./tests",
  // Explícito: por default Playwright resuelve outputDir relativo al cwd del
  // proceso, no al de este archivo, y `npx playwright test -c e2e/...` desde
  // frontend/ termina escribiendo frontend/test-results en vez de e2e/test-results.
  outputDir: path.join(__dirname, "test-results"),
  testMatch: REAL ? ["smoke-real.spec.ts"] : ["smoke.spec.ts", "visual-*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: {
      // Tolerancia razonable: fuentes y antialiasing varían un poco entre máquinas.
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    },
  },
  webServer: REAL
    ? [
        {
          command: `npx next start -p ${APP_PORT}`,
          cwd: FRONTEND_DIR,
          port: APP_PORT,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ]
    : [
        {
          command: `node mock-server.mjs ${MOCK_API_PORT}`,
          cwd: __dirname,
          port: MOCK_API_PORT,
          reuseExistingServer: !process.env.CI,
          timeout: 15_000,
        },
        {
          command: `npx next start -p ${APP_PORT}`,
          cwd: FRONTEND_DIR,
          port: APP_PORT,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],
  projects: [
    { name: "mobile-light", use: { viewport: { width: 390, height: 844 }, colorScheme: "light" } },
    { name: "mobile-dark", use: { viewport: { width: 390, height: 844 }, colorScheme: "dark" } },
    { name: "desktop-light", use: { viewport: { width: 1440, height: 900 }, colorScheme: "light" } },
    { name: "desktop-dark", use: { viewport: { width: 1440, height: 900 }, colorScheme: "dark" } },
  ],
});
