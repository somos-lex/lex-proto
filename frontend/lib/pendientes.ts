"use client";

// Trabajos donde le toca actuar a la persona: lo usan el contador del botón
// "Menú", el cajón, el lateral y la barra inferior del panel, y el "Próximo paso"
// del Inicio. Una sola llamada a /api/trabajos/mios compartida por todos.
//
// Regla (espeja lib/transicionesTrabajo.ts): Pendiente y Aceptado le tocan al
// estudiante del trabajo (aceptar, iniciar); Entregado, al cliente (completar).

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listarMisTrabajos, type TrabajoResponse } from "@/lib/trabajos";

export function teToca(trabajo: TrabajoResponse, usuarioId: number): boolean {
  if (trabajo.estudianteId === usuarioId && (trabajo.estado === "Pendiente" || trabajo.estado === "Aceptado")) return true;
  if (trabajo.clienteId === usuarioId && trabajo.estado === "Entregado") return true;
  return false;
}

interface EstadoPendientes {
  usuarioId: number | null;
  cargando: boolean;
  error: boolean;
  trabajos: TrabajoResponse[];
}

const VACIO: EstadoPendientes = { usuarioId: null, cargando: false, error: false, trabajos: [] };
let estado: EstadoPendientes = VACIO;
let enVuelo: Promise<void> | null = null;
let cargadoEn = 0;
const oyentes = new Set<() => void>();

function publicar(nuevo: EstadoPendientes) {
  estado = nuevo;
  oyentes.forEach((o) => o());
}

/** Carga (o recarga) los trabajos del usuario. Deduplica llamadas simultáneas y
 *  no repite si se cargó hace menos de 30 s, salvo `forzar`. */
export function cargarPendientes(usuarioId: number, forzar = false): Promise<void> {
  const mismo = estado.usuarioId === usuarioId;
  if (mismo && enVuelo) return enVuelo;
  if (mismo && !forzar && !estado.error && Date.now() - cargadoEn < 30_000) return Promise.resolve();
  publicar({ ...(mismo ? estado : VACIO), usuarioId, cargando: true, error: false });
  enVuelo = listarMisTrabajos()
    .then((trabajos) => {
      if (estado.usuarioId !== usuarioId) return;
      cargadoEn = Date.now();
      publicar({ usuarioId, cargando: false, error: false, trabajos });
    })
    .catch(() => {
      if (estado.usuarioId === usuarioId) publicar({ ...estado, cargando: false, error: true });
    })
    .finally(() => {
      enVuelo = null;
    });
  return enVuelo;
}

function suscribir(o: () => void) {
  oyentes.add(o);
  return () => oyentes.delete(o);
}

/** Trabajos donde te toca actuar, separados por rol. Sin sesión, todo vacío. */
export function usePendientes() {
  const { user, roles } = useAuth();
  // /api/trabajos/mios es solo para clientes y estudiantes (agencia y admin no tienen trabajos).
  const tieneTrabajos = roles.includes("Cliente") || roles.includes("Estudiante");
  const usuarioId = tieneTrabajos ? (user?.usuarioId ?? null) : null;
  const s = useSyncExternalStore(suscribir, () => estado, () => VACIO);

  useEffect(() => {
    if (usuarioId === null) {
      if (estado.usuarioId !== null) publicar(VACIO);
      return;
    }
    void cargarPendientes(usuarioId);
  }, [usuarioId]);

  const propios = s.usuarioId === usuarioId ? s.trabajos : [];
  const pendientes = usuarioId === null ? [] : propios.filter((t) => teToca(t, usuarioId));
  const comoEstudiante = pendientes.filter((t) => t.estudianteId === usuarioId);
  const comoCliente = pendientes.filter((t) => t.clienteId === usuarioId);
  return {
    total: pendientes.length,
    pendientes,
    comoEstudiante,
    comoCliente,
    /** Todos los trabajos del usuario (para quien ya los necesite: evita otra llamada). */
    trabajos: propios,
    // En el primer render el efecto todavía no corrió: si hay usuario y el store
    // no es suyo, cuenta como cargando (no como "sin pendientes").
    cargando: usuarioId !== null && (s.usuarioId !== usuarioId || s.cargando),
    error: s.error,
    recargar: () => (usuarioId === null ? Promise.resolve() : cargarPendientes(usuarioId, true)),
  };
}
