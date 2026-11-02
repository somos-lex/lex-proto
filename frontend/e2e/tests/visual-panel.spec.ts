// Capturas de regresión del panel, con sesión demo inyectada por cookie (ver
// e2e/utils/session.ts) contra el mock-server. Cubre sofía (estudiante y
// cliente) y diego (cliente). No cubre agencia ni admin: no hay cuenta demo de
// agencia en el alcance de esta tanda y admin está fuera de alcance (solo
// lectura contra la base real, sin credenciales de admin compartidas).
import { test, expect } from "../utils/fixtures";
import { loginComo } from "../utils/session";

test.describe("visual: panel (sofía)", () => {
  test.beforeEach(async ({ page }) => {
    await loginComo(page, "sofia");
  });

  test("inicio", async ({ page }) => {
    await page.goto("/panel");
    await expect(page.getByRole("heading", { name: /^Hola/ })).toBeVisible();
    await expect(page).toHaveScreenshot("panel-inicio-sofia.png", { fullPage: true });
  });

  test("mis servicios", async ({ page }) => {
    await page.goto("/panel/servicios");
    await expect(page.getByRole("link", { name: "Diseño de identidad visual para marcas nuevas" })).toBeVisible();
    await expect(page).toHaveScreenshot("panel-servicios.png", { fullPage: true });
  });

  test("trabajos recibidos", async ({ page }) => {
    await page.goto("/panel/trabajos?como=estudiante");
    await expect(page.getByText("Clases de Química orgánica para el CBC")).toBeVisible();
    await expect(page).toHaveScreenshot("panel-trabajos-estudiante.png", { fullPage: true });
  });

  test("agenda y disponibilidad", async ({ page }) => {
    await page.goto("/panel/disponibilidad");
    await expect(page.getByRole("heading", { name: "Lunes" })).toBeVisible();
    await expect(page).toHaveScreenshot("panel-disponibilidad.png", { fullPage: true });
  });

  test("turnos que publico", async ({ page }) => {
    await page.goto("/panel/practicas");
    await expect(page.getByRole("link", { name: "Clínica Odontológica II" })).toBeVisible();
    await expect(page).toHaveScreenshot("panel-practicas.png", { fullPage: true });
  });

  test("perfil y verificación", async ({ page }) => {
    await page.goto("/panel/perfil");
    await expect(page.getByText("Odontología, 4.º año")).toBeVisible();
    await expect(page).toHaveScreenshot("panel-perfil.png", { fullPage: true });
  });
});

test.describe("visual: panel (diego)", () => {
  test.beforeEach(async ({ page }) => {
    await loginComo(page, "diego");
  });

  test("inicio", async ({ page }) => {
    await page.goto("/panel");
    await expect(page.getByRole("heading", { name: /^Hola/ })).toBeVisible();
    await expect(page).toHaveScreenshot("panel-inicio-diego.png", { fullPage: true });
  });

  test("contrataciones", async ({ page }) => {
    await page.goto("/panel/trabajos?como=cliente");
    await expect(page.getByText("Control odontológico general")).toBeVisible();
    await expect(page).toHaveScreenshot("panel-trabajos-cliente.png", { fullPage: true });
  });

  test("personas y mascotas", async ({ page }) => {
    await page.goto("/panel/pacientes");
    await expect(page.getByText("Rocky")).toBeVisible();
    await expect(page).toHaveScreenshot("panel-pacientes.png", { fullPage: true });
  });

  test("mis turnos del Banco", async ({ page }) => {
    await page.goto("/panel/inscripciones");
    await expect(page.getByText("Clínica de Pequeños Animales")).toBeVisible();
    await expect(page).toHaveScreenshot("panel-inscripciones.png", { fullPage: true });
  });
});
