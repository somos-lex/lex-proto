"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { VISTA_META, type Vista } from "@/lib/perfil";
import { ActivarEstudianteModal } from "@/components/ActivarEstudianteModal";

// Ítems de navbar por vista. Solo enlazamos a páginas que existen hoy.
const NAV_POR_VISTA: Record<Vista, { href: string; label: string }[]> = {
  Cliente: [
    { href: "/", label: "Explorar servicios" },
    { href: "/panel/trabajos", label: "Mis trabajos" },
    { href: "/panel/pacientes", label: "Mis pacientes" },
  ],
  Estudiante: [
    { href: "/panel/servicios", label: "Mis servicios" },
    { href: "/panel/disponibilidad", label: "Disponibilidad" },
    { href: "/panel/trabajos", label: "Mis trabajos" },
  ],
  Agencia: [
    { href: "/panel/agencia", label: "Panel de agencia" },
    { href: "/", label: "Explorar servicios" },
  ],
};

export function Navbar() {
  const {
    isAuthenticated,
    user,
    identidad,
    logout,
    loading,
    vistaActiva,
    vistasDisponibles,
  } = useAuth();
  const router = useRouter();
  const [modalEstudiante, setModalEstudiante] = useState(false);

  function handleLogout() {
    logout();
    router.push("/");
  }

  // CTA "¿Sos estudiante?": Cliente Particular que aún no es estudiante.
  const mostrarCtaEstudiante =
    !!identidad && identidad.puedeActivarEstudiante && !identidad.esEstudiante;

  const items = vistaActiva ? NAV_POR_VISTA[vistaActiva] : [];

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-foreground"
          >
            LEX<span className="text-accent">.</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {loading ? (
              <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-100" />
            ) : isAuthenticated ? (
              <>
                {items.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition hover:text-accent sm:inline"
                  >
                    {item.label}
                  </Link>
                ))}

                {mostrarCtaEstudiante && (
                  <button
                    onClick={() => setModalEstudiante(true)}
                    className="rounded-lg border border-accent/30 bg-accent-soft/60 px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent-soft"
                  >
                    ¿Sos estudiante? Ofrecé tus servicios
                  </button>
                )}

                {vistasDisponibles.length > 1 && vistaActiva && (
                  <ViewSwitcher />
                )}

                <span className="hidden text-sm text-gray-600 lg:inline">
                  Hola,{" "}
                  <span className="font-semibold text-foreground">
                    {user?.nombreCompleto}
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:text-accent"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {modalEstudiante && (
        <ActivarEstudianteModal onClose={() => setModalEstudiante(false)} />
      )}
    </>
  );
}

// Dropdown para cambiar de vista cuando el usuario tiene más de una (ej. Cliente+Estudiante).
function ViewSwitcher() {
  const { vistaActiva, vistasDisponibles, cambiarVista } = useAuth();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  function seleccionar(v: Vista) {
    setAbierto(false);
    if (v === vistaActiva) return;
    cambiarVista(v);
    // Llevamos al inicio de la vista elegida para evitar quedar en un panel ajeno.
    router.push(v === "Estudiante" ? "/panel/servicios" : "/");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((a) => !a)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-accent/40"
      >
        <span className="text-gray-400">Vista:</span>
        {vistaActiva ? VISTA_META[vistaActiva].label : ""}
        <svg
          className={`h-4 w-4 text-gray-400 transition ${abierto ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {abierto && (
        <>
          {/* Capa para cerrar al hacer click afuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {vistasDisponibles.map((v) => (
              <button
                key={v}
                onClick={() => seleccionar(v)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                  v === vistaActiva
                    ? "font-semibold text-accent"
                    : "text-gray-700"
                }`}
              >
                {VISTA_META[v].label}
                {v === vistaActiva && (
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
