import Link from "next/link";
import type { ServicioResponse } from "@/lib/servicios";
import { Portada, PortadaMini } from "@/components/ds/Portada";
import { CredencialCompacta, SupervisorCompacto } from "@/components/ds/Credencial";
import { Precio } from "@/components/ds/Precio";
import { Icono } from "@/components/Icono";
import { RatingBadge } from "@/components/Stars";
import { credencialCompacta, metaDe, temaDe, unidadDe } from "@/components/publico/presentacion";

// Tarjeta de un servicio del catálogo (componente "TarjetaServicio" del sistema).
// Mobile: una fila con la portada mini de 88 px. Desde 720 px: tarjeta con la
// portada 16:10. Toda la tarjeta es el link (el ::after del título la cubre) y el
// foco se dibuja en la tarjeta entera. La vertical vive solo en la portada y el
// verde solo en el sello. Sin "Sin reseñas": la estrella aparece con la primera.
export default function ServiceCard({
  servicio,
  titulo: Titulo = "h3",
}: {
  servicio: ServicioResponse;
  /** Nivel del título según la página que la contiene. */
  titulo?: "h2" | "h3";
}) {
  const tema = temaDe(servicio);
  const meta = metaDe(servicio);
  return (
    <article className="relative grid grid-cols-[88px_minmax(0,1fr)] items-start gap-3.5 rounded-card bg-surface p-3 shadow-[0_0_0_1px_var(--color-line)] hover:bg-[color-mix(in_oklab,var(--color-surface)_70%,var(--color-surface-2))] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus min-[720px]:flex min-[720px]:flex-col min-[720px]:gap-3 min-[720px]:px-2 min-[720px]:pt-2 min-[720px]:pb-4 dark:shadow-none">
      <div className="min-[720px]:hidden">
        <PortadaMini tipo={servicio.tipo} tema={tema} />
      </div>
      <Portada tipo={servicio.tipo} tema={tema} className="hidden min-[720px]:block" />

      <div className="flex min-w-0 flex-col gap-2 min-[720px]:flex-1 min-[720px]:px-2 min-[720px]:pt-1">
        <Titulo className="line-clamp-2 text-base leading-[1.3] font-[620] tracking-[-0.005em]">
          <Link
            href={`/servicios/${servicio.id}`}
            className="text-ink no-underline after:absolute after:inset-0 after:rounded-card focus-visible:outline-none"
          >
            {servicio.titulo}
          </Link>
        </Titulo>

        {servicio.credencial ? (
          <CredencialCompacta nombre={servicio.estudianteNombre} detalle={credencialCompacta(servicio.credencial)} />
        ) : (
          <p className="text-[15px] leading-[1.35] font-semibold text-ink">{servicio.estudianteNombre}</p>
        )}
        {servicio.supervisor && (
          <SupervisorCompacto nombre={servicio.supervisor.nombre} matricula={servicio.supervisor.matricula} />
        )}
        {meta && (
          <p className="flex items-center gap-1.5 text-[14px] leading-[1.35] text-ink-2">
            <Icono nombre={meta.icono} className="size-4 text-ink-3" />
            {meta.texto}
          </p>
        )}

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
          <Precio monto={servicio.precio} unidad={unidadDe(servicio.tipo, servicio.condiciones)} />
          <RatingBadge value={servicio.estudianteCalificacion} />
        </div>
      </div>
    </article>
  );
}
