"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/RequireRole";
import { Icono } from "@/components/Icono";
import { Chip } from "@/components/ds/Chip";
import { Tesela } from "@/components/ds/Lista";
import { EncabezadoPagina, Pagina } from "@/components/trabajo/Pagina";

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
    <Pagina>
      <EncabezadoPagina
        titulo={user?.nombreCompleto ?? "Tu agencia"}
        bajada="Panel institucional y de operaciones para agencias y empresas aliadas en LEX."
        antes={
          <div className="mb-2">
            <Chip tono="acento" icono="briefcase">
              Vista Agencia
            </Chip>
          </div>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Acción disponible: explorar vidriera de talento */}
        <Link
          href="/"
          className="group flex flex-col justify-between rounded-card bg-surface p-6 shadow-[0_0_0_1px_var(--color-line)] transition-all hover:bg-surface-2 hover:shadow-[0_0_0_1px_var(--color-line-strong)] dark:shadow-none"
        >
          <div>
            <Tesela icono="compass" tono="acento" />
            <h2 className="mt-4 text-base font-semibold text-ink sm:text-[17px]">
              Explorar vidriera de servicios
            </h2>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-2">
              Buscá y contratá talento universitario verificado para proyectos de tu agencia.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-[15px] font-semibold text-ink group-hover:text-ink-2">
            <span>Ir a la vidriera</span>
            <Icono nombre="chev-r" className="size-4" />
          </div>
        </Link>

        {/* Módulo próximo con estilo del sistema */}
        <div className="flex flex-col justify-between rounded-card bg-surface-2 p-6 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
          <div>
            <Tesela icono="users" tono="neutro" />
            <h2 className="mt-4 text-base font-semibold text-ink sm:text-[17px]">
              Gestión corporativa de cuentas
            </h2>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-2">
              Próximamente: gestión de equipos, múltiples proyectos paralelos y facturación centralizada para agencias.
            </p>
          </div>
          <div className="mt-5">
            <Chip tono="neutro" icono="clock">
              Próximamente
            </Chip>
          </div>
        </div>
      </div>
    </Pagina>
  );
}
