import type { Metadata } from "next";
import { Inicio } from "@/components/panel/Inicio";

export const metadata: Metadata = {
  title: "Inicio — LEX",
};

// El layout de /panel ya pide sesión (RequireRole): el Inicio es de todas las cuentas.
export default function InicioPanelPage() {
  return <Inicio />;
}
