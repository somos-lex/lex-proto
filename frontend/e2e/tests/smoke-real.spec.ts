// Modo opcional de humo contra el BACKEND REAL (base de solo lectura). Solo
// navegación GET y un login real con las cuentas demo: NADA que escriba
// (sin contratar, aceptar, publicar, inscribirse, reseñar ni editar perfiles).
//
// Correr con: npm run test:e2e:real
// (requiere el backend compartido ya corriendo en http://localhost:5156; no lo
// levanta ni lo reinicia).
//
// Como el contenido de la base real cambia, estas pruebas NO comparan capturas:
// solo verifican que cada pantalla cargue sin el aviso de error y sin
// excepciones no atrapadas. Para no depender de IDs fijos, navegan siguiendo
// links reales de la página (el primer servicio del catálogo, el primer turno).
import { test, expect } from "../utils/fixtures";

// Humo: alcanza con un proyecto, no depende del viewport ni del tema.
test.beforeEach(async ({}, testInfo) => {
  if (testInfo.project.name !== "mobile-light") test.skip();
});

const SIN_AVISO_DE_ERROR = /No pudimos cargar/;

test.describe("humo (backend real, solo lectura)", () => {
  test("home carga el catálogo", async ({ page }) => {
    const erroresJs: string[] = [];
    page.on("pageerror", (err) => erroresJs.push(err.message));
    const resp = await page.goto("/");
    expect(resp?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Servicios publicados" })).toBeVisible();
    await expect(page.getByText(SIN_AVISO_DE_ERROR)).toHaveCount(0);
    expect(erroresJs).toEqual([]);
  });

  test("detalle de servicio, siguiendo el primer resultado del catálogo", async ({ page }) => {
    await page.goto("/");
    const primeraFicha = page.locator('a[href^="/servicios/"]').first();
    if ((await primeraFicha.count()) === 0) {
      test.skip(true, "el catálogo real no tiene servicios activos ahora mismo");
    }
    const erroresJs: string[] = [];
    page.on("pageerror", (err) => erroresJs.push(err.message));
    await primeraFicha.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(SIN_AVISO_DE_ERROR)).toHaveCount(0);
    expect(erroresJs).toEqual([]);
  });

  test("Banco de Turnos carga", async ({ page }) => {
    const resp = await page.goto("/practicas");
    expect(resp?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1, name: "Banco de Turnos" })).toBeVisible();
    await expect(page.getByText(SIN_AVISO_DE_ERROR)).toHaveCount(0);
  });

  test("login real con sofía y vuelta al panel", async ({ page }) => {
    const erroresJs: string[] = [];
    page.on("pageerror", (err) => erroresJs.push(err.message));
    await page.goto("/login?volver=%2Fpanel");
    await page.getByLabel(/email/i).fill("sofia@demo.com");
    await page.getByLabel(/contraseña/i).fill("Demo1234");
    await page.getByRole("button", { name: /ingresar/i }).click();
    await page.waitForURL("**/panel");
    await expect(page.getByRole("heading", { name: /^Hola/ })).toBeVisible();
    expect(erroresJs).toEqual([]);
  });
});
