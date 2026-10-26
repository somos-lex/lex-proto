import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerServicio } from "@/lib/servicios";
import { listarDisponibilidadDeEstudiante } from "@/lib/disponibilidad";
import { ApiError } from "@/lib/api";
import { Icono } from "@/components/Icono";
import { urlCatalogo } from "@/components/FiltrosVertical";
import { textoAgenda } from "@/components/publico/agenda";
import { datosDe } from "@/components/publico/Datos";
import { VERTICALES } from "@/components/publico/presentacion";
import ServicioDetalle from "./ServicioDetalle";
import { AsideContratacion, HojaContratacion } from "./PanelContratacion";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ServicioPage({ params }: Props) {
  const { id } = await params;
  const servicioId = Number.parseInt(id, 10);

  if (Number.isNaN(servicioId)) notFound();

  let servicio;
  try {
    servicio = await obtenerServicio(servicioId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Clases y Salud se contratan sobre la agenda del estudiante. Si no cargó horarios,
  // se dice antes de entrar al flujo. Si la consulta falla, no se bloquea nada.
  let bloques = null;
  if (servicio.tipo !== "ProyectoCerrado") {
    try {
      bloques = await listarDisponibilidadDeEstudiante(servicio.estudianteId);
    } catch {
      bloques = null;
    }
  }
  const agenda = bloques ? textoAgenda(bloques) : null;
  const sinAgenda = !!bloques && bloques.length === 0;

  const nombre = servicio.estudianteNombre.trim().split(/\s+/)[0];
  const datos = datosDe(servicio, agenda, nombre);
  const vertical = VERTICALES.find((v) => v.tipo === servicio.tipo)!;
  const props = { servicio, datos, nombre, sinAgenda };

  return (
    <div>
      <div className="mx-auto max-w-lex px-4 md:px-6 lg:px-8">
        <nav aria-label="Estás en" className="mt-2 mb-2 flex items-center text-[15px] lg:mt-3 lg:mb-4">
          <ol className="flex min-w-0 items-center">
            <li className="hidden lg:flex lg:items-center">
              <Link href={urlCatalogo()} className="-ml-2 inline-flex min-h-11 items-center rounded-control px-2 text-ink-2 no-underline hover:text-ink">
                Servicios
              </Link>
              <Icono nombre="chev-r" className="size-4 text-ink-3" />
            </li>
            <li className="flex items-center">
              <Link
                href={urlCatalogo(servicio.tipo)}
                className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-ink-2 no-underline hover:text-ink lg:ml-0"
              >
                <Icono nombre="chev-r" className="size-4 rotate-180 lg:hidden" />
                {vertical.nombre}
              </Link>
              <Icono nombre="chev-r" className="hidden size-4 text-ink-3 lg:block" />
            </li>
            <li aria-current="page" className="hidden min-w-0 truncate px-2 text-ink lg:block">
              {servicio.titulo}
            </li>
          </ol>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_384px] lg:items-start lg:gap-12">
          <ServicioDetalle servicio={servicio} datos={datos} nombre={nombre} agenda={agenda} />
          <AsideContratacion {...props} />
        </div>
      </div>
      <HojaContratacion {...props} />
    </div>
  );
}
