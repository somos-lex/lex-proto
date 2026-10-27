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
import { clasesBoton } from "@/components/Boton";
import { Vacio } from "@/components/ds/Estados";
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
      // Vuelve a esta misma ruta después de iniciar sesión (login y registro respetan ?volver=).
      const volver = window.location.pathname + window.location.search;
      router.replace(`/login?volver=${encodeURIComponent(volver)}`);
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
      <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true" aria-label="Cargando">
        <div className="size-8 animate-spin rounded-full border-2 border-surface-3 border-t-accent motion-reduce:animate-none" />
      </div>
    );
  }

  if (!permitido) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Vacio icono="id" titulo="Esta sección no es para tu cuenta" acciones={<Link href="/" className={clasesBoton({ tamano: "sm" })}>Ir al catálogo</Link>}>
          Es solo para cuentas de {roles.map((r) => r.toLowerCase()).join(" o ")}.
        </Vacio>
      </div>
    );
  }

  return <>{children}</>;
}
