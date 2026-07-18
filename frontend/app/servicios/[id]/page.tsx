import { notFound } from "next/navigation";
import { obtenerServicio } from "@/lib/servicios";
import { ApiError } from "@/lib/api";
import ServicioDetalle from "./ServicioDetalle";
import PanelContratacion from "./PanelContratacion";

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ServicioDetalle servicio={servicio} />
        </div>
        <div className="lg:col-span-1">
          <PanelContratacion servicio={servicio} />
        </div>
      </div>
    </div>
  );
}
