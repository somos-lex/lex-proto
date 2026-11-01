# Pruebas E2E (Playwright)

Smoke tests + capturas de regresión visual para las rutas públicas y el panel,
en 390 px y 1440 px, claro y oscuro.

## Por qué un mock-server y no solo `page.route()`

La mayoría de las rutas públicas (`/`, `/servicios/[id]`, `/practicas`,
`/practicas/[id]`) son **Server Components**: su `fetch` al backend corre en el
proceso de Next.js durante el render de servidor (SSR / `next start`), no en el
navegador. `page.route()` de Playwright solo intercepta tráfico del navegador,
así que no puede mockear ese `fetch`.

Por eso `e2e/mock-server.mjs` es un servidor HTTP mínimo (sin dependencias)
que sirve las fixtures de `e2e/fixtures/*.json`, y el build de pruebas apunta
`NEXT_PUBLIC_API_URL` hacia él. Como esa variable se hornea en **build-time**
(no alcanza con fijarla al arrancar `next start`), el modo visual siempre
reconstruye el frontend antes de correr Playwright (ver `e2e/scripts/run-visual.mjs`).
Con esto, tanto el `fetch` de servidor como el de cliente llegan a las mismas
fixtures estables — una sola fuente de verdad, sin duplicar la lógica de mocking.

Las páginas del panel sí son Client Components (`"use client"`), así que su
`fetch` corre en el navegador — pero como igual apuntan al mismo
`NEXT_PUBLIC_API_URL`, terminan hablando con el mismo mock-server sin nada
adicional.

## Modos

| Modo | Comando | Qué corre | Backend |
| --- | --- | --- | --- |
| **mock** (default) | `npm run test:e2e` | `smoke.spec.ts` + `visual-*.spec.ts` (con capturas) | `e2e/mock-server.mjs`, fixtures estables |
| **mock, actualizando capturas** | `npm run test:e2e:update` | igual, con `--update-snapshots` | ídem |
| **real** (opcional, solo humo) | `npm run test:e2e:real` | solo `smoke-real.spec.ts`, sin capturas | backend compartido real en `http://localhost:5156` (no lo levanta: asume que ya está corriendo) |

El modo `real` es de **solo lectura**: navega con GET y hace un login real con
una cuenta demo, pero nunca contrata, acepta, publica, se inscribe, reseña ni
edita nada. No compara capturas porque el contenido de la base real cambia.

Antes de correr por primera vez: `npx playwright install chromium` (o
`--with-deps` en una máquina nueva).

## Estructura

```
e2e/
  playwright.config.ts      # 4 proyectos: mobile/desktop × light/dark
  mock-server.mjs           # backend falso, sirve fixtures/*.json
  fixtures/*.json           # datos estables (sofía, diego, servicios, turnos...)
  scripts/run-visual.mjs    # build (con API mock) + playwright test
  scripts/run-real.mjs      # build (con .env.local real) + smoke-real.spec.ts
  utils/fixtures.ts         # `test` extendido: fija claro/oscuro por proyecto
  utils/session.ts          # inyecta sesión demo por cookie (sin pasar por el login)
  tests/
    smoke.spec.ts           # humo, mock-server (corre 1 vez, no varía por viewport/tema)
    smoke-real.spec.ts      # humo, backend real (modo opcional)
    visual-publico.spec.ts  # capturas: home, servicios, prácticas, login, registro...
    visual-panel.spec.ts    # capturas: panel con sofía (estudiante+cliente) y diego (cliente)
    *.spec.ts-snapshots/    # capturas base (versionadas en el repo)
```

## Cuentas cubiertas

- **sofía** (`usuarioId: 10`): estudiante de Odontología verificada + cliente.
  Cubre el panel de estudiante (servicios, disponibilidad, turnos que publica,
  trabajos recibidos, perfil).
- **diego** (`usuarioId: 20`): cliente particular. Cubre contrataciones,
  pacientes y turnos del Banco.

No se cubre agencia ni admin: no hay cuenta demo de agencia en esta tanda, y
admin queda fuera de alcance (sin credenciales compartidas, y el acceso a la
base real es de solo lectura).

## Agregar una pantalla nueva

1. Mirá qué endpoints pide (server component: el propio `page.tsx`; client
   component: los `lib/*.ts` que importa) y agregá la fixture que falte en
   `e2e/fixtures/`.
2. Mapeá la ruta en `mock-server.mjs` (si el endpoint no existe todavía).
3. Agregá el test en `smoke.spec.ts` y, si querés capturas, en
   `visual-publico.spec.ts` o `visual-panel.spec.ts`.
4. Generá la captura base: `npm run test:e2e:update`.

## Capturas base: peso

76 PNG, **~10.4 MB** en total (`e2e/tests/*-snapshots/`). Se versionan en el
repo; los resultados de cada corrida (`e2e/test-results/`,
`e2e/playwright-report/`) NO se versionan (ver `.gitignore`).

## Limitaciones conocidas

- **Capturas específicas de plataforma**: Playwright nombra los archivos con
  el SO donde se generaron (`...-win32.png`). Estas se generaron en Windows.
  Si CI corre en Linux (lo normal con GitHub Actions), las fuentes y el
  antialiasing difieren lo suficiente como para que la primera corrida en CI
  necesite su propio set de capturas base — correlo una vez con
  `--update-snapshots` en ese entorno (o dentro de un contenedor Linux) y
  commiteá esas capturas junto a las de Windows. `maxDiffPixelRatio: 0.02` da
  algo de margen, pero no cubre saltos de fuente entre SO.
- **Barra inferior en capturas `fullPage`**: `BarraInferior` es
  `position: fixed`. En una captura `fullPage`, Chromium la ubica en su
  posición de viewport en el momento de la captura, no "pegada" al fondo real
  de la página larga — se ve flotando a mitad de la imagen. Es un efecto
  conocido de `fullPage: true` con elementos fijos, no un bug de la UI. Si en
  algún momento hace falta una captura fiel de la barra inferior, conviene un
  test aparte con `fullPage: false` (solo viewport).
- **Contenido con fecha**: las fixtures usan fechas fijas en el futuro
  (2026) para que el estado ("Pendiente", "Publicada", etc.) no cambie solo
  por el paso del tiempo. Si alguna pantalla nueva calcula algo relativo a
  "hoy" (cuenta regresiva, "hace X días"), su captura puede desincronizarse
  con el tiempo real — ajustá la fixture o fijá la hora del test con
  `page.clock` si eso pasa.
- **Alcance acotado**: cubre un subconjunto representativo de rutas (ver
  listas en los specs), no las 21 rutas del frontend. `/panel/admin`,
  `/panel/agencia`, `/panel/trabajos/[id]` y los flujos de contratación
  (`/servicios/[id]/contratar-*`) quedaron fuera de esta tanda.

## Agregarlo a CI (propuesta, todavía no activada)

No se agregó el job al workflow todavía. Esta es la propuesta: un job nuevo en
`.github/workflows/`, separado del de backend, que corre en PRs que tocan
`frontend/**`. Como las capturas son específicas del SO del runner, la primera
vez que se active hay que generar las capturas base **desde un run de este
mismo workflow** (bajalas del artifact y commiteálas), no reusar las de
Windows.

```yaml
name: frontend-e2e

on:
  pull_request:
    paths:
      - "frontend/**"

jobs:
  visual:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env:
          CI: "1"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: frontend/e2e/playwright-report/
          retention-days: 14
```

Notas para cuando se active:

- Agregar `reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]]`
  en `playwright.config.ts` (hoy solo usa `list`, pensado para correr en una
  terminal).
- El modo `real` (`test:e2e:real`) **no** debería correr en CI tal cual: el
  backend compartido es de un entorno de desarrollo puntual, no algo que CI
  pueda levantar o alcanzar de forma confiable.
