"use client";

// Barra inferior (componente "BarraInferior" del sistema, D4: cajón y barra).
// El atajo de pulgar con sesión en mobile: Inicio, Explorar, Trabajos y Menú,
// que abre el mismo cajón del encabezado.
//
// - Solo con sesión y por debajo de 1024 px (desde ahí está el lateral).
// - Se oculta en las fichas y en los flujos, donde manda la hoja de contratar
//   o inscribirse: no se apilan dos barras fijas.
// - Reserva su alto (84 px más el área segura) con un espaciador en el flujo:
//   va después de <main>.
// - Cuatro pestañas fijas. Una quinta va al cajón, no acá.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Icono, type NombreIcono } from "@/components/Icono";
import { Contador } from "@/components/ds/Chip";
import { usePendientes } from "@/lib/pendientes";

// Fichas (servicio y turno) y flujos (contratar, inscribirse, detalle de un
// trabajo, ingresar y registrarse).
const SIN_BARRA = [/^\/servicios\/./, /^\/practicas\/./, /^\/panel\/trabajos\/./, /^\/login(\/|$)/, /^\/registro(\/|$)/];

export function barraVisibleEn(pathname: string) {
  return !SIN_BARRA.some((re) => re.test(pathname));
}

const TAB =
  "relative flex min-h-17 flex-col items-center justify-center gap-1 rounded-control text-[14px] leading-none no-underline";

export function BarraInferior({
  menuAbierto,
  abrirMenu,
}: {
  /** Si el cajón está abierto (para aria-expanded). */
  menuAbierto: boolean;
  /** Abre el mismo cajón que el botón "Menú" del encabezado. */
  abrirMenu: () => void;
}) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const pendientes = usePendientes();

  if (loading || !isAuthenticated || !barraVisibleEn(pathname)) return null;

  const n = pendientes.total;

  return (
    <>
      <div aria-hidden="true" className="h-[calc(84px+env(safe-area-inset-bottom))] shrink-0 lg:hidden" />
      <nav
        aria-label="Accesos rápidos"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-surface px-1.5 pt-[5px] pb-[calc(10px+env(safe-area-inset-bottom))] lg:hidden"
      >
        <Pestana href="/panel" icono="home" actual={pathname === "/panel"}>
          Inicio
        </Pestana>
        <Pestana href="/" icono="compass" actual={pathname === "/" || pathname === "/practicas"}>
          Explorar
        </Pestana>
        <Pestana href="/panel/trabajos" icono="inbox" actual={pathname.startsWith("/panel/trabajos")} contador={n}>
          Trabajos
        </Pestana>
        <button
          type="button"
          onClick={abrirMenu}
          aria-expanded={menuAbierto}
          aria-haspopup="dialog"
          className={`${TAB} font-[550] text-ink-2`}
        >
          <span className="grid h-8 w-15 place-items-center rounded-pill">
            <Icono nombre="menu" className="size-6" />
          </span>
          Menú
        </button>
      </nav>
    </>
  );
}

function Pestana({
  href,
  icono,
  actual,
  contador = 0,
  children,
}: {
  href: string;
  icono: NombreIcono;
  actual: boolean;
  contador?: number;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={actual ? "page" : undefined}
      className={`${TAB} ${actual ? "font-[650] text-ink" : "font-[550] text-ink-2"}`}
    >
      <span className={`grid h-8 w-15 place-items-center rounded-pill ${actual ? "bg-accent-soft text-on-accent-soft" : ""}`}>
        <Icono nombre={icono} className="size-6" />
      </span>
      {children}
      {contador > 0 && (
        <span className="absolute top-1 left-[calc(50%+6px)] rounded-pill shadow-[0_0_0_2px_var(--color-surface)]">
          <Contador n={contador} etiqueta={`${contador} donde te toca actuar`} />
        </span>
      )}
    </Link>
  );
}
