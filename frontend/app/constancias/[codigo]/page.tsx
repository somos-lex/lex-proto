import Link from "next/link";
import { formatFechaAR, formatFechaHoraAR, verificarConstancia } from "@/lib/practicas";
import { ApiError } from "@/lib/api";
import { Icono } from "@/components/Icono";
import { Chip } from "@/components/ds/Chip";
import { Aviso } from "@/components/ds/Aviso";
import { Tesela } from "@/components/ds/Lista";
import { Definiciones } from "@/components/publico/Datos";
import { FormularioCodigo } from "../FormularioCodigo";

// Verificación pública de una constancia (Server Component), pensada para la cátedra.
// Muestra solo estudiante, materia, carrera, institución, fecha y asistencia: ningún dato
// del paciente, que es lo único que el backend tampoco expone por esta vía.

interface Props {
  params: Promise<{ codigo: string }>;
}

export default async function ConstanciaPublicaPage({ params }: Props) {
  const { codigo } = await params;
  const buscado = decodeURIComponent(codigo);

  let constancia;
  try {
    constancia = await verificarConstancia(buscado);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return <NoEncontrada codigo={buscado} />;
    throw err;
  }

  return (
    <Marco>
      <div className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
        <div className="flex items-start gap-3.5 px-5 pt-5 pb-4">
          <Tesela icono="check-circle" tono="ok" />
          <div className="min-w-0">
            <h1 className="text-title-3">Constancia auténtica, emitida por LEX</h1>
            <p className="mt-1 text-[24px] leading-[1.2] font-bold tracking-[0.04em] break-all">{constancia.codigo}</p>
            <div className="mt-3">
              {constancia.asistenciaRegistrada ? (
                <Chip tono="ok" icono="check-circle">
                  El paciente asistió
                </Chip>
              ) : (
                <Chip icono="alert">El paciente no se presentó</Chip>
              )}
            </div>
          </div>
        </div>
        <div className="px-1 pb-1">
          <Definiciones
            filas={[
              { rotulo: "Estudiante", valor: constancia.nombreEstudiante },
              { rotulo: "Materia", valor: constancia.nombreMateria },
              { rotulo: "Carrera", valor: constancia.nombreCarrera },
              { rotulo: "Institución", valor: constancia.nombreInstitucion },
              { rotulo: "Fecha del turno", valor: <span className="first-letter:uppercase">{formatFechaHoraAR(constancia.fechaPractica)}</span> },
              { rotulo: "Emitida", valor: formatFechaAR(constancia.fechaEmision) },
            ]}
          />
        </div>
      </div>
      <p className="mt-3 text-[15px] text-ink-2">Por privacidad, la verificación no muestra datos del paciente.</p>
      <Link href="/constancias" className="-ml-1 mt-4 inline-flex min-h-11 items-center gap-1 rounded-control px-1 font-semibold">
        Verificar otro código
        <Icono nombre="chev-r" className="size-[18px]" />
      </Link>
    </Marco>
  );
}

function NoEncontrada({ codigo }: { codigo: string }) {
  return (
    <Marco>
      <h1 className="text-title-1-mobile lg:text-title-1">Verificar una constancia</h1>
      <Aviso tono="danger" titulo="No encontramos ninguna constancia con ese código." className="mt-5">
        Buscamos <b className="font-semibold break-all">{codigo}</b>. Revisá que esté bien copiado y probá de nuevo.
      </Aviso>
      <div className="mt-6">
        <FormularioCodigo valor={codigo} />
      </div>
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lex px-4 pt-5 md:px-6 lg:px-8 lg:pt-10">
      <div className="max-w-2xl">{children}</div>
    </div>
  );
}
