"use client";

// Qué tipo de servicio publicar. Proyecto cerrado y Salud se habilitan solo si
// el catálogo cerrado tiene alguna entrada de esa vertical para las carreras
// verificadas del estudiante (dado su año). Clase es de texto libre: alcanza
// con una carrera verificada. Lo que no se puede elegir dice por qué.

import { listarServiciosPermitidos } from "@/lib/catalogo";
import type { CarreraPortafolio } from "@/lib/portafolio";
import type { TipoServicio } from "@/lib/servicios";
import { Icono, type NombreIcono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Cargando, Esqueleto } from "@/components/ds/Estados";
import { Tesela } from "@/components/ds/Lista";
import { HojaFormulario } from "@/components/panel/HojaFormulario";
import { ErrorDeCarga } from "@/components/panel/Reintentar";
import { useCarga } from "@/components/panel/useCarga";

const OPCIONES: { vertical: TipoServicio; titulo: string; descripcion: string; icono: NombreIcono }[] = [
  { vertical: "ProyectoCerrado", titulo: "Proyecto cerrado", descripcion: "Un trabajo definido, con plazo de entrega.", icono: "briefcase" },
  { vertical: "Clase", titulo: "Clases", descripcion: "Sesiones con turno, de la materia que elijas.", icono: "cap" },
  { vertical: "Salud", titulo: "Salud", descripcion: "Prácticas supervisadas por un profesional matriculado.", icono: "steth" },
];

export function SelectorVertical({
  carreras,
  anioCursado,
  onCerrar,
  onSeleccionar,
}: {
  carreras: CarreraPortafolio[];
  anioCursado: number;
  onCerrar: () => void;
  onSeleccionar: (vertical: TipoServicio) => void;
}) {
  const tieneCarrera = carreras.length > 0 && anioCursado > 0;
  // La unión de las verticales del catálogo entre todas las carreras verificadas.
  const permitidas = useCarga(
    tieneCarrera ? `permitidas-${carreras.map((c) => c.carreraId).join(",")}-${anioCursado}` : null,
    async () => {
      const listas = await Promise.all(carreras.map((c) => listarServiciosPermitidos(c.carreraId, anioCursado)));
      return new Set(listas.flat().map((e) => e.tipoServicio));
    },
  );

  return (
    <HojaFormulario
      titulo="¿Qué querés publicar?"
      descripcion="Proyecto cerrado y Salud dependen del catálogo de tu carrera y tu año."
      onCerrar={onCerrar}
    >
      {!tieneCarrera ? (
        <Aviso tono="warn" titulo="Todavía no podés publicar:">
          hace falta una carrera verificada por LEX. Mirá cómo va en Perfil y verificación.
        </Aviso>
      ) : permitidas.cargando ? (
        <Cargando etiqueta="Revisando qué podés publicar">
          <div className="grid gap-2">
            {OPCIONES.map((o) => (
              <Esqueleto key={o.vertical} className="h-[76px] rounded-card" />
            ))}
          </div>
        </Cargando>
      ) : permitidas.error ? (
        <ErrorDeCarga que="No pudimos revisar el catálogo de tu carrera." motivo={permitidas.error} onReintentar={permitidas.reintentar} />
      ) : (
        <ul className="grid gap-2">
          {OPCIONES.map((o) => {
            const habilitada = o.vertical === "Clase" || !!permitidas.datos?.has(o.vertical);
            return (
              <li key={o.vertical}>
                <button
                  type="button"
                  disabled={!habilitada}
                  onClick={() => onSeleccionar(o.vertical)}
                  className="flex min-h-[76px] w-full items-center gap-3.5 rounded-card bg-surface px-4 py-3 text-left shadow-[inset_0_0_0_1px_var(--color-line-strong)] hover:bg-surface-2 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:shadow-none"
                >
                  <Tesela icono={o.icono} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-base leading-[1.35] font-semibold ${habilitada ? "text-ink" : "text-ink-2"}`}>{o.titulo}</span>
                    <span className="block text-[15px] leading-[1.4] text-ink-2">
                      {habilitada ? o.descripcion : "Tu carrera no tiene servicios de esta vertical en el catálogo, o no para tu año."}
                    </span>
                  </span>
                  {habilitada && <Icono nombre="chev-r" className="size-5 text-ink-3" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </HojaFormulario>
  );
}
