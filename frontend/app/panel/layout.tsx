import type { ReactNode } from "react";
import { RequireRole } from "@/components/RequireRole";
import { Lateral } from "@/components/panel/Lateral";
import { BarraTemporal } from "@/components/panel/BarraTemporal";

// Marco de todo /panel (estudiante, cliente, agencia y admin). Desde 1024 px,
// el lateral de 288 px con el mismo árbol que el cajón; debajo de eso, el
// cajón y la barra inferior. Cada página sigue pidiendo su propio rol.
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole roles={["Estudiante", "Cliente", "Agencia", "Admin"]}>
      <div className="lg:grid lg:grid-cols-[288px_minmax(0,1fr)]">
        <Lateral />
        <div className="min-w-0">{children}</div>
      </div>
      <BarraTemporal />
    </RequireRole>
  );
}
