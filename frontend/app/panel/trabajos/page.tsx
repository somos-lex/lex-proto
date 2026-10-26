"use client";

// Trabajos: la página que comparten estudiantes y clientes (D2, sin selector de
// vistas). Los trabajos donde la persona es la estudiante van en "Trabajos
// recibidos"; donde es la cliente, en "Contrataciones".
//
//   /panel/trabajos                  las dos secciones (las que tenga la cuenta)
//   /panel/trabajos?como=estudiante  solo "Trabajos recibidos"
//   /panel/trabajos?como=cliente     solo "Contrataciones"
//   &estado=<EstadoTrabajo>          filtro por estado

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { listarMisTrabajos, type EstadoTrabajo, type TrabajoResponse } from "@/lib/trabajos";
import type { RolEnTrabajo } from "@/lib/transicionesTrabajo";
import { useAuth } from "@/contexts/AuthContext";
import { RequireRole } from "@/components/RequireRole";
import { TrabajoCard } from "@/components/TrabajoCard";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Contador } from "@/components/ds/Chip";
import { Cargando, Esqueleto, Vacio } from "@/components/ds/Estados";
import { EncabezadoPagina, Pagina, TituloSeccion } from "@/components/trabajo/Pagina";
import { FiltroEstado, type OpcionFiltro } from "@/components/trabajo/FiltroEstado";
import { mensajeDeError } from "@/components/trabajo/errores";
import {
  ETIQUETA_ESTADO,
  ORDEN_ESTADOS,
  TITULO_GRUPO,
  esEstadoTrabajo,
  grupoDe,
  rolEn,
  type GrupoTrabajo,
} from "@/components/trabajo/estado";

type Como = "estudiante" | "cliente";

const SECCION: Record<Como, { rol: RolEnTrabajo; titulo: string }> = {
  estudiante: { rol: "Estudiante", titulo: "Trabajos recibidos" },
  cliente: { rol: "Cliente", titulo: "Contrataciones" },
};

const FILTRO: Record<EstadoTrabajo, string> = {
  Pendiente: "Pendientes",
  Aceptado: "Aceptados",
  EnCurso: "En curso",
  Entregado: "Entregados",
  Completado: "Completados",
  Cancelado: "Cancelados",
  Disputa: "En disputa",
};

const GRUPOS: GrupoTrabajo[] = ["teToca", "enMarcha", "terminados"];

export default function TrabajosPage() {
  return (
    <RequireRole roles={["Cliente", "Estudiante"]}>
      <Suspense fallback={<EsqueletoPagina />}>
        <Trabajos />
      </Suspense>
    </RequireRole>
  );
}

function Trabajos() {
  const { user, roles } = useAuth();
  const params = useSearchParams();
  const pedido = params.get("como");
  const estadoParam = params.get("estado");
  const filtro: EstadoTrabajo | "todos" = esEstadoTrabajo(estadoParam) ? estadoParam : "todos";

  const [trabajos, setTrabajos] = useState<TrabajoResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    listarMisTrabajos()
      .then((data) => {
        if (cancelado) return;
        setTrabajos(data);
        setError(null);
      })
      .catch((err) => {
        if (!cancelado) setError(mensajeDeError(err));
      });
    return () => {
      cancelado = true;
    };
  }, [intento]);

  const reintentar = useCallback(() => {
    setError(null);
    setTrabajos(null);
    setIntento((i) => i + 1);
  }, []);

  // Qué secciones tiene la cuenta: por rol, o por tener trabajos de ese lado.
  const disponibles = useMemo<Como[]>(() => {
    const lista = trabajos ?? [];
    const comoEstudiante = roles.includes("Estudiante") || lista.some((t) => t.estudianteId === user?.usuarioId);
    const comoCliente = roles.includes("Cliente") || lista.some((t) => t.clienteId === user?.usuarioId);
    return [...(comoEstudiante ? ["estudiante" as const] : []), ...(comoCliente ? ["cliente" as const] : [])];
  }, [roles, trabajos, user?.usuarioId]);

  const secciones: Como[] =
    pedido === "estudiante" || pedido === "cliente"
      ? disponibles.includes(pedido)
        ? [pedido]
        : disponibles
      : disponibles;
  const unaSola = secciones.length === 1;

  const porSeccion = useMemo(() => {
    const r: Record<Como, TrabajoResponse[]> = { estudiante: [], cliente: [] };
    for (const t of trabajos ?? []) {
      const rol = rolEn(t, user?.usuarioId);
      if (rol === "Estudiante") r.estudiante.push(t);
      else if (rol === "Cliente") r.cliente.push(t);
    }
    return r;
  }, [trabajos, user?.usuarioId]);

  const visibles = secciones.flatMap((s) => porSeccion[s]);
  const opciones: OpcionFiltro[] = [
    { valor: "todos", etiqueta: "Todos", n: visibles.length },
    ...ORDEN_ESTADOS.map((e) => ({ valor: e, etiqueta: FILTRO[e], n: visibles.filter((t) => t.estado === e).length })).filter(
      (o) => o.n > 0 || o.valor === filtro,
    ),
  ];

  const hrefDe = (valor: string) => {
    const q = new URLSearchParams();
    if (pedido === "estudiante" || pedido === "cliente") q.set("como", pedido);
    if (valor !== "todos") q.set("estado", valor);
    const s = q.toString();
    return s ? `/panel/trabajos?${s}` : "/panel/trabajos";
  };

  const titulo = unaSola ? SECCION[secciones[0]].titulo : "Trabajos";
  const bajada = unaSola
    ? secciones[0] === "estudiante"
      ? "Lo que te contrataron, con el paso en el que está cada uno y lo que tenés que hacer."
      : "Lo que contrataste, con el paso en el que está cada uno y lo que pasa con tu pago protegido."
    : "Lo que te contrataron y lo que contrataste, con el paso en el que está cada uno.";

  return (
    <Pagina>
      <EncabezadoPagina titulo={titulo} bajada={bajada} />

      {error ? (
        <Aviso
          tono="danger"
          titulo="No pudimos cargar tus trabajos."
          className="mt-6"
          acciones={
            <Boton variante="secundario" tamano="sm" onClick={reintentar}>
              <Icono nombre="refresh" />
              Reintentar
            </Boton>
          }
        >
          {error}
        </Aviso>
      ) : trabajos === null ? (
        <EsqueletoLista conFiltro />
      ) : (
        <>
          {visibles.length > 0 && (
            <div className="mt-6">
              <FiltroEstado opciones={opciones} actual={filtro} hrefDe={hrefDe} />
            </div>
          )}
          <div className="mt-8 grid gap-10">
            {secciones.map((s) => (
              <Seccion
                key={s}
                como={s}
                trabajos={porSeccion[s]}
                filtro={filtro}
                unaSola={unaSola}
                paginaVacia={visibles.length === 0}
                hrefTodos={hrefDe("todos")}
              />
            ))}
          </div>
        </>
      )}
    </Pagina>
  );
}

function Seccion({
  como,
  trabajos,
  filtro,
  unaSola,
  paginaVacia,
  hrefTodos,
}: {
  como: Como;
  trabajos: TrabajoResponse[];
  filtro: EstadoTrabajo | "todos";
  unaSola: boolean;
  paginaVacia: boolean;
  hrefTodos: string;
}) {
  const { rol, titulo } = SECCION[como];
  const idTitulo = `seccion-${como}`;
  const filtrados = filtro === "todos" ? trabajos : trabajos.filter((t) => t.estado === filtro);

  // Te toca primero; después lo que está en marcha; al final lo terminado.
  // Dentro de cada grupo, lo más nuevo arriba.
  const grupos = GRUPOS.map((g) => ({
    grupo: g,
    items: filtrados
      .filter((t) => grupoDe(t, rol) === g)
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)),
  })).filter((g) => g.items.length > 0);

  // Con una sola sección el h1 ya la nombra: los grupos bajan un nivel.
  const TituloGrupo = unaSola ? "h2" : "h3";

  let cuerpo;
  if (trabajos.length === 0) {
    cuerpo =
      como === "estudiante" ? (
        <Vacio
          icono="inbox"
          titulo="Todavía no te contrataron"
          acciones={
            <Link href="/panel/servicios" className={clasesBoton({ variante: paginaVacia ? "primario" : "secundario", tamano: "sm" })}>
              Ver mis servicios
            </Link>
          }
        >
          Cuando alguien contrate uno de tus servicios, aparece acá con el paso en el que está y lo que te toca hacer.
        </Vacio>
      ) : (
        <Vacio
          icono="receipt"
          titulo="Todavía no contrataste nada"
          acciones={
            <Link href="/" className={clasesBoton({ variante: paginaVacia ? "primario" : "secundario", tamano: "sm" })}>
              Explorar servicios
            </Link>
          }
        >
          Cuando contrates un servicio, lo seguís desde acá: en qué paso está, las sesiones y tu pago protegido.
        </Vacio>
      );
  } else if (filtrados.length === 0) {
    cuerpo = (
      <Vacio
        icono="filter"
        titulo={`${como === "estudiante" ? "Ningún trabajo recibido" : "Ninguna contratación"} está en estado ${filtro === "Disputa" ? "Disputa" : ETIQUETA_ESTADO[filtro as EstadoTrabajo]}`}
        acciones={
          <Link href={hrefTodos} replace scroll={false} className={clasesBoton({ variante: "tonal", tamano: "sm" })}>
            Ver todos los estados
          </Link>
        }
      />
    );
  } else {
    cuerpo = (
      <div className="grid gap-6">
        {grupos.map(({ grupo, items }) => (
          <section key={grupo} aria-labelledby={`${idTitulo}-${grupo}`}>
            <TituloGrupo id={`${idTitulo}-${grupo}`} className="mx-1 mb-2 flex items-center gap-2 text-[15px] font-semibold text-ink-2">
              {TITULO_GRUPO[grupo]}
              {grupo === "teToca" && (
                <Contador n={items.length} etiqueta={`${items.length} ${items.length === 1 ? "trabajo" : "trabajos"}`} />
              )}
            </TituloGrupo>
            <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
              {items.map((t) => (
                <TrabajoCard key={t.id} trabajo={t} rol={rol} titulo={unaSola ? "h3" : "h4"} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  if (unaSola) return <section aria-label={titulo}>{cuerpo}</section>;
  return (
    <section aria-labelledby={idTitulo}>
      <TituloSeccion id={idTitulo}>{titulo}</TituloSeccion>
      {cuerpo}
    </section>
  );
}

function EsqueletoLista({ conFiltro = false }: { conFiltro?: boolean }) {
  return (
    <Cargando etiqueta="Cargando tus trabajos">
      {conFiltro && <Esqueleto className="mt-6 h-[50px] w-72 max-w-full rounded-pill" />}
      <div className="mt-8">
        <Esqueleto className="mx-1 mb-3 h-4 w-24" />
        <div className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`grid gap-3.5 px-4 py-4 sm:px-5 ${i > 0 ? "border-t border-line" : ""}`}>
              <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-3">
                <Esqueleto className="size-11 rounded-button" />
                <div className="grid content-start gap-2 pt-1">
                  <Esqueleto className="h-4 w-3/5" />
                  <Esqueleto className="h-3 w-4/5" />
                </div>
              </div>
              <Esqueleto className="h-[42px] w-full" />
              <Esqueleto className="h-7 w-40 rounded-pill" />
            </div>
          ))}
        </div>
      </div>
    </Cargando>
  );
}

function EsqueletoPagina() {
  return (
    <Pagina>
      <Esqueleto className="h-9 w-56" />
      <Esqueleto className="mt-3 h-5 w-96 max-w-full" />
      <EsqueletoLista conFiltro />
    </Pagina>
  );
}
