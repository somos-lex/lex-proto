// Tipos compartidos de autenticación y manejo de la sesión en cookies.
//
// Decisión de almacenamiento: guardamos el token en una COOKIE (no en
// localStorage). Razones:
//   1. Sobrevive al refresh y es legible tanto en cliente como —si más
//      adelante agregamos middleware/SSR— en el servidor. localStorage NO
//      existe durante el render del servidor, así que rompería cualquier SSR.
//   2. Permite proteger rutas con un `proxy.ts` (middleware) leyendo la cookie.
//
// Nota de seguridad: esta cookie es legible por JS (no httpOnly), porque el
// cliente de API necesita adjuntar el token como header `Authorization: Bearer`.
// Para producción lo ideal sería que el backend setee una cookie httpOnly, pero
// como la API devuelve el token en el body y lo mandamos como Bearer a mano,
// una cookie legible por JS con SameSite=Lax es la opción pragmática acá.

export type Rol = "Estudiante" | "Cliente" | "Agencia" | "Admin";

export interface Usuario {
  usuarioId: number;
  email: string;
  nombreCompleto: string;
  telefono?: string | null;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  expiraEn: string; // ISO 8601
  usuario: Usuario;
}

const TOKEN_COOKIE = "lex_token";
const USER_COOKIE = "lex_user";
const IDENTIDAD_COOKIE = "lex_identidad";
const VISTA_COOKIE = "lex_vista";

function setCookie(name: string, value: string, expires?: Date): void {
  if (typeof document === "undefined") return;
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "path=/",
    "SameSite=Lax",
  ];
  if (expires) parts.push(`expires=${expires.toUTCString()}`);
  // En producción (https) conviene marcar Secure; en localhost lo omitimos.
  if (typeof location !== "undefined" && location.protocol === "https:") {
    parts.push("Secure");
  }
  document.cookie = parts.join("; ");
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/** Devuelve el JWT guardado, o null si no hay sesión. */
export function getToken(): string | null {
  return getCookie(TOKEN_COOKIE);
}

/** Lee el usuario persistido para restaurar la sesión tras un refresh. */
export function getStoredUser(): Usuario | null {
  const raw = getCookie(USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

/** Persiste token + usuario en cookies con la expiración que indica el backend. */
export function saveSession(auth: AuthResponse): void {
  const expires = new Date(auth.expiraEn);
  const valid = !Number.isNaN(expires.getTime()) ? expires : undefined;
  setCookie(TOKEN_COOKIE, auth.token, valid);
  setCookie(USER_COOKIE, JSON.stringify(auth.usuario), valid);
}

/** Persiste la identidad (roles, tipoCliente, esEstudiante, …) para que el
 *  sistema de vistas sobreviva al refresh sin re-consultar la API al instante.
 *  Genérico para no acoplar session.ts al tipo Identidad (evita ciclo de import). */
export function saveIdentidad(identidad: unknown, expiraEn?: string): void {
  const expires = expiraEn ? new Date(expiraEn) : undefined;
  const valid = expires && !Number.isNaN(expires.getTime()) ? expires : undefined;
  setCookie(IDENTIDAD_COOKIE, JSON.stringify(identidad), valid);
}

/** Lee la identidad persistida, o null si no hay. */
export function getStoredIdentidad<T>(): T | null {
  const raw = getCookie(IDENTIDAD_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Persiste la vista activa elegida por el usuario. */
export function saveVista(vista: string): void {
  setCookie(VISTA_COOKIE, vista);
}

/** Lee la vista activa persistida, o null. */
export function getStoredVista(): string | null {
  return getCookie(VISTA_COOKIE);
}

/** Borra la sesión (logout). */
export function clearSession(): void {
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(USER_COOKIE);
  deleteCookie(IDENTIDAD_COOKIE);
  deleteCookie(VISTA_COOKIE);
}
