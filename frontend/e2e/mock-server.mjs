// Servidor HTTP mínimo (sin dependencias) que imita el backend de LEX para las
// pruebas visuales. Se usa en vez de `page.route()` porque buena parte de las
// rutas públicas son Server Components: su fetch corre en el proceso de Next.js
// (SSR/build), no en el navegador, así que `page.route()` no lo puede interceptar.
// Levantando este mock y apuntando NEXT_PUBLIC_API_URL (en build-time) hacia él,
// tanto el fetch de servidor como el de cliente llegan a las mismas fixtures
// estables, sin tocar la base real.
//
// Uso: node e2e/mock-server.mjs [puerto]
// Variable de entorno PORT también sirve para fijar el puerto.

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, "fixtures");

function fx(nombre) {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, `${nombre}.json`), "utf-8"));
}

// Cargadas una sola vez al arrancar: las fixtures son estáticas por diseño.
const AUTH = fx("auth");
const IDENTIDAD = fx("identidad");
const SERVICIOS_LIST = fx("servicios-list");
const SERVICIO_DETALLE = { 1: fx("servicio-detalle-1"), 2: fx("servicio-detalle-2"), 3: fx("servicio-detalle-3") };
const DISPONIBILIDAD = fx("disponibilidad");
const PORTAFOLIO = { 10: fx("portafolio-10") };
const MATERIAS = fx("materias");
const MATERIAS_HABILITADAS = fx("materias-habilitadas");
const PRACTICAS_DISPONIBLES = fx("practicas-disponibles");
const PRACTICA_DETALLE = { 1: fx("practica-1") };
const PRACTICAS_MIAS = fx("practicas-mias");
const TRABAJOS_SOFIA = fx("trabajos-mios-sofia");
const TRABAJOS_DIEGO = fx("trabajos-mios-diego");
const PACIENTES_DIEGO = fx("pacientes-diego");
const INSCRIPCIONES_DIEGO = fx("inscripciones-diego");

// Token -> cuenta demo. Tokens falsos: el mock no valida JWT, solo distingue cuentas.
const TOKEN_A_CUENTA = {
  "mock-token-sofia": "sofia",
  "mock-token-diego": "diego",
};

function cuentaDe(req) {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) return null;
  return TOKEN_A_CUENTA[auth.slice("Bearer ".length)] ?? null;
}

function json(res, status, body) {
  const texto = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  });
  res.end(texto);
}

function leerCuerpo(req) {
  return new Promise((resolve) => {
    let datos = "";
    req.on("data", (chunk) => (datos += chunk));
    req.on("end", () => {
      try {
        resolve(datos ? JSON.parse(datos) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    });
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const ruta = url.pathname;
  const cuenta = cuentaDe(req);

  // --- Auth ---
  if (req.method === "POST" && ruta === "/api/auth/login") {
    const body = await leerCuerpo(req);
    const entrada = Object.values(AUTH).find((a) => a.usuario.email === body.email);
    if (!entrada) return json(res, 401, { error: "Credenciales inválidas." });
    return json(res, 200, entrada);
  }

  if (req.method === "GET" && ruta === "/api/perfil/yo") {
    if (!cuenta) return json(res, 401, { error: "No autenticado." });
    return json(res, 200, IDENTIDAD[cuenta]);
  }

  // --- Servicios (públicos) ---
  if (req.method === "GET" && ruta === "/api/servicios") {
    return json(res, 200, SERVICIOS_LIST);
  }
  const mServicio = ruta.match(/^\/api\/servicios\/(\d+)$/);
  if (req.method === "GET" && mServicio) {
    const detalle = SERVICIO_DETALLE[mServicio[1]];
    if (!detalle) return json(res, 404, { error: "Servicio no encontrado." });
    return json(res, 200, detalle);
  }

  // --- Disponibilidad ---
  if (req.method === "GET" && ruta === "/api/disponibilidad/mia") {
    if (!cuenta) return json(res, 401, { error: "No autenticado." });
    return json(res, 200, DISPONIBILIDAD);
  }
  if (req.method === "GET" && /^\/api\/disponibilidad\/estudiante\/\d+$/.test(ruta)) {
    return json(res, 200, DISPONIBILIDAD);
  }

  // --- Portafolio / estudiantes ---
  const mPortafolio = ruta.match(/^\/api\/estudiantes\/(\d+)\/portafolio$/);
  if (req.method === "GET" && mPortafolio) {
    const portafolio = PORTAFOLIO[mPortafolio[1]];
    if (!portafolio) return json(res, 404, { error: "Estudiante no encontrado." });
    return json(res, 200, portafolio);
  }

  // --- Banco de Turnos ---
  if (req.method === "GET" && ruta === "/api/materias") return json(res, 200, MATERIAS);
  if (req.method === "GET" && ruta === "/api/materias/habilitadas") {
    if (!cuenta) return json(res, 401, { error: "No autenticado." });
    return json(res, 200, MATERIAS_HABILITADAS);
  }
  if (req.method === "GET" && ruta === "/api/practicas/disponibles") return json(res, 200, PRACTICAS_DISPONIBLES);
  if (req.method === "GET" && ruta === "/api/practicas/mias") {
    if (!cuenta) return json(res, 401, { error: "No autenticado." });
    return json(res, 200, PRACTICAS_MIAS);
  }
  const mPractica = ruta.match(/^\/api\/practicas\/(\d+)$/);
  if (req.method === "GET" && mPractica) {
    const detalle = PRACTICA_DETALLE[mPractica[1]];
    if (!detalle) return json(res, 404, { error: "Turno no encontrado." });
    return json(res, 200, detalle);
  }
  if (req.method === "GET" && ruta === "/api/inscripciones/mias") {
    if (!cuenta) return json(res, 401, { error: "No autenticado." });
    return json(res, 200, cuenta === "diego" ? INSCRIPCIONES_DIEGO : []);
  }

  // --- Trabajos ---
  if (req.method === "GET" && ruta === "/api/trabajos/mios") {
    if (!cuenta) return json(res, 401, { error: "No autenticado." });
    return json(res, 200, cuenta === "sofia" ? TRABAJOS_SOFIA : TRABAJOS_DIEGO);
  }

  // --- Pacientes ---
  if (req.method === "GET" && ruta === "/api/pacientes") {
    if (!cuenta) return json(res, 401, { error: "No autenticado." });
    return json(res, 200, cuenta === "diego" ? PACIENTES_DIEGO : []);
  }

  console.warn(`[mock-server] sin mapear: ${req.method} ${ruta}`);
  return json(res, 404, { error: `No mapeado en el mock: ${req.method} ${ruta}` });
});

const PORT = Number(process.argv[2] ?? process.env.PORT ?? 3391);
server.listen(PORT, () => {
  console.log(`[mock-server] escuchando en http://localhost:${PORT}`);
});
