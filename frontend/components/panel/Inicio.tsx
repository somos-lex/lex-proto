"use client";

// Inicio del panel: qué te toca hacer ahora, cómo está tu verificación y un
// resumen de lo tuyo. Cada bloque carga por su cuenta, con su vacío y su error.
// Nada se acepta ni se publica desde acá: los botones llevan a cada pantalla.

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { cargarPendientes, usePendientes } from "@/lib/pendientes";
import { iniciales } from "@/lib/navegacion";
import { obtenerPortafolio, type CarreraPortafolio, type Portafolio } from "@/lib/portafolio";
import { listarMiDisponibilidad } from "@/lib/disponibilidad";
import { listarMisPracticas } from "@/lib/practicas";
import type { TrabajoResponse } from "@/lib/trabajos";
import { Boton, clasesBoton } from "@/components/Boton";
import { Aviso } from "@/components/ds/Aviso";
import { ChipEstadoTrabajo } from "@/components/ds/Chip";
import { Sello, carreraYAnio } from "@/components/ds/Credencial";
import { Cargando, Esqueleto, Vacio } from "@/components/ds/Estados";
import { Fila, Grupo } from "@/components/ds/Lista";
import { PortadaMini } from "@/components/ds/Portada";
import { Precio } from "@/components/ds/Precio";
import { Riel } from "@/components/ds/Riel";
import { ActivarEstudianteModal } from "@/components/ActivarEstudianteModal";
import { ErrorDeCarga } from "@/components/panel/Reintentar";
import { PieVerificacion, TarjetaVerificacion } from "@/components/panel/Verificacion";
import { pasosDeTrabajo } from "@/components/panel/rieles";
import { resumenAgenda, resumenServicios, resumenTurnos } from "@/components/panel/resumenes";
import { useCarga, type Carga } from "@/components/panel/useCarga";

const fechaLarga = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const H2 = "text-title-2-mobile md:text-title-2";

export function Inicio() {
  const { user, identidad, roles } = useAuth();
  const uid = user?.usuarioId ?? null;
  const esEstudiante = !!identidad?.esEstudiante || roles.includes("Estudiante");
  const esCliente = roles.includes("Cliente");
  const puedeActivar = !!identidad?.puedeActivarEstudiante && !esEstudiante;
  const [activando, setActivando] = useState(false);

  const portafolio = useCarga(esEstudiante && uid !== null ? `portafolio-${uid}` : null, () => obtenerPortafolio(uid!));
  // La lista compartida de trabajos (lib/pendientes): esta carga dice cuándo ya llegó.
  const trabajos = useCarga(uid !== null && (esEstudiante || esCliente) ? `trabajos-${uid}` : null, (intento) =>
    cargarPendientes(uid!, intento > 0),
  );

  const columnaIzquierda = esEstudiante ? (
    <TuVerificacion nombre={user?.nombreCompleto ?? ""} portafolio={portafolio} />
  ) : puedeActivar ? (
    <OfrecerServicios onActivar={() => setActivando(true)} />
  ) : null;

  return (
    <div className="@container mx-auto w-full max-w-[1040px] px-4 pt-6 pb-12 md:px-6 lg:px-8 lg:pt-9">
      <Saludo nombre={user?.nombreCompleto} uid={uid} esEstudiante={esEstudiante} portafolio={portafolio} />

      {(esEstudiante || esCliente) && uid !== null && <ProximoPaso uid={uid} carga={trabajos} esEstudiante={esEstudiante} />}

      <div className={`mt-10 grid gap-10 ${columnaIzquierda ? "@3xl:grid-cols-2 @3xl:gap-8" : ""}`}>
        {columnaIzquierda}
        <LoTuyo
          uid={uid}
          roles={roles}
          esEstudiante={esEstudiante}
          esCliente={esCliente}
          portafolio={portafolio}
          trabajosListos={!trabajos.cargando}
        />
      </div>

      {activando && <ActivarEstudianteModal onClose={() => setActivando(false)} />}
    </div>
  );
}

// --- Saludo -------------------------------------------------------------------

function Saludo({
  nombre,
  uid,
  esEstudiante,
  portafolio,
}: {
  nombre: string | undefined;
  uid: number | null;
  esEstudiante: boolean;
  portafolio: Carga<Portafolio>;
}) {
  const primerNombre = nombre?.trim().split(/\s+/)[0];
  const carrera = portafolio.datos?.carreras[0];
  return (
    <section aria-labelledby="t-hola" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 items-center gap-4">
        <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-surface-2 text-[19px] font-[650]">
          {iniciales(nombre)}
        </span>
        <div className="min-w-0">
          <h1 id="t-hola" className="text-title-1-mobile text-balance md:text-title-1">
            {primerNombre ? `Hola, ${primerNombre}` : "Hola"}
          </h1>
          {esEstudiante &&
            (portafolio.cargando ? (
              <Esqueleto className="mt-2 h-4 w-72 max-w-full" />
            ) : carrera ? (
              <CredencialLinea carrera={carrera} anio={portafolio.datos?.anioCursado ?? null} />
            ) : null)}
        </div>
      </div>
      {esEstudiante && uid !== null && (
        // El hidden va en un contenedor: en el mismo elemento competiría con el inline-flex del botón.
        <span className="hidden md:block">
          <Link href={`/estudiantes/${uid}`} className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
            Ver mi perfil público
          </Link>
        </span>
      )}
    </section>
  );
}

function CredencialLinea({ carrera, anio }: { carrera: CarreraPortafolio; anio: number | null }) {
  const verificada = carrera.estadoVerificacion === "Verificado";
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <p className="flex items-start gap-1.5 text-[15px] leading-[1.4] font-medium text-ink-2">
        {verificada && (
          <span className="mt-px">
            <Sello />
          </span>
        )}
        <span>
          {carreraYAnio(carrera.carrera, anio)}, {carrera.institucion}
        </span>
      </p>
      {!verificada && <PieVerificacion estado={carrera.estadoVerificacion} />}
    </div>
  );
}

// --- Próximo paso -------------------------------------------------------------

const PRIORIDAD: Record<string, number> = { Pendiente: 0, Entregado: 1, Aceptado: 2 };
const MAX_PASOS = 5;

function ProximoPaso({ uid, carga, esEstudiante }: { uid: number; carga: Carga<void>; esEstudiante: boolean }) {
  const p = usePendientes();
  const cargando = carga.cargando || p.cargando;
  const lista = [...p.pendientes].sort(
    (a, b) => PRIORIDAD[a.estado] - PRIORIDAD[b.estado] || a.fechaCreacion.localeCompare(b.fechaCreacion),
  );
  const pendientesDeAceptar = lista.filter((t) => t.estado === "Pendiente" && t.estudianteId === uid);

  let resumen: string | null = null;
  if (!cargando && !p.error && lista.length > 0) {
    resumen =
      pendientesDeAceptar.length === lista.length
        ? lista.length === 1
          ? "1 contratación espera tu respuesta"
          : `${lista.length} contrataciones esperan tu respuesta`
        : lista.length === 1
          ? "Tenés 1 trabajo para revisar"
          : `Tenés ${lista.length} trabajos para revisar`;
  }

  return (
    <section aria-labelledby="t-prox" className="mt-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="t-prox" className={H2}>
          Próximo paso
        </h2>
        {resumen && <p className="text-[15px] text-ink-2">{resumen}</p>}
      </div>

      {cargando ? (
        <Cargando etiqueta="Cargando tus trabajos">
          <EsqueletoPaso />
        </Cargando>
      ) : p.error ? (
        <ErrorDeCarga
          que="No pudimos cargar tus trabajos."
          motivo="Revisá tu conexión y probá de nuevo."
          onReintentar={carga.reintentar}
        />
      ) : lista.length === 0 ? (
        <Vacio
          icono="check-circle"
          titulo="No tenés nada pendiente"
          acciones={
            esEstudiante ? (
              <Link href="/panel/trabajos?como=estudiante" className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
                Ver trabajos recibidos
              </Link>
            ) : (
              <Link href="/" className={clasesBoton({ variante: "secundario", tamano: "sm" })}>
                Explorar servicios
              </Link>
            )
          }
        >
          {esEstudiante
            ? "Cuando alguien te contrate, vas a ver acá el trabajo y qué te toca hacer."
            : "Cuando un estudiante te entregue un trabajo, vas a ver acá qué te toca confirmar."}
        </Vacio>
      ) : (
        <>
          <ul className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
            {lista.slice(0, MAX_PASOS).map((t) => (
              <PasoTrabajo key={t.id} t={t} uid={uid} />
            ))}
          </ul>
          {lista.length > MAX_PASOS && (
            <Link href="/panel/trabajos" className={clasesBoton({ variante: "fantasma", tamano: "sm", className: "mt-2" })}>
              Ver los {lista.length} trabajos
            </Link>
          )}
          {pendientesDeAceptar.length > 0 && (
            <Aviso tono="neutro" className="mt-3">
              {consejoAntesDeAceptar(pendientesDeAceptar)}
            </Aviso>
          )}
        </>
      )}
    </section>
  );
}

function consejoAntesDeAceptar(ts: TrabajoResponse[]) {
  const tipos = new Set(ts.map((t) => t.tipo));
  if (tipos.size > 1) return "Antes de aceptar, abrí cada trabajo y revisá el detalle de lo que te pidieron.";
  if (tipos.has("Salud")) return "Antes de aceptar, abrí cada trabajo y revisá el paciente y el horario.";
  if (tipos.has("Clase")) return "Antes de aceptar, abrí cada trabajo y revisá los horarios que eligió quien te contrató.";
  return "Antes de aceptar, abrí cada trabajo y revisá el pedido y el plazo de entrega.";
}

const ACCION: Record<string, string> = {
  Pendiente: "Revisar y responder",
  Aceptado: "Revisar y empezar",
  Entregado: "Revisar la entrega",
};

function PasoTrabajo({ t, uid }: { t: TrabajoResponse; uid: number }) {
  const fecha = fechaLarga.format(new Date(t.fechaCreacion));
  const detalle =
    t.estudianteId === uid
      ? `Te contrató ${t.clienteNombre} el ${fecha}.`
      : `Lo hace ${t.estudianteNombre}. Lo contrataste el ${fecha}.`;
  const idTitulo = `paso-${t.id}`;
  return (
    <li className="relative before:absolute before:top-0 before:right-0 before:left-4 before:h-px before:bg-line first:before:hidden md:before:left-5">
      <article aria-labelledby={idTitulo} className="grid gap-4 px-4 py-5 md:px-5">
        <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-3.5 gap-y-2 sm:grid-cols-[44px_minmax(0,1fr)_auto]">
          <PortadaMini tipo={t.tipo} tema={t.tituloSnapshot} tamano={44} />
          <div className="min-w-0">
            <h3 id={idTitulo} className="text-title-3 [overflow-wrap:anywhere]">
              {t.tituloSnapshot}
            </h3>
            <p className="text-[15px] leading-[1.45] text-ink-2">
              {detalle} Trabajo N.º {t.id}.
            </p>
          </div>
          <Precio monto={t.precioAcordado} unidad="en total" className="col-start-2 sm:col-start-3 sm:row-start-1 sm:justify-end" />
        </div>
        <Riel etiqueta={`Estado del trabajo N.º ${t.id}`} pasos={pasosDeTrabajo(t.tipo, t.estado)} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="self-start sm:self-auto">
            <ChipEstadoTrabajo estado={t.estado} teToca />
          </span>
          <Link href={`/panel/trabajos/${t.id}`} className={clasesBoton({ tamano: "sm", className: "max-sm:w-full" })}>
            {ACCION[t.estado]}
            <span className="sr-only">: trabajo N.º {t.id}</span>
          </Link>
        </div>
      </article>
    </li>
  );
}

function EsqueletoPaso() {
  return (
    <div className="grid gap-5 rounded-card bg-surface px-4 py-5 shadow-[0_0_0_1px_var(--color-line)] md:px-5 dark:shadow-none">
      <div className="flex gap-3.5">
        <Esqueleto className="size-11 shrink-0 rounded-control" />
        <div className="grid flex-1 content-start gap-2.5 pt-1">
          <Esqueleto className="h-4 w-3/5" />
          <Esqueleto className="h-3.5 w-4/5" />
        </div>
      </div>
      <Esqueleto className="h-4 w-full" />
      <div className="flex flex-wrap justify-between gap-3">
        <Esqueleto className="h-7 w-40 rounded-pill" />
        <Esqueleto className="h-11 w-44 rounded-control max-sm:w-full" />
      </div>
    </div>
  );
}

// --- Tu verificación ----------------------------------------------------------

function TuVerificacion({ nombre, portafolio }: { nombre: string; portafolio: Carga<Portafolio> }) {
  const carreras = portafolio.datos?.carreras ?? [];
  return (
    <section aria-labelledby="t-ver">
      <h2 id="t-ver" className={`mb-3 ${H2}`}>
        Tu verificación
      </h2>
      {portafolio.cargando ? (
        <Cargando etiqueta="Cargando tu verificación">
          <Esqueleto className="h-[196px] rounded-card" />
          <Esqueleto className="mt-3 h-[132px] rounded-card" />
        </Cargando>
      ) : portafolio.error ? (
        <ErrorDeCarga que="No pudimos cargar tu verificación." motivo={portafolio.error} onReintentar={portafolio.reintentar} />
      ) : carreras.length === 0 ? (
        <Vacio icono="id" titulo="Todavía no tenés una carrera cargada">
          Sin una carrera verificada por LEX no podés publicar servicios ni turnos.
        </Vacio>
      ) : (
        <>
          <TarjetaVerificacion nombre={nombre} carrera={carreras[0]} anio={portafolio.datos?.anioCursado ?? null} />
          {carreras.length > 1 && (
            <Link href="/panel/perfil" className={clasesBoton({ variante: "fantasma", tamano: "sm", className: "mt-2" })}>
              Ver tus {carreras.length} carreras
            </Link>
          )}
        </>
      )}
    </section>
  );
}

function OfrecerServicios({ onActivar }: { onActivar: () => void }) {
  return (
    <section aria-labelledby="t-ofrecer">
      <h2 id="t-ofrecer" className={`mb-3 ${H2}`}>
        Como estudiante
      </h2>
      <Vacio
        icono="cap"
        titulo="Ofrecé tus servicios en LEX"
        acciones={
          <Boton variante="secundario" tamano="sm" onClick={onActivar}>
            Activar mi perfil de estudiante
          </Boton>
        }
      >
        Si estudiás una carrera universitaria, podés publicar servicios con tu credencial. Antes de que publiques, un admin de LEX
        revisa tu constancia de alumno regular.
      </Vacio>
    </section>
  );
}

// --- Lo tuyo en LEX -----------------------------------------------------------

const ACTIVOS_CLIENTE = new Set(["Pendiente", "Aceptado", "EnCurso", "Entregado", "Disputa"]);

function LoTuyo({
  uid,
  roles,
  esEstudiante,
  esCliente,
  portafolio,
  trabajosListos,
}: {
  uid: number | null;
  roles: string[];
  esEstudiante: boolean;
  esCliente: boolean;
  portafolio: Carga<Portafolio>;
  trabajosListos: boolean;
}) {
  const p = usePendientes();
  const agenda = useCarga(esEstudiante && uid !== null ? `agenda-${uid}` : null, () => listarMiDisponibilidad());
  const turnos = useCarga(esEstudiante && uid !== null ? `turnos-${uid}` : null, () => listarMisPracticas());

  const cargandoLinea = <Esqueleto className="mt-1.5 h-3.5 w-48 max-w-full" />;
  const publicar = <span className="font-semibold text-link">Publicar</span>;

  const servicios = portafolio.datos?.servicios ?? [];
  const conTurnos = servicios.filter((s) => s.tipo === "Clase" || s.tipo === "Salud");
  const sinHorarios = !!agenda.datos && agenda.datos.length === 0 && conTurnos.length > 0;

  const contratados = uid === null ? [] : p.trabajos.filter((t) => t.clienteId === uid);
  const activos = contratados.filter((t) => ACTIVOS_CLIENTE.has(t.estado)).length;
  const fallaron = [agenda.error && "tu agenda", turnos.error && "tus turnos del Banco"].filter(Boolean) as string[];

  return (
    <section aria-labelledby="t-tuyo">
      <h2 id="t-tuyo" className={`mb-3 ${H2}`}>
        Lo tuyo en LEX
      </h2>
      <Grupo>
        {esEstudiante && (
          <>
            <Fila
              href="/panel/servicios"
              icono="briefcase"
              titulo="Mis servicios"
              descripcion={
                portafolio.cargando ? cargandoLinea : portafolio.datos ? (resumenServicios(servicios) ?? "Todavía no publicaste servicios") : "Lo que ofrecés en LEX"
              }
              fin={portafolio.datos && servicios.length === 0 ? publicar : undefined}
            />
            <Fila
              href="/panel/disponibilidad"
              icono="calendar"
              titulo="Agenda y disponibilidad"
              descripcion={
                agenda.cargando ? cargandoLinea : agenda.datos ? (resumenAgenda(agenda.datos) ?? "Todavía no cargaste horarios") : "Cuándo atendés"
              }
            />
            <Fila
              href="/panel/practicas"
              icono="calendar-plus"
              tonoTesela="acento"
              titulo="Turnos que publico"
              descripcion={
                turnos.cargando
                  ? cargandoLinea
                  : turnos.datos
                    ? (resumenTurnos(turnos.datos) ?? "Todavía no publicaste turnos en el Banco")
                    : "Tus turnos sin costo en el Banco"
              }
              fin={turnos.datos && turnos.datos.length === 0 ? publicar : undefined}
            />
          </>
        )}
        {esCliente && (
          <Fila
            href="/panel/trabajos?como=cliente"
            icono="receipt"
            titulo="Contrataciones"
            descripcion={
              !trabajosListos
                ? cargandoLinea
                : p.error
                  ? "Lo que contratás como cliente"
                  : contratados.length === 0
                    ? "Todavía no contrataste servicios"
                    : activos > 0
                      ? `${activos} ${activos === 1 ? "activa" : "activas"}, ${contratados.length} en total`
                      : "Lo que contratás como cliente"
            }
          />
        )}
        {esCliente && !esEstudiante && (
          <>
            <Fila href="/panel/inscripciones" icono="calendar" titulo="Mis turnos del Banco" descripcion="Tus inscripciones a turnos sin costo" />
            <Fila href="/panel/pacientes" icono="users" titulo="Personas y mascotas" descripcion="Quiénes se atienden cuando contratás" />
          </>
        )}
        {roles.includes("Agencia") && (
          <Fila href="/panel/agencia" icono="briefcase" titulo="Panel de agencia" descripcion="Lo de tu agencia en LEX" />
        )}
        {roles.includes("Admin") && (
          <>
            <Fila href="/panel/admin" icono="receipt" titulo="Ingresos" descripcion="La comisión de LEX por vertical" />
            <Fila href="/panel/admin/verificaciones" icono="id" titulo="Verificaciones" descripcion="Carreras que esperan revisión" />
          </>
        )}
      </Grupo>

      {sinHorarios && (
        <Aviso
          tono="warn"
          className="mt-3"
          titulo={conTurnos.length === servicios.length ? "Nadie puede contratarte todavía:" : "Tus clases y servicios de salud no se pueden contratar todavía:"}
          acciones={<Link href="/panel/disponibilidad">Cargar disponibilidad</Link>}
        >
          no cargaste horarios.
        </Aviso>
      )}

      {fallaron.length > 0 && (
        <ErrorDeCarga
          className="mt-3"
          que={`No pudimos cargar ${fallaron.join(" ni ")}.`}
          motivo={agenda.error ?? turnos.error}
          onReintentar={() => {
            if (agenda.error) agenda.reintentar();
            if (turnos.error) turnos.reintentar();
          }}
        />
      )}
    </section>
  );
}
