"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/RequireRole";

export default function PanelAgenciaPage() {
  return (
    <RequireRole roles={["Agencia"]} vista="Agencia">
      <PanelAgencia />
    </RequireRole>
  );
}

function PanelAgencia() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-accent-soft/50 to-white p-8">
        <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          Vista Agencia
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {user?.nombreCompleto ?? "Tu agencia"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Este es el panel de tu agencia en LEX.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Lo que ya se puede hacer hoy */}
        <Link
          href="/"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
        >
          <h2 className="font-semibold text-foreground">Explorar servicios</h2>
          <p className="mt-1 text-sm text-gray-500">
            Buscá talento universitario en la vidriera.
          </p>
        </Link>

        {/* Placeholder de lo que viene */}
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6">
          <h2 className="font-semibold text-foreground">
            Funcionalidades de agencia
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de proyectos, equipos y contrataciones a nombre de la agencia.
          </p>
          <span className="mt-3 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
            Próximamente
          </span>
        </div>
      </div>
    </div>
  );
}
