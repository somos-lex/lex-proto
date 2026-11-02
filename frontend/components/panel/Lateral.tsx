"use client";

// Lateral del panel (desde 1024 px): el mismo árbol que el cajón, que sale de
// seccionesDe() en lib/navegacion.ts, con los mismos contadores
// (lib/pendientes.ts). En mobile no se muestra: ahí están el cajón y la barra
// inferior.

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { OSCURO_HABILITADO } from "@/lib/apariencia";
import { usePendientes } from "@/lib/pendientes";
import { credencialCorta, esItemActual, iniciales, seccionesDe, type ItemMenu, type SeccionMenu } from "@/lib/navegacion";
import { Icono } from "@/components/Icono";
import { Contador } from "@/components/ds/Chip";
import { ControlApariencia } from "@/components/ControlApariencia";
import { ActivarEstudianteModal } from "@/components/ActivarEstudianteModal";

type Cuentas = { estudiante: number; cliente: number };

const ITEM = "flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-left text-base no-underline";

export function Lateral() {
  const { user, identidad, roles, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pendientes = usePendientes();
  const [activando, setActivando] = useState(false);

  const secciones = seccionesDe(roles, identidad);
  const credencial = credencialCorta(identidad);
  const puedeActivar = !!identidad?.puedeActivarEstudiante && !identidad.esEstudiante;
  const props: PropsArbol = {
    secciones,
    pathname,
    cuentas: { estudiante: pendientes.comoEstudiante.length, cliente: pendientes.comoCliente.length },
    ofrecer: puedeActivar ? () => setActivando(true) : null,
  };

  return (
    // La columna lleva la superficie hasta abajo; adentro, el lateral queda fijo
    // debajo del encabezado (69 px) mientras la página se desplaza.
    <div className="hidden border-r border-line bg-surface lg:block dark:border-transparent">
      <aside
        aria-label="Navegación del panel"
        className="sticky top-[69px] flex h-[calc(100dvh-69px)] flex-col overflow-y-auto px-3 pt-3 pb-4"
      >
        {/* useSearchParams pide Suspense: mientras tanto, el actual sale solo del pathname. */}
        <Suspense fallback={<Arbol {...props} params={null} />}>
          <ArbolConParams {...props} />
        </Suspense>

        <div className="mt-auto border-t border-line pt-3">
          <div className="flex min-h-15 items-center gap-3 px-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-[15px] font-[650]" aria-hidden="true">
              {iniciales(user?.nombreCompleto)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user?.nombreCompleto}</p>
              {credencial && <p className="truncate text-[14px] text-ink-2">{credencial}</p>}
            </div>
          </div>
          {OSCURO_HABILITADO && <ControlApariencia />}
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className={`${ITEM} font-medium text-ink hover:bg-surface-2`}
          >
            <Icono nombre="logout" className="size-5.5 text-ink-2" />
            Cerrar sesión
          </button>
        </div>

        {activando && <ActivarEstudianteModal onClose={() => setActivando(false)} />}
      </aside>
    </div>
  );
}

interface PropsArbol {
  secciones: SeccionMenu[];
  pathname: string;
  cuentas: Cuentas;
  /** Quien todavía no es estudiante ve "Ofrecé tus servicios". */
  ofrecer: (() => void) | null;
}

function ArbolConParams(props: PropsArbol) {
  const params = useSearchParams();
  return <Arbol {...props} params={params} />;
}

function Arbol({ secciones, pathname, params, cuentas, ofrecer }: PropsArbol & { params: URLSearchParams | null }) {
  return (
    <nav aria-label="Panel">
      {secciones.map((s, i) => (
        <div key={s.titulo ?? `sin-titulo-${i}`}>
          {s.titulo && <p className="px-3 pt-4 pb-1.5 text-label text-ink-2">{s.titulo}</p>}
          <ul>
            {s.items.map((it) => (
              <li key={it.href + it.label}>
                <ItemLink
                  item={it}
                  actual={esItemActual(it.href, pathname, params)}
                  contador={it.pendientes ? cuentas[it.pendientes] : 0}
                />
              </li>
            ))}
          </ul>
          {/* Donde iría "Como estudiante": después de Inicio. */}
          {ofrecer && !s.titulo && (
            <>
              <p className="px-3 pt-4 pb-1.5 text-label text-ink-2">Como estudiante</p>
              <button type="button" onClick={ofrecer} className={`${ITEM} font-medium text-ink hover:bg-surface-2`}>
                <Icono nombre="cap" className="size-5.5 text-ink-2" />
                Ofrecé tus servicios
              </button>
            </>
          )}
        </div>
      ))}
    </nav>
  );
}

function ItemLink({ item, actual, contador }: { item: ItemMenu; actual: boolean; contador: number }) {
  return (
    <Link
      href={item.href}
      aria-current={actual ? "page" : undefined}
      className={`${ITEM} ${actual ? "bg-accent-soft font-[620] text-on-accent-soft" : "font-medium text-ink hover:bg-surface-2"}`}
    >
      <Icono nombre={item.icono} className={`size-5.5 ${actual ? "" : "text-ink-2"}`} />
      <span className="min-w-0 flex-1">{item.label}</span>
      {contador > 0 && <Contador n={contador} etiqueta={`${contador} donde te toca actuar`} />}
    </Link>
  );
}
