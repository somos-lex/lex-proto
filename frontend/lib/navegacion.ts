// Árbol de navegación con sesión (D2): lo comparten el cajón (Navbar) y el
// lateral del panel, para que los dos muestren lo mismo. Solo páginas que existen.

import type { NombreIcono } from "@/components/Icono";
import type { Identidad } from "@/lib/perfil";
import { carreraCorta, institucionCorta } from "@/components/ds/Credencial";

/** Navegación pública del encabezado. */
export const NAV_PUBLICA = [
  { href: "/", label: "Servicios", activo: (p: string) => p === "/" || p.startsWith("/servicios") },
  { href: "/practicas", label: "Banco de Turnos", activo: (p: string) => p.startsWith("/practicas") },
];

export interface ItemMenu {
  /** Puede llevar query: los dos ítems de trabajos comparten pathname. */
  href: string;
  label: string;
  icono: NombreIcono;
  /** Muestra el contador de trabajos donde te toca actuar con ese rol (lib/pendientes). */
  pendientes?: "estudiante" | "cliente";
}

export interface SeccionMenu {
  /** Sin título: la primera sección, con Inicio. */
  titulo?: string;
  items: ItemMenu[];
}

export function seccionesDe(roles: string[], identidad: Identidad | null): SeccionMenu[] {
  const secciones: SeccionMenu[] = [
    { items: [{ href: "/panel", label: "Inicio", icono: "home" }] },
  ];
  if (identidad?.esEstudiante || roles.includes("Estudiante")) {
    secciones.push({
      titulo: "Como estudiante",
      items: [
        { href: "/panel/servicios", label: "Mis servicios", icono: "briefcase" },
        { href: "/panel/disponibilidad", label: "Agenda y disponibilidad", icono: "calendar" },
        { href: "/panel/trabajos?como=estudiante", label: "Trabajos recibidos", icono: "inbox", pendientes: "estudiante" },
        { href: "/panel/practicas", label: "Turnos que publico", icono: "calendar-plus" },
        { href: "/panel/perfil", label: "Perfil y verificación", icono: "id" },
      ],
    });
  }
  if (roles.includes("Cliente")) {
    secciones.push({
      titulo: "Como cliente",
      items: [
        { href: "/panel/trabajos?como=cliente", label: "Contrataciones", icono: "receipt", pendientes: "cliente" },
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

/** "Odontología, UNNE". Sin año: /perfil/yo no lo trae. */
export function credencialCorta(identidad: Identidad | null) {
  // Defensivo: una identidad guardada con otra forma (cookie vieja) no puede romper el encabezado.
  const c = identidad?.carreras?.[0];
  if (!c?.carrera) return null;
  if (!c.institucion) return carreraCorta(c.carrera);
  return `${carreraCorta(c.carrera)}, ${institucionCorta(c.institucion)}`;
}

/** Si un ítem es la página actual. Compara pathname y, si el href lleva query,
 *  también esos parámetros (los dos ítems de /panel/trabajos se distinguen por `como`). */
export function esItemActual(href: string, pathname: string, params: URLSearchParams | null): boolean {
  const [ruta, query] = href.split("?");
  if (ruta !== pathname) return false;
  if (!query) return !params?.get("como");
  const esperados = new URLSearchParams(query);
  for (const [k, v] of esperados) if (params?.get(k) !== v) return false;
  return true;
}
