// Árbol de navegación con sesión (D2): lo comparten el cajón (Navbar) y el
// lateral del panel, para que los dos muestren lo mismo. Solo páginas que existen.

import type { NombreIcono } from "@/components/Icono";
import type { Identidad } from "@/lib/perfil";

/** Navegación pública del encabezado. */
export const NAV_PUBLICA = [
  { href: "/", label: "Servicios", activo: (p: string) => p === "/" || p.startsWith("/servicios") },
  { href: "/practicas", label: "Banco de Turnos", activo: (p: string) => p.startsWith("/practicas") },
];

export interface ItemMenu {
  href: string;
  label: string;
  icono: NombreIcono;
}

export interface SeccionMenu {
  titulo: string;
  items: ItemMenu[];
}

export function seccionesDe(roles: string[], identidad: Identidad | null): SeccionMenu[] {
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

export function iniciales(nombre: string | undefined) {
  if (!nombre) return "?";
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export function credencialCorta(identidad: Identidad | null) {
  const c = identidad?.carreras[0];
  if (!c) return null;
  return c.anioCursado ? `${c.carreraNombre}, ${c.anioCursado}.º año` : c.carreraNombre;
}
