// La credencial del propio estudiante con su estado de verificación: el carnet
// y su riel. Los estados "En revisión" y "No verificada" existen solo acá, en
// el panel del estudiante; en público la credencial siempre está verificada.

import { Carnet } from "@/components/ds/Credencial";
import { Chip } from "@/components/ds/Chip";
import { Riel } from "@/components/ds/Riel";
import type { CarreraPortafolio, EstadoVerificacion } from "@/lib/portafolio";
import { pasosDeVerificacion, textoDeVerificacion } from "@/components/panel/rieles";

export function PieVerificacion({ estado }: { estado: EstadoVerificacion }) {
  if (estado === "Pendiente") return <Chip icono="clock">En revisión</Chip>;
  if (estado === "Rechazado")
    return (
      <Chip tono="danger" icono="alert">
        No verificada
      </Chip>
    );
  return null;
}

/** Carnet y su riel con lo que significa el estado. Uno debajo del otro; si el
 *  lugar alcanza (672 px o más), uno al lado del otro. */
export function TarjetaVerificacion({
  nombre,
  carrera,
  anio,
}: {
  nombre: string;
  carrera: CarreraPortafolio;
  anio: number | null;
}) {
  const estado = carrera.estadoVerificacion;
  return (
    <div className="@container">
      <div className="grid gap-3 @2xl:grid-cols-2 @2xl:items-stretch">
        <Carnet
          rol="Tu credencial"
          nombre={nombre}
          carrera={carrera.carrera}
          anio={anio}
          institucion={carrera.institucion}
          pie={estado === "Verificado" ? undefined : <PieVerificacion estado={estado} />}
        />
        <div className="grid content-start gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
          <Riel etiqueta={`Verificación de ${carrera.carrera}`} pasos={pasosDeVerificacion(estado)} />
          <p className="text-[15px] leading-[1.45] text-ink-2">{textoDeVerificacion(estado, carrera.carrera)}</p>
        </div>
      </div>
    </div>
  );
}
