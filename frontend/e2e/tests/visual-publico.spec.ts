// Capturas de regresión de las rutas públicas, contra el mock-server (fixtures
// estables). Corren en los 4 proyectos (390/1440 × claro/oscuro, ver
// playwright.config.ts). Los nombres de archivo salen del título del test.
import { test, expect } from "../utils/fixtures";

test.describe("visual: público", () => {
  test("home", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Servicios publicados" })).toBeVisible();
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });

  test("detalle de servicio - proyecto cerrado", async ({ page }) => {
    await page.goto("/servicios/1");
    await expect(page.getByRole("heading", { name: "Diseño de identidad visual para marcas nuevas" })).toBeVisible();
    await expect(page).toHaveScreenshot("servicio-proyecto-cerrado.png", { fullPage: true });
  });

  test("detalle de servicio - clase", async ({ page }) => {
    await page.goto("/servicios/2");
    await expect(page.getByRole("heading", { name: "Clases de Química orgánica para el CBC" })).toBeVisible();
    await expect(page).toHaveScreenshot("servicio-clase.png", { fullPage: true });
  });

  test("detalle de servicio - salud", async ({ page }) => {
    await page.goto("/servicios/3");
    await expect(page.getByRole("heading", { name: "Control odontológico general" })).toBeVisible();
    await expect(page).toHaveScreenshot("servicio-salud.png", { fullPage: true });
  });

  test("Banco de Turnos - listado", async ({ page }) => {
    await page.goto("/practicas");
    await expect(page.getByRole("heading", { level: 1, name: "Banco de Turnos" })).toBeVisible();
    await expect(page).toHaveScreenshot("practicas-listado.png", { fullPage: true });
  });

  test("Banco de Turnos - detalle de turno", async ({ page }) => {
    await page.goto("/practicas/1");
    await expect(page.getByRole("heading", { name: "Clínica Odontológica II" })).toBeVisible();
    await expect(page).toHaveScreenshot("practicas-detalle.png", { fullPage: true });
  });

  test("perfil público de estudiante", async ({ page }) => {
    await page.goto("/estudiantes/10");
    await expect(page.getByRole("heading", { level: 1, name: "Sofía Benítez" })).toBeVisible();
    await expect(page).toHaveScreenshot("estudiante-portafolio.png", { fullPage: true });
  });

  test("login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /ingresar/i })).toBeVisible();
    await expect(page).toHaveScreenshot("login.png", { fullPage: true });
  });

  test("registro", async ({ page }) => {
    await page.goto("/registro");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveScreenshot("registro.png", { fullPage: true });
  });
});
