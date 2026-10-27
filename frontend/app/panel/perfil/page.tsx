import type { Metadata } from "next";
import { RequireRole } from "@/components/RequireRole";
import { Perfil } from "@/components/panel/Perfil";

export const metadata: Metadata = {
  title: "Perfil y verificación — LEX",
};

export default function PerfilPage() {
  return (
    <RequireRole roles={["Estudiante"]}>
      <Perfil />
    </RequireRole>
  );
}
