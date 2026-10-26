"use client";

// Encabezado y menú (componentes "Encabezado" y "Cajon" del sistema de diseño).
//
// - Sin selector de vistas (D2): con sesión, el menú agrupa "Como estudiante" y
//   "Como cliente" según los roles reales de la identidad.
// - Mobile: el botón "Menú" abre el cajón con el árbol completo (D4). La barra
//   inferior con sesión llega después, en el área del panel.
// - Escritorio: navegación pública arriba; con sesión, el mismo cajón detrás del
//   botón de la cuenta, hasta que el panel tenga su lateral.
// - Solo enlaza páginas que existen hoy.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { Identidad } from "@/lib/perfil";
import { OPCIONES_APARIENCIA, OSCURO_HABILITADO } from "@/lib/apariencia";
import { useApariencia } from "@/lib/useApariencia";
import { ActivarEstudianteModal } from "@/components/ActivarEstudianteModal";
import { Cajon } from "@/components/Cajon";
import { Icono, type NombreIcono } from "@/components/Icono";
import { clasesBoton } from "@/components/Boton";

const NAV_PUBLICA = [
  { href: "/", label: "Servicios", activo: (p: string) => p === "/" || p.startsWith("/servicios") },
  { href: "/practicas", label: "Banco de Turnos", activo: (p: string) => p.startsWith("/practicas") },
];

interface ItemMenu {
  href: string;
  label: string;
  icono: NombreIcono;
}

interface SeccionMenu {
  titulo: string;
  items: ItemMenu[];
}

function seccionesDe(roles: string[], identidad: Identidad | null): SeccionMenu[] {
  const secciones: SeccionMenu[] = [];
  if (identidad?.esEstudiante || roles.includes("Estudiante")) {
    secciones.push({
      titulo: "Como estudiante",
      items: [
        { href: "/panel/servicios", label: "Mis servicios", icono: "briefcase" },
        { href: "/panel/disponibilidad", label: "Agenda y disponibilidad", icono: "calendar" },
        { href: "/panel/trabajos", label: "Trabajos recibidos", icono: "inbox" },
        { href: "/panel/practicas", label: "Turnos que publico", icono: "calendar-plus" },
      ],
    });
  }
  if (roles.includes("Cliente")) {
    secciones.push({
      titulo: "Como cliente",
      items: [
        { href: "/panel/trabajos", label: "Contrataciones", icono: "receipt" },
        { href: "/panel/inscripciones", label: "Mis turnos del Banco", icono: "calendar" },
        { href: "/panel/pacientes", label: "Personas y mascotas", icono: "users" },
      ],
    });
  }
  if (roles.includes("Agencia")) {
    secciones.push({
      titulo: "Agencia",
      items: [{ href: "/panel/agencia", label: "Panel de agencia", icono: "briefcase" }],
    });
  }
  if (roles.includes("Admin")) {
    secciones.push({
      titulo: "Administración",
      items: [
        { href: "/panel/admin", label: "Ingresos", icono: "receipt" },
        { href: "/panel/admin/verificaciones", label: "Verificaciones", icono: "id" },
      ],
    });
  }
  secciones.push({
    titulo: "Explorar",
    items: [
      { href: "/", label: "Catálogo de servicios", icono: "compass" },
      { href: "/practicas", label: "Banco de Turnos", icono: "calendar" },
    ],
  });
  return secciones;
}

function iniciales(nombre: string | undefined) {
  if (!nombre) return "?";
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

function credencialCorta(identidad: Identidad | null) {
  const c = identidad?.carreras[0];
  if (!c) return null;
  return c.anioCursado ? `${c.carreraNombre}, ${c.anioCursado}.º año` : c.carreraNombre;
}

export function Navbar() {
  const { isAuthenticated, user, identidad, roles, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-canvas">
        <div className="mx-auto flex h-15 max-w-lex items-center gap-1.5 px-4 md:px-6 lg:h-17 lg:gap-2 lg:px-8">
          <Link
            href="/"
            aria-label="LEX, inicio"
            className="inline-flex min-h-11 items-center text-[19px] font-[760] tracking-[0.04em] text-ink no-underline"
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
              <TituloSeccion>Como estudiante</TituloSeccion>
            )}
            {mostrarCtaEstudiante && (
              <ItemBoton
                icono="cap"
                onClick={() => {
                  cerrar();
                  setModalEstudiante(true);
                }}
              >
                Ofrecé tus servicios
              </ItemBoton>
            )}
            {secciones.map((s) => (
              <div key={s.titulo}>
                <TituloSeccion>{s.titulo}</TituloSeccion>
                <ul>
                  {s.items.map((it) => (
                    <li key={it.href + it.label}>
                      <ItemLink item={it} actual={pathname === it.href} onNavegar={cerrar} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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

function TituloSeccion({ children }: { children: ReactNode }) {
  return <p className="px-3 pt-4 pb-1.5 text-label text-ink-2">{children}</p>;
}

const ITEM =
  "flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-left text-base no-underline";

function ItemLink({
  item,
  actual,
  onNavegar,
}: {
  item: ItemMenu;
  actual: boolean;
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

function ControlApariencia() {
  const [apariencia, elegir] = useApariencia();
  return (
    <fieldset className="px-3 pb-2">
      <legend className="flex min-h-12 items-center gap-3 text-base font-medium">
        <Icono nombre="contrast" className="size-5.5 text-ink-2" />
        Apariencia
      </legend>
      <div className="flex gap-0.5 rounded-pill bg-surface-2 p-[3px]">
        {OPCIONES_APARIENCIA.map((o) => (
          <label
            key={o.valor}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-pill px-2 text-center text-[14px] font-[550] text-ink-2 has-checked:bg-surface has-checked:font-[620] has-checked:text-ink has-checked:shadow-thumb has-focus-visible:outline-2 has-focus-visible:outline-focus dark:has-checked:bg-surface-3"
          >
            <input
              type="radio"
              name="apariencia"
              value={o.valor}
              checked={apariencia === o.valor}
              onChange={() => elegir(o.valor)}
              className="sr-only"
            />
            {o.etiqueta}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
