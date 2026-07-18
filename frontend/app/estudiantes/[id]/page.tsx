import { notFound } from "next/navigation";
import { obtenerPortafolio } from "@/lib/portafolio";
import { ApiError } from "@/lib/api";
import ServiceCard from "@/components/ServiceCard";
import { ResenasList } from "@/components/ResenasList";
import { StarsRow } from "@/components/Stars";

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

  const inicial = portafolio.nombreCompleto.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Hero */}
      <section className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:flex-row sm:text-left">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-4xl font-extrabold text-white shadow-inner">
          {inicial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {portafolio.nombreCompleto}
          </h1>
          {portafolio.anioCursado != null && (
            <p className="mt-1 text-sm font-medium text-indigo-700">
              {portafolio.anioCursado}° año
            </p>
          )}
          {portafolio.bio && (
            <p className="mt-3 max-w-2xl whitespace-pre-line text-sm text-slate-600">
              {portafolio.bio}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2 sm:justify-start">
            {portafolio.calificacionPromedio > 0 ? (
              <>
                <StarsRow value={Math.round(portafolio.calificacionPromedio)} />
                <span className="text-lg font-bold text-slate-900">
                  {portafolio.calificacionPromedio.toFixed(1)}
                </span>
                <span className="text-sm text-slate-400">
                  ({portafolio.resenas.length} reseña
                  {portafolio.resenas.length !== 1 ? "s" : ""})
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-400">
                Todavía sin calificación
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Sello de verificación institucional */}
      {portafolio.carreras.length > 0 && (
        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          {portafolio.carreras.map((c) => {
            const verificado = c.estadoVerificacion === "Verificado";
            return (
              <div
                key={c.carreraId}
                className={`flex items-start gap-3 rounded-xl border p-4 ${
                  verificado
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-amber-200 bg-amber-50/60"
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    verificado
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-500 text-white"
                  }`}
                  aria-hidden="true"
                >
                  {verificado ? "✓" : "!"}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{c.carrera}</p>
                  <p className="text-sm text-slate-600">{c.institucion}</p>
                  <span
                    className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      verificado
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {verificado ? "Verificado" : "Pendiente de verificación"}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Stats */}
      <section className="mt-6 grid grid-cols-3 gap-3">
        <StatCard
          valor={portafolio.trabajosCompletados}
          label="Trabajos completados"
        />
        <StatCard
          valor={
            portafolio.calificacionPromedio > 0
              ? portafolio.calificacionPromedio.toFixed(1)
              : "—"
          }
          label="Calificación"
        />
        <StatCard valor={portafolio.resenas.length} label="Reseñas" />
      </section>

      {/* Servicios */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-slate-900">
          Servicios{" "}
          <span className="font-normal text-slate-400">
            ({portafolio.servicios.length})
          </span>
        </h2>
        {portafolio.servicios.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500">
            Este estudiante todavía no publicó servicios.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {portafolio.servicios.map((s) => (
              <ServiceCard key={s.id} servicio={s} />
            ))}
          </div>
        )}
      </section>

      {/* Reseñas */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-slate-900">
          Reseñas{" "}
          <span className="font-normal text-slate-400">
            ({portafolio.resenas.length})
          </span>
        </h2>
        <div className="mt-4">
          <ResenasList
            resenas={portafolio.resenas}
            emptyText="Todavía no tiene reseñas. ¡Podés ser su primer cliente!"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ valor, label }: { valor: number | string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{valor}</p>
      <p className="mt-1 text-xs sm:text-sm text-slate-500">{label}</p>
    </div>
  );
}
