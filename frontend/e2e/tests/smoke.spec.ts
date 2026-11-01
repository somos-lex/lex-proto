// Pruebas de humo contra el mock-server: navegan las rutas públicas y las del
// panel con sesión demo, y verifican que carga el contenido esperado sin errores
// de consola. Corren una sola vez (en "mobile-light"): no les importa el viewport
// ni el tema, así que repetirlas en los otros 3 proyectos solo sumaría tiempo.
import { test, expect, capturarErroresDeConsola } from "../utils/fixtures";
import { loginComo } from "../utils/session";

// Alcanza con un proyecto: estas pruebas no dependen del viewport ni del tema.
test.beforeEach(async ({}, testInfo) => {
  if (testInfo.project.name !== "mobile-light") test.skip();
});

test.describe("rutas públicas", () => {
  test("home: catálogo de servicios", async ({ page }) => {
    const errores = capturarErroresDeConsola(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Servicios publicados" })).toBeVisible();
    await expect(page.getByText("Diseño de identidad visual para marcas nuevas")).toBeVisible();
    expect(errores).toEqual([]);
  });

  test("detalle de servicio: proyecto cerrado", async ({ page }) => {
    const errores = capturarErroresDeConsola(page);
    await page.goto("/servicios/1");
    await expect(page.getByRole("heading", { name: "Diseño de identidad visual para marcas nuevas" })).toBeVisible();
    expect(errores).toEqual([]);
  });

  test("detalle de servicio: clase", async ({ page }) => {
    await page.goto("/servicios/2");
    await expect(page.getByRole("heading", { name: "Clases de Química orgánica para el CBC" })).toBeVisible();
  });

  test("detalle de servicio: salud", async ({ page }) => {
    await page.goto("/servicios/3");
    await expect(page.getByRole("heading", { name: "Control odontológico general" })).toBeVisible();
  });

  test("Banco de Turnos: listado", async ({ page }) => {
    const errores = capturarErroresDeConsola(page);
    await page.goto("/practicas");
    await expect(page.getByRole("heading", { level: 1, name: "Banco de Turnos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Clínica Odontológica II" })).toBeVisible();
    expect(errores).toEqual([]);
  });

  test("Banco de Turnos: detalle de un turno", async ({ page }) => {
    await page.goto("/practicas/1");
    await expect(page.getByRole("heading", { name: "Clínica Odontológica II" })).toBeVisible();
  });

  test("perfil público de un estudiante", async ({ page }) => {
    await page.goto("/estudiantes/10");
    await expect(page.getByRole("heading", { level: 1, name: "Sofía Benítez" })).toBeVisible();
  });

  test("registro: formulario visible", async ({ page }) => {
    await page.goto("/registro");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("login con cuenta demo redirige al panel", async ({ page }) => {
    const errores = capturarErroresDeConsola(page);
    // `?volver=` es como llega acá quien intentó entrar a una ruta protegida
    // (lo pone RequireRole): sin él, login vuelve a "/" en vez de a "/panel".
    await page.goto("/login?volver=%2Fpanel");
    await page.getByLabel(/email/i).fill("sofia@demo.com");
    await page.getByLabel(/contraseña/i).fill("Demo1234");
    await page.getByRole("button", { name: /ingresar/i }).click();
    await page.waitForURL("**/panel");
    await expect(page.getByRole("heading", { name: /^Hola/ })).toBeVisible();
    expect(errores).toEqual([]);
  });
});

test.describe("panel con sesión demo", () => {
  test("inicio del panel (sofía, estudiante y cliente)", async ({ page }) => {
    await loginComo(page, "sofia");
    const errores = capturarErroresDeConsola(page);
    await page.goto("/panel");
    await expect(page.getByRole("heading", { name: /^Hola/ })).toBeVisible();
    expect(errores).toEqual([]);
  });

  test("mis servicios (sofía)", async ({ page }) => {
    await loginComo(page, "sofia");
    await page.goto("/panel/servicios");
    await expect(page.getByRole("link", { name: "Diseño de identidad visual para marcas nuevas" })).toBeVisible();
  });

  test("trabajos recibidos (sofía, como estudiante)", async ({ page }) => {
    await loginComo(page, "sofia");
    await page.goto("/panel/trabajos?como=estudiante");
    await expect(page.getByText("Clases de Química orgánica para el CBC")).toBeVisible();
  });

  test("agenda y disponibilidad (sofía)", async ({ page }) => {
    await loginComo(page, "sofia");
    await page.goto("/panel/disponibilidad");
    await expect(page.getByRole("heading", { name: "Lunes" })).toBeVisible();
  });

  test("turnos que publico (sofía)", async ({ page }) => {
    await loginComo(page, "sofia");
    await page.goto("/panel/practicas");
    await expect(page.getByRole("link", { name: "Clínica Odontológica II" })).toBeVisible();
  });

  test("perfil y verificación (sofía)", async ({ page }) => {
    await loginComo(page, "sofia");
    await page.goto("/panel/perfil");
    await expect(page.getByText("Odontología, 4.º año")).toBeVisible();
  });

  test("inicio del panel (diego, cliente)", async ({ page }) => {
    await loginComo(page, "diego");
    const errores = capturarErroresDeConsola(page);
    await page.goto("/panel");
    await expect(page.getByRole("heading", { name: /^Hola/ })).toBeVisible();
    expect(errores).toEqual([]);
  });

  test("contrataciones (diego, como cliente)", async ({ page }) => {
    await loginComo(page, "diego");
    await page.goto("/panel/trabajos?como=cliente");
    await expect(page.getByText("Control odontológico general")).toBeVisible();
  });

  test("personas y mascotas (diego)", async ({ page }) => {
    await loginComo(page, "diego");
    await page.goto("/panel/pacientes");
    await expect(page.getByText("Rocky")).toBeVisible();
  });

  test("mis turnos del Banco (diego)", async ({ page }) => {
    await loginComo(page, "diego");
    await page.goto("/panel/inscripciones");
    await expect(page.getByText("Clínica de Pequeños Animales")).toBeVisible();
  });
});
