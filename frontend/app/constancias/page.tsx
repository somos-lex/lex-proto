import { redirect } from "next/navigation";
import { FormularioCodigo } from "./FormularioCodigo";

// Verificar una constancia del Banco de Turnos (Server Component). Un GET plano a esta
// misma página con ?codigo= redirige al detalle, así funciona sin JavaScript.

interface Props {
  searchParams: Promise<{ codigo?: string }>;
}

export default async function VerificarConstanciaPage({ searchParams }: Props) {
  const { codigo } = await searchParams;
  if (codigo?.trim()) redirect(`/constancias/${encodeURIComponent(codigo.trim().toUpperCase())}`);

  return (
    <div className="mx-auto max-w-lex px-4 pt-5 md:px-6 lg:px-8 lg:pt-10">
      <div className="max-w-2xl">
        <h1 className="text-title-1-mobile lg:text-title-1">Verificar una constancia</h1>
        <p className="mt-2.5 text-[17px] leading-[1.5] text-ink-2 lg:text-lead">
          Cada turno del Banco de Turnos que se atiende deja una constancia con un código. Ingresalo para confirmar que
          la emitió LEX. La verificación no muestra ningún dato del paciente.
        </p>
        <div className="mt-6">
          <FormularioCodigo />
        </div>
      </div>
    </div>
  );
}
