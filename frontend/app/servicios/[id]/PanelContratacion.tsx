"use client";

// Contratar desde la ficha (componentes "Hoja" y "Riel" del sistema):
// - Escritorio: el aside fijo con el precio, la acción y "Tu pago, protegido".
// - Mobile: la hoja asomada abajo (precio, "Pago protegido" y Contratar) que, al
//   tocarla, sube entera con el mismo contenido y la credencial.
// Sin selector de vistas (D2): contrata cualquiera con el rol Cliente, aunque también
// sea estudiante, salvo en su propio servicio.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { contratarProyectoCerrado } from "@/lib/trabajos";
import { ApiError } from "@/lib/api";
import { formatPrecio, type ServicioDetalleResponse } from "@/lib/servicios";
import { Boton, clasesBoton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Esqueleto } from "@/components/ds/Estados";
import { Hoja, HojaAsomada } from "@/components/ds/Hoja";
import { Precio } from "@/components/ds/Precio";
import { RielPagoProtegido } from "@/components/ds/Riel";
import { CredencialCompacta, SupervisorCompacto } from "@/components/ds/Credencial";
import { ListaDatos, type Dato } from "@/components/publico/Datos";
import { credencialCompacta, unidadDe } from "@/components/publico/presentacion";

interface Props {
  servicio: ServicioDetalleResponse;
  datos: Dato[];
  /** Nombre de pila del estudiante. */
  nombre: string;
  /** Clase o Salud sin horarios cargados: no se puede contratar todavía. */
  sinAgenda: boolean;
}

function unidad(s: ServicioDetalleResponse) {
  return unidadDe(s.tipo, s.tipo === "Clase" ? (s.detalle as { esPaquete?: boolean; cantidadSesionesPaquete?: number | null }) : null);
}

/** Aside de escritorio (desde 1024 px). */
export function AsideContratacion(props: Props) {
  return (
    <aside aria-label="Contratar" className="sticky top-23 hidden rounded-[24px] bg-surface p-6 shadow-float lg:block">
      <Contenido {...props} />
    </aside>
  );
}

/** Hoja asomada y hoja abierta (mobile). Va al final de la página para quedar fija abajo. */
export function HojaContratacion(props: Props) {
  const [abierta, setAbierta] = useState(false);
  const { servicio } = props;
  return (
    <>
      <HojaAsomada className="mt-8">
        <div className="min-w-0 flex-1">
          <Precio monto={servicio.precio} unidad={unidad(servicio)} />
          <p className="mt-1 flex items-center gap-1.5 text-[14px] text-ink-2">
            <Icono nombre="shield" className="size-4 text-ink-3" />
            Pago protegido
          </p>
        </div>
        <Boton onClick={() => setAbierta(true)} aria-haspopup="dialog" className="min-w-37">
          Contratar
        </Boton>
      </HojaAsomada>
      <Hoja
        abierto={abierta}
        onCerrar={() => setAbierta(false)}
        titulo={
          <>
            <span className="block text-[15px] font-normal text-ink-2">Contratar</span>
            <span className="block text-title-2-mobile">{servicio.titulo}</span>
          </>
        }
      >
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-3 rounded-card bg-surface px-4 py-3 shadow-[0_0_0_1px_var(--color-line)] dark:bg-surface-2 dark:shadow-none">
          {servicio.credencial ? (
            <CredencialCompacta nombre={servicio.estudianteNombre} detalle={credencialCompacta(servicio.credencial)} />
          ) : (
            <p className="text-[15px] font-semibold">{servicio.estudianteNombre}</p>
          )}
          {servicio.supervisor && (
            <SupervisorCompacto nombre={servicio.supervisor.nombre} matricula={servicio.supervisor.matricula} />
          )}
        </div>
        <Contenido {...props} enHoja />
      </Hoja>
    </>
  );
}

function Contenido({ servicio, datos, nombre, sinAgenda, enHoja = false }: Props & { enHoja?: boolean }) {
  return (
    <>
      <Precio monto={servicio.precio} unidad={unidad(servicio)} grande />
      <ListaDatos datos={datos} className="mt-3.5 mb-5" />
      <Accion servicio={servicio} nombre={nombre} sinAgenda={sinAgenda} enHoja={enHoja} />
      <h3 className="mt-6 mb-3.5 text-title-3">Tu pago, protegido</h3>
      <RielPagoProtegido
        quien={nombre}
        liberacion={servicio.tipo === "ProyectoCerrado" ? "entrega" : "sesiones"}
        conConsentimiento={servicio.tipo === "Salud"}
      />
    </>
  );
}

function Accion({
  servicio,
  nombre,
  sinAgenda,
  enHoja,
}: {
  servicio: ServicioDetalleResponse;
  nombre: string;
  sinAgenda: boolean;
  enHoja: boolean;
}) {
  const { user, hasRole, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const tamano = enHoja ? "lg" : "md";
  const ruta = `/servicios/${servicio.id}`;

  if (loading) return <Esqueleto className="h-13 w-full rounded-button" />;

  if (!user)
    return (
      <>
        <Link href={`/login?volver=${encodeURIComponent(ruta)}`} className={clasesBoton({ tamano, bloque: true })}>
          Ingresá para contratar
        </Link>
        <p className="mt-2.5 text-[15px] text-ink-2">
          ¿No tenés cuenta?{" "}
          <Link href={`/registro?volver=${encodeURIComponent(ruta)}`} className="font-semibold">
            Creala
          </Link>{" "}
          y volvés acá para contratar.
        </p>
      </>
    );

  if (user.usuarioId === servicio.estudianteId)
    return (
      <Aviso
        tono="neutro"
        titulo="Es tu servicio."
        acciones={
          <Link href="/panel/servicios" className="-my-2.5 inline-flex min-h-11 items-center">
            Ir a Mis servicios
          </Link>
        }
      >
        Así lo ve quien lo contrata.
      </Aviso>
    );

  if (!hasRole("Cliente"))
    return (
      <Aviso tono="neutro" titulo="Con esta cuenta no se puede contratar.">
        Para contratar hace falta una cuenta de cliente, particular o de empresa.
      </Aviso>
    );

  if (sinAgenda)
    return (
      <>
        <Boton aria-disabled="true" tamano={tamano} bloque aria-describedby="sin-agenda">
          Contratar
        </Boton>
        <p id="sin-agenda" className="mt-2.5 text-[15px] text-ink-2">
          {nombre} todavía no cargó sus horarios, así que por ahora no se puede contratar.
        </p>
      </>
    );

  if (servicio.tipo === "ProyectoCerrado") {
    async function contratar() {
      setEnviando(true);
      setError(null);
      try {
        const trabajo = await contratarProyectoCerrado({ servicioId: servicio.id });
        router.push(`/panel/trabajos/${trabajo.id}`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No pudimos contratar. Probá de nuevo en un momento.");
        setEnviando(false);
      }
    }
    return (
      <>
        <Boton tamano={tamano} bloque onClick={contratar} aria-busy={enviando || undefined} disabled={enviando}>
          {enviando && <span aria-hidden="true" className="size-[18px] animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />}
          {enviando ? "Contratando…" : "Contratar"}
        </Boton>
        <p className="mt-2.5 text-[15px] text-ink-2">
          Al contratar pagás {formatPrecio(servicio.precio)} y LEX lo guarda hasta que apruebes la entrega.
        </p>
        {error && <Aviso tono="danger" className="mt-3">{error}</Aviso>}
      </>
    );
  }

  const paquete = servicio.tipo === "Clase" ? (servicio.detalle as { esPaquete: boolean; cantidadSesionesPaquete: number | null }) : null;
  const flujo = servicio.tipo === "Clase" ? "contratar-clase" : "contratar-salud";
  return (
    <>
      <Link href={`${ruta}/${flujo}`} className={clasesBoton({ tamano, bloque: true })}>
        {paquete?.esPaquete ? "Elegir horarios y contratar" : "Elegir horario y contratar"}
      </Link>
      <p className="mt-2.5 text-[15px] text-ink-2">
        {servicio.tipo === "Salud"
          ? "Al contratar elegís el horario, cargás al paciente y firmás el consentimiento."
          : paquete?.esPaquete
            ? `Al contratar elegís los ${paquete.cantidadSesionesPaquete} horarios del paquete.`
            : "Al contratar elegís el horario de la clase."}
      </p>
    </>
  );
}
