"use client";

// Encabezado y menú (componentes "Encabezado" y "Cajon" del sistema de diseño).
//
// - Sin selector de vistas (D2): con sesión, el menú agrupa "Como estudiante" y
//   "Como cliente" según los roles reales de la identidad.
// - Mobile: el botón "Menú" abre el cajón con el árbol completo (D4). Con sesión
//   se suma la barra inferior del panel. El árbol vive en lib/navegacion.ts y lo
//   comparte el lateral del panel.
// - Escritorio: navegación pública arriba; con sesión, el mismo cajón detrás del
//   botón de la cuenta.
// - El contador cuenta los trabajos donde te toca actuar (lib/pendientes.ts).

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { OSCURO_HABILITADO } from "@/lib/apariencia";
import { usePendientes } from "@/lib/pendientes";
import {
  NAV_PUBLICA,
  credencialCorta,
  esItemActual,
  iniciales,
  seccionesDe,
  type ItemMenu,
  type SeccionMenu,
} from "@/lib/navegacion";
import { ActivarEstudianteModal } from "@/components/ActivarEstudianteModal";
import { Cajon } from "@/components/Cajon";
import { ControlApariencia } from "@/components/ControlApariencia";
import { Icono, type NombreIcono } from "@/components/Icono";
import { Contador } from "@/components/ds/Chip";
import { clasesBoton } from "@/components/Boton";

export function Navbar() {
  const { isAuthenticated, user, identidad, roles, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pendientes = usePendientes();
  const [modalEstudiante, setModalEstudiante] = useState(false);
  // El cajón queda abierto solo en la ruta donde se abrió: al navegar, se cierra.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn === pathname;
  const abrir = () => setAbiertoEn(pathname);
  const cerrar = () => setAbiertoEn(null);

  function handleLogout() {
    cerrar();
    logout();
    router.push("/");
  }

  const mostrarCtaEstudiante =
    !!identidad && identidad.puedeActivarEstudiante && !identidad.esEstudiante;

  const secciones = isAuthenticated ? seccionesDe(roles, identidad) : [];
  const credencial = credencialCorta(identidad);
  const cuentas = { estudiante: pendientes.comoEstudiante.length, cliente: pendientes.comoCliente.length };

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-canvas">
        <div className="mx-auto flex h-15 max-w-lex items-center gap-1.5 px-4 md:px-6 lg:h-17 lg:gap-2 lg:px-8">
          <Link
            href="/"
            aria-label="LEX, inicio"
            className="-ml-2 inline-flex min-h-11 min-w-11 items-center rounded-control px-2 text-[19px] font-[760] tracking-[0.04em] text-ink no-underline"
          >
            LEX
          </Link>

          <nav aria-label="Principal" className="ml-7 hidden gap-0.5 lg:flex">
            {NAV_PUBLICA.map((item) => {
              const actual = item.activo(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={actual ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-control px-3.5 font-[550] no-underline hover:bg-surface-2 hover:text-ink ${
                    actual ? "bg-surface-2 text-ink" : "text-ink-2"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            {loading ? (
              <div className="h-11 w-28 animate-pulse rounded-control bg-surface-2" aria-hidden="true" />
            ) : isAuthenticated ? (
              <button
                type="button"
                onClick={abrir}
                aria-expanded={abierto}
                aria-haspopup="dialog"
                className="inline-flex min-h-11 items-center gap-2 rounded-control bg-surface-2 py-0 pr-3.5 pl-1.5 text-[15px] font-semibold text-ink hover:bg-surface-3"
              >
                <span className="grid size-8 place-items-center rounded-full bg-surface text-[13px] font-[650]" aria-hidden="true">
                  {iniciales(user?.nombreCompleto)}
                </span>
                Menú
                {pendientes.total > 0 && (
                  <Contador n={pendientes.total} etiqueta={`${pendientes.total} donde te toca actuar`} />
                )}
              </button>
            ) : (
              <>
                <Link href="/login" className={clasesBoton({ variante: "texto", tamano: "sm" })}>
                  Ingresar
                </Link>
                {/* El hidden va en un contenedor: en el mismo elemento competiría con el inline-flex del botón. */}
                <span className="hidden lg:inline-flex">
                  <Link href="/registro" className={clasesBoton({ variante: "fuerte", tamano: "sm" })}>
                    Crear cuenta
                  </Link>
                </span>
                <button
                  type="button"
                  onClick={abrir}
                  aria-expanded={abierto}
                  aria-haspopup="dialog"
                  className="inline-flex min-h-11 items-center gap-2 rounded-control bg-surface-2 pr-3 pl-3.5 text-[15px] font-semibold text-ink hover:bg-surface-3 lg:hidden"
                >
                  <Icono nombre="menu" className="size-5.5" />
                  Menú
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <Cajon
        abierto={abierto}
        onCerrar={cerrar}
        etiqueta="Menú"
        cabecera={
          isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-[15px] font-[650]" aria-hidden="true">
                {iniciales(user?.nombreCompleto)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user?.nombreCompleto}</p>
                {credencial && <p className="truncate text-secondary text-ink-2">{credencial}</p>}
              </div>
            </div>
          ) : (
            <span className="text-[19px] font-[760] tracking-[0.04em]">LEX</span>
          )
        }
      >
        {isAuthenticated ? (
          <nav aria-label="Menú de la cuenta">
            {mostrarCtaEstudiante && (
              <>
                <TituloSeccion>Como estudiante</TituloSeccion>
                <ItemBoton
                  icono="cap"
                  onClick={() => {
                    cerrar();
                    setModalEstudiante(true);
                  }}
                >
                  Ofrecé tus servicios
                </ItemBoton>
              </>
            )}
            {/* useSearchParams necesita Suspense en las páginas estáticas: mientras tanto,
                se marca el actual solo por pathname. */}
            <Suspense fallback={<Secciones secciones={secciones} pathname={pathname} params={null} cuentas={cuentas} onNavegar={cerrar} />}>
              <SeccionesConParams secciones={secciones} pathname={pathname} cuentas={cuentas} onNavegar={cerrar} />
            </Suspense>
            <TituloSeccion>Cuenta</TituloSeccion>
            {OSCURO_HABILITADO && <ControlApariencia />}
            <ItemBoton icono="logout" onClick={handleLogout}>
              Cerrar sesión
            </ItemBoton>
          </nav>
        ) : (
          <nav aria-label="Menú">
            <ul>
              {NAV_PUBLICA.map((it) => (
                <li key={it.href}>
                  <ItemLink
                    item={{ href: it.href, label: it.label, icono: it.href === "/" ? "compass" : "calendar" }}
                    actual={it.activo(pathname)}
                    onNavegar={cerrar}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-2 px-1">
              <Link href="/registro" onClick={cerrar} className={clasesBoton({ variante: "fuerte", bloque: true })}>
                Crear cuenta
              </Link>
              <Link href="/login" onClick={cerrar} className={clasesBoton({ variante: "secundario", bloque: true })}>
                Ingresar
              </Link>
            </div>
          </nav>
        )}
      </Cajon>

      {modalEstudiante && (
        <ActivarEstudianteModal onClose={() => setModalEstudiante(false)} />
      )}
    </>
  );
}

interface PropsSecciones {
  secciones: SeccionMenu[];
  pathname: string;
  cuentas: { estudiante: number; cliente: number };
  onNavegar: () => void;
}

function SeccionesConParams(props: PropsSecciones) {
  const params = useSearchParams();
  return <Secciones {...props} params={params} />;
}

function Secciones({ secciones, pathname, params, cuentas, onNavegar }: PropsSecciones & { params: URLSearchParams | null }) {
  return (
    <>
      {secciones.map((s, i) => (
        <div key={s.titulo ?? `sin-titulo-${i}`}>
          {s.titulo && <TituloSeccion>{s.titulo}</TituloSeccion>}
          <ul>
            {s.items.map((it) => (
              <li key={it.href + it.label}>
                <ItemLink
                  item={it}
                  actual={esItemActual(it.href, pathname, params)}
                  contador={it.pendientes ? cuentas[it.pendientes] : 0}
                  onNavegar={onNavegar}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function TituloSeccion({ children }: { children: ReactNode }) {
  return <p className="px-3 pt-4 pb-1.5 text-label text-ink-2">{children}</p>;
}

const ITEM =
  "flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-left text-base no-underline";

function ItemLink({
  item,
  actual,
  contador = 0,
  onNavegar,
}: {
  item: ItemMenu;
  actual: boolean;
  contador?: number;
  onNavegar: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavegar}
      aria-current={actual ? "page" : undefined}
      className={`${ITEM} ${
        actual
          ? "bg-accent-soft font-[620] text-on-accent-soft"
          : "font-medium text-ink hover:bg-surface-2"
      }`}
    >
      <Icono nombre={item.icono} className={`size-5.5 ${actual ? "" : "text-ink-2"}`} />
      {item.label}
      {contador > 0 && (
        <span className="ml-auto">
          <Contador n={contador} etiqueta={`${contador} donde te toca actuar`} />
        </span>
      )}
    </Link>
  );
}

function ItemBoton({
  icono,
  onClick,
  children,
}: {
  icono: NombreIcono;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={`${ITEM} font-medium text-ink hover:bg-surface-2`}>
      <Icono nombre={icono} className="size-5.5 text-ink-2" />
      {children}
    </button>
  );
}
