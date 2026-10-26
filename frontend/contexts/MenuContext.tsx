"use client";

// Estado del cajón (menú) compartido: lo abren el botón "Menú" del encabezado y
// la pestaña "Menú" de la barra inferior, y el Navbar lo renderiza.
// Queda abierto solo en la ruta donde se abrió: al navegar, se cierra solo.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface MenuContextValue {
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
}

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abrir = useCallback(() => setAbiertoEn(pathname), [pathname]);
  const cerrar = useCallback(() => setAbiertoEn(null), []);
  const value = useMemo(() => ({ abierto: abiertoEn === pathname, abrir, cerrar }), [abiertoEn, pathname, abrir, cerrar]);
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu debe usarse dentro de un <MenuProvider>");
  return ctx;
}
