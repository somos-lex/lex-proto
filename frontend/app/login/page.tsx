import { MarcoAcceso, rutaSegura } from "@/components/publico/Acceso";
import { FormularioLogin } from "./FormularioLogin";

// Ingresar. `?volver=` (solo rutas internas) lleva de vuelta adonde estaba la persona:
// lo pasan RequireRole, la ficha de un servicio y la de un turno.

interface Props {
  searchParams: Promise<{ volver?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { volver } = await searchParams;
  return (
    <MarcoAcceso>
      <FormularioLogin volver={rutaSegura(volver)} />
    </MarcoAcceso>
  );
}
