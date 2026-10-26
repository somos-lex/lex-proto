import { Suspense } from "react";
import Link from "next/link";
import { listarServicios, type TipoServicio } from "@/lib/servicios";
import ServiceCard from "@/components/ServiceCard";
import Paginacion from "@/components/Paginacion";
import HeroPublico from "@/components/HeroPublico";
import FiltrosVertical, { urlCatalogo } from "@/components/FiltrosVertical";
import { Aviso } from "@/components/ds/Aviso";
import { Vacio } from "@/components/ds/Estados";
import { Sello } from "@/components/ds/Credencial";
import { clasesBoton } from "@/components/Boton";
import { CLASES_GRILLA, EsqueletoGrilla } from "@/components/publico/EsqueletoServicio";
import { VERTICALES } from "@/components/publico/presentacion";

interface Props {
  searchParams: Promise<{ tipo?: string; page?: string }>;
}

const POR_PAGINA = 12;

// Un `?tipo=` desconocido se ignora (se muestran todos), en vez de reenviarlo al
// backend, que rechazaria un valor de enum invalido con 400.
function parsearTipo(valor?: string): TipoServicio | undefined {
  return VERTICALES.find((v) => v.tipo === valor)?.tipo;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const tipo = parsearTipo(params.tipo);
  const pageParsed = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(pageParsed) && pageParsed > 0 ? pageParsed : 1;

  return (
    <>
      <HeroPublico />

      <section
        id="servicios"
        aria-labelledby="titulo-servicios"
        className="mx-auto mt-10 max-w-lex scroll-mt-20 px-4 md:px-6 lg:mt-16 lg:px-8"
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="titulo-servicios" className="text-title-2-mobile lg:text-title-2">
              Servicios publicados
            </h2>
            <p className="mt-1.5 flex items-start gap-2 text-[15px] leading-[1.45] text-ink-2">
              {/* Decorativo: el texto de al lado ya lo dice. */}
              <span aria-hidden="true" className="flex pt-px">
                <Sello />
              </span>
              Todos los estudiantes tienen la carrera verificada.
            </p>
          </div>
          <FiltrosVertical tipoActivo={tipo} />
        </div>

        <Suspense key={`${tipo ?? "todos"}-${page}`} fallback={<EsqueletoGrilla etiqueta="Cargando servicios" />}>
          <Catalogo tipo={tipo} page={page} />
        </Suspense>
      </section>
    </>
  );
}

async function Catalogo({ tipo, page }: { tipo?: TipoServicio; page: number }) {
  let resultado;
  try {
    resultado = await listarServicios({ tipo, activo: true, page, pageSize: POR_PAGINA });
  } catch {
    return (
      <Aviso
        tono="danger"
        titulo="No pudimos cargar los servicios."
        acciones={
          <Link href={urlCatalogo(tipo, page)} className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
            Reintentar
          </Link>
        }
      >
        Puede ser un problema de conexión. Probá de nuevo en un momento.
      </Aviso>
    );
  }

  if (resultado.items.length === 0) {
    const nombre = VERTICALES.find((v) => v.tipo === tipo)?.nombre;
    if (resultado.total > 0)
      return (
        <Vacio
          icono="compass"
          titulo="Esta página ya no tiene servicios"
          acciones={
            <Link href={urlCatalogo(tipo)} className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
              Ir a la primera página
            </Link>
          }
        >
          El catálogo cambió desde que abriste este link.
        </Vacio>
      );
    return (
      <Vacio
        icono="compass"
        titulo={nombre ? `Todavía no hay servicios de ${nombre}` : "Todavía no hay servicios publicados"}
        acciones={
          <>
            {nombre && (
              <Link href={urlCatalogo()} className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
                Ver todos los servicios
              </Link>
            )}
            <Link href="/practicas" className={clasesBoton({ variante: "tonal", tamano: "sm" })}>
              Atenderme sin costo
            </Link>
          </>
        }
      >
        Cuando un estudiante con la carrera verificada publique uno, lo vas a ver acá con su precio y quién lo atiende.
      </Vacio>
    );
  }

  return (
    <>
      <ul className={CLASES_GRILLA}>
        {resultado.items.map((servicio) => (
          <li key={servicio.id} className="grid">
            <ServiceCard servicio={servicio} />
          </li>
        ))}
      </ul>
      <Paginacion page={resultado.page} totalPages={resultado.totalPages} tipoActivo={tipo} />
    </>
  );
}
