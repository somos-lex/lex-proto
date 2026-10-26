"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  obtenerServicio,
  esClase,
  formatPrecio,
  type ServicioDetalleResponse,
  type DetalleClase,
} from "@/lib/servicios";
import { contratarClase } from "@/lib/trabajos";
import { ApiError } from "@/lib/api";
import { RequireRole } from "@/components/RequireRole";
import { SelectorSlots } from "@/components/SelectorSlots";
import { Field, Textarea } from "@/components/ui";
import { Boton, clasesBoton } from "@/components/Boton";
import { Aviso } from "@/components/ds/Aviso";
import {
  CabeceraFlujo,
  EsqueletoFlujo,
  LayoutFlujo,
  Paso,
  ResumenContratar,
  faltante,
} from "@/components/publico/FlujoContratar";

type ServicioClase = ServicioDetalleResponse & { detalle: DetalleClase };

export default function ContratarClasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireRole roles={["Cliente"]} vista="Cliente">
      <ContratarClase servicioId={Number(id)} />
    </RequireRole>
  );
}

function ContratarClase({ servicioId }: { servicioId: number }) {
  const router = useRouter();
  const [servicio, setServicio] = useState<ServicioClase | null>(null);
  const [cargaError, setCargaError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [slotsElegidos, setSlotsElegidos] = useState<string[]>([]);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    obtenerServicio(servicioId)
      .then((s) => {
        if (cancelado) return;
        if (!esClase(s)) setCargaError("Este servicio no es una clase.");
        else setServicio(s);
      })
      .catch((err) => {
        if (!cancelado) setCargaError(err instanceof ApiError ? err.message : "No pudimos cargar el servicio.");
      });
    return () => {
      cancelado = true;
    };
  }, [servicioId, intento]);

  if (cargaError)
    return (
      <div className="mx-auto max-w-lex px-4 py-10 md:px-6 lg:px-8">
        <Aviso
          tono="danger"
          titulo="No pudimos abrir la contratación."
          acciones={
            <>
              <Boton
                variante="secundario"
                tamano="sm"
                onClick={() => {
                  setCargaError(null);
                  setIntento((n) => n + 1);
                }}
              >
                Reintentar
              </Boton>
              <Link href="/" className={clasesBoton({ variante: "fantasma", tamano: "sm" })}>
                Ir al catálogo
              </Link>
            </>
          }
        >
          {cargaError}
        </Aviso>
      </div>
    );

  if (!servicio) return <EsqueletoFlujo />;

  const d = servicio.detalle;
  const cantidad = d.esPaquete ? (d.cantidadSesionesPaquete ?? 1) : 1;
  const faltan = cantidad - slotsElegidos.length;
  const falta = faltante(
    faltan > 0 ? [cantidad === 1 ? "elegir el horario" : `elegir ${faltan} horario${faltan === 1 ? "" : "s"} más`] : [],
  );
  const nombre = servicio.estudianteNombre.trim().split(/\s+/)[0];

  async function confirmar() {
    if (falta || !servicio || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const trabajo = await contratarClase({
        servicioId: servicio.id,
        slotsElegidos,
        notasCliente: notas.trim() || undefined,
      });
      router.push(`/panel/trabajos/${trabajo.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos confirmar la contratación. Probá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <LayoutFlujo
      cabecera={<CabeceraFlujo servicio={servicio} />}
      resumen={
        <ResumenContratar servicio={servicio}>
          <Boton
            tamano="lg"
            bloque
            onClick={confirmar}
            aria-disabled={!!falta || undefined}
            aria-describedby="estado-confirmar"
            aria-busy={enviando || undefined}
          >
            {enviando && (
              <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
            )}
            {enviando ? "Confirmando…" : "Confirmar y pagar"}
          </Boton>
          <p id="estado-confirmar" className="mt-2.5 text-[15px] text-ink-2">
            {falta ?? `Pagás ${formatPrecio(servicio.precio)}. LEX lo guarda y se lo pasa a ${nombre} con cada clase realizada.`}
          </p>
          {error && (
            <Aviso tono="danger" className="mt-3">
              {error}
            </Aviso>
          )}
        </ResumenContratar>
      }
    >
      <Paso
        n={1}
        titulo={cantidad === 1 ? "Elegí el horario" : `Elegí los ${cantidad} horarios del paquete`}
        ayuda={`Cada clase dura ${d.duracionMinutosSesion} min. Los horarios están en hora de Argentina.`}
      >
        <SelectorSlots
          estudianteId={servicio.estudianteId}
          duracionMinutos={d.duracionMinutosSesion}
          cantidadRequerida={cantidad}
          slotsElegidos={slotsElegidos}
          onCambiarSeleccion={setSlotsElegidos}
        />
      </Paso>

      <Paso n={2} titulo="Contale qué necesitás">
        <Field label="Notas para el estudiante (opcional)" htmlFor="notas" ayuda="Por ejemplo, qué tema querés reforzar o para cuándo es el examen.">
          <Textarea
            id="notas"
            rows={3}
            maxLength={500}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            aria-describedby="notas-ayuda"
          />
        </Field>
      </Paso>
    </LayoutFlujo>
  );
}
