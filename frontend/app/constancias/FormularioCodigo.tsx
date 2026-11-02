import { Boton } from "@/components/Boton";
import { Field, Input } from "@/components/ui";

// Formulario de verificación: un GET plano a /constancias con ?codigo=, que redirige al
// detalle. Funciona sin JavaScript.
export function FormularioCodigo({ valor, error }: { valor?: string; error?: string }) {
  return (
    <form method="get" action="/constancias" className="grid justify-items-start gap-4">
      <div className="w-full max-w-sm">
        <Field label="Código de la constancia" htmlFor="codigo" ayuda="Está en la constancia, con el formato LEX-XXXX-XXXX." error={error}>
          <Input
            id="codigo"
            name="codigo"
            required
            defaultValue={valor}
            placeholder="LEX-7K3M-9QXR"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-describedby={error ? "codigo-error" : "codigo-ayuda"}
            aria-invalid={error ? true : undefined}
            className="uppercase tracking-[0.04em] placeholder:normal-case"
          />
        </Field>
      </div>
      <Boton type="submit">
        Verificar
      </Boton>
    </form>
  );
}
