import { redirect } from "next/navigation";

// Formulario de verificación de constancias (Server Component). Un GET plano a esta misma
// página con ?codigo= redirige al detalle, así funciona sin JavaScript.

interface Props {
  searchParams: Promise<{ codigo?: string }>;
}

export default async function VerificarConstanciaPage({ searchParams }: Props) {
  const { codigo } = await searchParams;
  if (codigo?.trim()) redirect(`/constancias/${encodeURIComponent(codigo.trim())}`);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verificar una constancia</h1>
      <p className="mt-2 text-sm text-slate-600">
        Ingresá el código que figura en la constancia de práctica clínica (por ejemplo
        LEX-7K3M-9QXR) para confirmar que es auténtica.
      </p>
      <form method="get" className="mt-6 flex gap-2">
        <input
          name="codigo"
          required
          placeholder="LEX-XXXX-XXXX"
          className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Verificar
        </button>
      </form>
    </div>
  );
}
