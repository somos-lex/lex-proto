import Link from "next/link";
import { clasesBoton } from "@/components/Boton";
import { Tesela } from "@/components/ds/Lista";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lex px-4 pt-10 md:px-6 lg:px-8 lg:pt-16">
      <div className="grid max-w-xl justify-items-start gap-3">
        <Tesela icono="compass" />
        <h1 className="text-title-1-mobile lg:text-title-1">No encontramos esta página</h1>
        <p className="text-[17px] leading-[1.5] text-ink-2">
          Puede que el link esté mal copiado, o que el servicio o el turno ya no estén publicados.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/" className={clasesBoton()}>
            Ver los servicios
          </Link>
          <Link href="/practicas" className={clasesBoton({ variante: "secundario" })}>
            Ir al Banco de Turnos
          </Link>
        </div>
      </div>
    </div>
  );
}
