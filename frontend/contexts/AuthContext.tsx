"use client";

// Contexto de autenticación + identidad + sistema de vistas.
//
// Además del token y el usuario, acá vive la "identidad" (GET /api/perfil/yo):
// roles reales, tipoCliente, esEstudiante, puedeActivarEstudiante y carreras.
// De la identidad se derivan las "vistas" disponibles y cuál está activa.
//
// Refresco de token tras activar estudiante: activar-estudiante agrega el rol en
// la base, pero el token viejo NO lo incluye, así que las rutas protegidas darían
// 403. Para resolverlo guardamos las credenciales EN MEMORIA (nunca en cookie) al
// loguear, y refrescarSesion() vuelve a loguear para obtener un token fresco con
// el rol nuevo. Si no hay credenciales en memoria (p. ej. tras un refresh duro),
// refrescarSesion lanza "NO_CREDS" y la UI pide re-login manual.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import {
  clearSession,
  getStoredIdentidad,
  getStoredUser,
  getStoredVista,
  saveIdentidad,
  saveSession,
  saveVista,
  type AuthResponse,
  type Rol,
  type Usuario,
} from "@/lib/session";
import {
  obtenerIdentidad,
  vistaPorDefecto,
  vistasDisponiblesDe,
  type Identidad,
  type Vista,
} from "@/lib/perfil";

export interface RegisterPayload {
  email: string;
  password: string;
  nombreCompleto: string;
  telefono?: string;
  tipoRegistro: "ClienteParticular" | "ClienteEmpresa" | "Agencia";
  // Opcionales según el tipo de registro.
  dni?: string;
  razonSocial?: string;
  cuit?: string;
  nombreAgencia?: string;
}

interface AuthContextValue {
  user: Usuario | null;
  identidad: Identidad | null;
  roles: string[];
  isAuthenticated: boolean;
  /** true mientras restauramos la sesión desde la cookie al cargar. */
  loading: boolean;
  /** Vistas que el usuario tiene disponibles (Cliente / Estudiante / Agencia). */
  vistasDisponibles: Vista[];
  /** Vista actualmente activa (define navbar y paneles). */
  vistaActiva: Vista | null;
  cambiarVista: (vista: Vista) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  hasRole: (rol: Rol) => boolean;
  /** Re-loguea con las credenciales en memoria para refrescar el token tras un
   *  cambio de identidad (ej. activar estudiante). Lanza "NO_CREDS" si no hay. */
  refrescarSesion: () => Promise<Identidad>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [identidad, setIdentidad] = useState<Identidad | null>(null);
  const [vistaActiva, setVistaActiva] = useState<Vista | null>(null);
  const [loading, setLoading] = useState(true);

  // Credenciales en memoria para poder refrescar el token. NUNCA se persisten.
  const credsRef = useRef<{ email: string; password: string } | null>(null);

  // Al montar, restauramos sesión + identidad + vista persistidas (sobreviven al refresh).
  useEffect(() => {
    const u = getStoredUser();
    const id = getStoredIdentidad<Identidad>();
    setUser(u);
    setIdentidad(id);

    const vistas = vistasDisponiblesDe(id);
    const persistida = getStoredVista() as Vista | null;
    setVistaActiva(
      persistida && vistas.includes(persistida)
        ? persistida
        : vistaPorDefecto(id),
    );
    setLoading(false);
  }, []);

  // Login crudo contra la API (sin tocar identidad/vista). Reusado por login/refresh.
  const autenticar = useCallback(
    async (email: string, password: string): Promise<AuthResponse> => {
      const auth = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });
      saveSession(auth);
      setUser(auth.usuario);
      credsRef.current = { email, password };
      return auth;
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const auth = await autenticar(email, password);
      const id = await obtenerIdentidad();
      saveIdentidad(id, auth.expiraEn);
      setIdentidad(id);
      const vista = vistaPorDefecto(id);
      setVistaActiva(vista);
      if (vista) saveVista(vista);
    },
    [autenticar],
  );

  const refrescarSesion = useCallback(async (): Promise<Identidad> => {
    const creds = credsRef.current;
    if (!creds) throw new Error("NO_CREDS");
    const auth = await autenticar(creds.email, creds.password);
    const id = await obtenerIdentidad();
    saveIdentidad(id, auth.expiraEn);
    setIdentidad(id);
    // Conservamos la vista activa si sigue disponible; si no, la por defecto.
    setVistaActiva((prev) => {
      const vistas = vistasDisponiblesDe(id);
      const next = prev && vistas.includes(prev) ? prev : vistaPorDefecto(id);
      if (next) saveVista(next);
      return next;
    });
    return id;
  }, [autenticar]);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      // El backend crea el usuario (201) pero no devuelve token: logueamos a continuación.
      await apiFetch("/api/auth/register", {
        method: "POST",
        auth: false,
        body: payload,
      });
      await login(payload.email, payload.password);
    },
    [login],
  );

  const cambiarVista = useCallback((vista: Vista) => {
    setVistaActiva(vista);
    saveVista(vista);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    credsRef.current = null;
    setUser(null);
    setIdentidad(null);
    setVistaActiva(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    // La identidad es la fuente de verdad de los roles; caemos al usuario del
    // token solo si todavía no la cargamos.
    const roles = identidad?.roles ?? user?.roles ?? [];
    return {
      user,
      identidad,
      roles,
      isAuthenticated: user !== null,
      loading,
      vistasDisponibles: vistasDisponiblesDe(identidad),
      vistaActiva,
      cambiarVista,
      login,
      register,
      logout,
      hasRole: (rol: Rol) => roles.includes(rol),
      refrescarSesion,
    };
  }, [
    user,
    identidad,
    vistaActiva,
    loading,
    cambiarVista,
    login,
    register,
    logout,
    refrescarSesion,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return ctx;
}
