"use client";

// Patrón reutilizable de protección de rutas por rol.
//
// Uso:
//   <RequireRole roles={["Estudiante"]}>...contenido protegido...</RequireRole>
//
// Comportamiento:
//   - mientras se restaura la sesión → spinner
//   - sin sesión → redirige a /login
//   - con sesión pero rol no permitido → mensaje "sin acceso"
//   - rol válido → renderiza children

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { Rol } from "@/lib/session";
import type { Vista } from "@/lib/perfil";

export function RequireRole({
  roles,
  vista,
  children,
}: {
  roles: Rol[];
  /** Si se indica y el usuario tiene esa vista disponible, la activa al entrar
   *  para mantener la navbar coherente con el panel que está viendo. */
  vista?: Vista;
  children: React.ReactNode;
}) {
  const {
    isAuthenticated,
    loading,
    roles: misRoles,
    vistaActiva,
    vistasDisponibles,
    cambiarVista,
  } = useAuth();
  const router = useRouter();

  const permitido = roles.some((r) => misRoles.includes(r));

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Sincronizamos la vista activa con el panel al que entró el usuario (deep links).
  useEffect(() => {
    if (loading || !permitido || !vista) return;
    if (vistaActiva !== vista && vistasDisponibles.includes(vista)) {
      cambiarVista(vista);
    }
  }, [loading, permitido, vista, vistaActiva, vistasDisponibles, cambiarVista]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-accent" />
      </div>
    );
  }

  if (!permitido) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-foreground">Sin acceso</h1>
        <p className="mt-2 text-sm text-gray-600">
          Esta sección es solo para{" "}
          {roles.join(" / ")}. Tu cuenta no tiene ese rol.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Ir a la vidriera
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
