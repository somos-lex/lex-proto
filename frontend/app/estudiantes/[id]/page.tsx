import { notFound } from "next/navigation";
import { obtenerPortafolio } from "@/lib/portafolio";
import { ApiError } from "@/lib/api";
import ServiceCard from "@/components/ServiceCard";
import { ResenasList } from "@/components/ResenasList";
import { StarsRow } from "@/components/Stars";
import { Carnet } from "@/components/ds/Credencial";
import { formatCalificacion } from "@/components/publico/presentacion";
import { CLASES_GRILLA } from "@/components/publico/EsqueletoServicio";

// Perfil público del estudiante: quién es, su credencial, lo que ofrece y lo que dicen
// de su trabajo. En público solo se muestran las carreras que LEX verificó: los estados
// "en revisión" o "rechazada" existen solo en el panel del propio estudiante.

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PortafolioPage({ params }: Props) {
  const { id } = await params;
  const estudianteId = Number.parseInt(id, 10);

  if (Number.isNaN(estudianteId)) notFound();

  let portafolio;
  try {
    portafolio = await obtenerPortafolio(estudianteId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const nombre = portafolio.nombreCompleto.trim().split(/\s+/)[0];
  const verificadas = portafolio.carreras.filter((c) => c.estadoVerificacion === "Verificado");
  const n = portafolio.resenas.length;

  return (
    <div className="mx-auto max-w-lex px-4 pt-5 md:px-6 lg:px-8 lg:pt-10">
      <section aria-labelledby="t-perfil" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-12">
        <div className="grid content-start gap-3">
          <h1 id="t-perfil" className="text-title-1-mobile text-balance lg:text-title-1">
            {portafolio.nombreCompleto}
          </h1>
          {n > 0 && portafolio.calificacionPromedio > 0 && (
            <p className="flex flex-wrap items-center gap-2 text-[15px] text-ink-2">
              <StarsRow value={Math.round(portafolio.calificacionPromedio)} />
              <span className="font-semibold text-ink">{formatCalificacion(portafolio.calificacionPromedio)}</span>
              <span>
                en {n} {n === 1 ? "reseña" : "reseñas"}
              </span>
            </p>
          )}
          {portafolio.bio && (
            <p className="max-w-[62ch] text-[17px] leading-[1.5] whitespace-pre-line text-ink-2 lg:text-lead">{portafolio.bio}</p>
          )}
          {portafolio.trabajosCompletados > 0 && (
            <p className="text-[15px] text-ink-2">
              Completó {portafolio.trabajosCompletados} {portafolio.trabajosCompletados === 1 ? "trabajo" : "trabajos"} en LEX.
            </p>
          )}
        </div>

        <div className="grid gap-3">
          {verificadas.length > 0 ? (
            verificadas.map((c) => (
              <Carnet
                key={c.carreraId}
                rol="Estudiante"
                nombre={portafolio.nombreCompleto}
                carrera={c.carrera}
                anio={portafolio.anioCursado}
                institucion={c.institucion}
              />
            ))
          ) : (
            <p className="rounded-card bg-surface-2 px-5 py-4 text-[15px] text-ink-2">
              {nombre} no tiene una carrera verificada en este momento.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="t-servicios" className="mt-12">
        <h2 id="t-servicios" className="mb-4 text-title-2-mobile lg:text-title-2">
          Servicios de {nombre}
        </h2>
        {portafolio.servicios.length === 0 ? (
          <p className="rounded-card bg-surface-2 px-4 py-4 text-[15px] text-ink-2">
            {nombre} todavía no publicó servicios.
          </p>
        ) : (
          <ul className={CLASES_GRILLA}>
            {portafolio.servicios.map((s) => (
              <li key={s.id} className="grid">
                <ServiceCard servicio={s} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="t-resenas" className="mt-12">
        <h2 id="t-resenas" className="mb-4 text-title-2-mobile lg:text-title-2">
          Reseñas
        </h2>
        <div className="max-w-3xl">
          <ResenasList
            resenas={portafolio.resenas}
            emptyText={`Todavía no tiene reseñas. Aparecen cuando quien contrató a ${nombre} termina el trabajo y lo califica.`}
          />
        </div>
      </section>
    </div>
  );
}
