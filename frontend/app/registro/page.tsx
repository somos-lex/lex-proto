import type { Metadata } from "next";
import { MarcoAcceso, rutaSegura } from "@/components/publico/Acceso";
import { FormularioRegistro } from "./FormularioRegistro";

// Crear cuenta. `?volver=` (solo rutas internas) lleva de vuelta adonde estaba la
// persona; `?como=estudiante` (desde "Soy estudiante" en la home) explica cómo se
// ofrece un servicio, porque la carrera se carga después de crear la cuenta.

interface Props {
  searchParams: Promise<{ volver?: string; como?: string }>;
}

export const metadata: Metadata = {
  title: "Crear cuenta — LEX",
  description: "Creá tu cuenta en LEX para publicar servicios como estudiante o contratar como cliente.",
  openGraph: {
    title: "Crear cuenta — LEX",
    description: "Creá tu cuenta en LEX.",
    siteName: "LEX",
    locale: "es_AR",
    type: "website",
  },
};

export default async function RegistroPage({ searchParams }: Props) {
  const { volver, como } = await searchParams;
  return (
    <MarcoAcceso>
      <FormularioRegistro volver={rutaSegura(volver)} comoEstudiante={como === "estudiante"} />
    </MarcoAcceso>
  );
}
