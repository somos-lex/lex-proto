// Cliente de API centralizado.
//
// `apiFetch` envuelve a fetch para:
//   - armar la URL base a partir de NEXT_PUBLIC_API_URL
//   - poner Content-Type: application/json
//   - adjuntar Authorization: Bearer <token> cuando hay sesión
//   - normalizar los errores del backend ({ "error": "mensaje" } con 400/401/403/404)
//     y los de validación de ASP.NET ({ errors: { Campo: [...] } }) lanzando un
//     ApiError con un mensaje mostrable en pantalla.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5156";

// Lee el JWT de la cookie `lex_token`, funcione desde donde funcione:
//   - Client Components: de `document.cookie` (igual que `session.getToken`).
//   - Server Components: del store de cookies de Next, que no expone `document`.
// El `import('next/headers')` es DINÁMICO a propósito: ese módulo es server-only y un
// import estático arriba (api.ts lo consumen Client Components) rompería el bundle de
// cliente. Al vivir dentro de la rama server, nunca llega al navegador.
async function obtenerToken(): Promise<string | null> {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )lex_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get("lex_token")?.value ?? null;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  /** Cuerpo a serializar como JSON. */
  body?: unknown;
  /** Adjuntar el Bearer token si hay sesión. Default: true. */
  auth?: boolean;
}

// Intenta extraer un mensaje de error legible de cualquier forma que use el backend.
function extractErrorMessage(data: unknown, status: number): string {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // Excepciones de dominio del backend: { error: "..." }
    if (typeof obj.error === "string") return obj.error;
    // ProblemDetails de validación de ASP.NET: { errors: { Campo: ["..."] } }
    if (obj.errors && typeof obj.errors === "object") {
      const mensajes = Object.values(obj.errors as Record<string, unknown>)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .filter((v): v is string => typeof v === "string");
      if (mensajes.length) return mensajes.join(" ");
    }
    if (typeof obj.title === "string") return obj.title;
    if (typeof obj.message === "string") return obj.message;
  }
  return `Error ${status}`;
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set("Content-Type", "application/json");

  if (auth) {
    const token = await obtenerToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new ApiError(extractErrorMessage(data, res.status), res.status);
  }

  // 204 No Content o cuerpo vacío
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
