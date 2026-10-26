"use client";

// Elegir horarios de la agenda del estudiante para contratar una Clase o un servicio de
// Salud. Mobile-first: la semana se navega con dos botones y los horarios van agrupados
// por día, como botones de 44 px que se marcan (aria-pressed) con tilde y acento. Así
// entra en 390 px sin la grilla de siete columnas.

import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { listarSlotsDisponibles, type SlotDisponibleResponse } from "@/lib/turnos";
import { ApiError } from "@/lib/api";
import { Boton } from "@/components/Boton";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { Esqueleto } from "@/components/ds/Estados";

// --- Zona horaria (AR, UTC-3 fijo, igual que el backend) ---
//
// Los slots vienen del backend como instantes UTC. Para MOSTRARLOS en hora argentina
// desplazamos -3h y reconstruimos una Date "local" con esas componentes de reloj de pared:
// esa Date solo se usa para formatear (nunca como instante), así el string es correcto sea
// cual sea el timezone del navegador. Para MANDAR de vuelta reusamos el ISO UTC original del
// backend, sin reconvertir: es exacto por construcción.
function arDisplayDate(utcIso: string): Date {
  const s = new Date(new Date(utcIso).getTime() - 3 * 3600_000);
  return new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), s.getUTCHours(), s.getUTCMinutes());
}

// Fecha AR de hoy (a medianoche local), para navegar semanas sin depender del timezone.
function hoyAr(): Date {
  const s = new Date(Date.now() - 3 * 3600_000);
  return new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
}

const SEMANAS_MAX = 4;

function mayuscula(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "Martes 27 de octubre". */
export function diaLargo(d: Date) {
  return mayuscula(format(d, "EEEE d 'de' MMMM", { locale: es }));
}

/** "Martes 27 de octubre, 9:00": un horario elegido, en hora argentina. */
export function etiquetaSlot(iso: string) {
  const d = arDisplayDate(iso);
  return `${diaLargo(d)}, ${format(d, "H:mm")}`;
}

function tituloSemana(inicio: Date) {
  const fin = addDays(inicio, 6);
  return inicio.getMonth() === fin.getMonth()
    ? `Semana del ${format(inicio, "d")} al ${format(fin, "d 'de' MMMM", { locale: es })}`
    : `Semana del ${format(inicio, "d 'de' MMMM", { locale: es })} al ${format(fin, "d 'de' MMMM", { locale: es })}`;
}

export function SelectorSlots({
  estudianteId,
  duracionMinutos,
  cantidadRequerida,
  slotsElegidos,
  onCambiarSeleccion,
}: {
  estudianteId: number;
  duracionMinutos: number;
  cantidadRequerida: number;
  slotsElegidos: string[];
  onCambiarSeleccion: (slots: string[]) => void;
}) {
  const inicioSemanaHoy = useMemo(() => startOfWeek(hoyAr(), { weekStartsOn: 1 }), []);
  const [semanaInicio, setSemanaInicio] = useState<Date>(inicioSemanaHoy);
  const [slots, setSlots] = useState<SlotDisponibleResponse[]>([]);
  const [estado, setEstado] = useState<{ semana: string; error: string | null } | null>(null);
  const [intento, setIntento] = useState(0);

  const claveSemana = format(semanaInicio, "yyyy-MM-dd");
  // Cargando mientras la respuesta en mano no es la de esta semana (o de este intento).
  const cargando = estado?.semana !== `${claveSemana}#${intento}`;
  const error = cargando ? null : estado?.error;

  useEffect(() => {
    let cancelado = false;
    const hasta = format(addDays(semanaInicio, 6), "yyyy-MM-dd");
    listarSlotsDisponibles({ estudianteId, desde: claveSemana, hasta, duracionMinutos })
      .then((data) => {
        if (cancelado) return;
        // Se descartan los que ya pasaron, por las dudas.
        const ahora = Date.now();
        setSlots(data.filter((x) => new Date(x.fechaHoraInicio).getTime() >= ahora));
        setEstado({ semana: `${claveSemana}#${intento}`, error: null });
      })
      .catch((err) => {
        if (cancelado) return;
        setSlots([]);
        setEstado({
          semana: `${claveSemana}#${intento}`,
          error: err instanceof ApiError ? err.message : "No pudimos cargar los horarios.",
        });
      });
    return () => {
      cancelado = true;
    };
  }, [estudianteId, duracionMinutos, semanaInicio, claveSemana, intento]);

  // Slots por día, en orden.
  const dias = useMemo(() => {
    const mapa = new Map<string, { dia: Date; horas: { iso: string; hora: string }[] }>();
    for (const s of [...slots].sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio))) {
      const d = arDisplayDate(s.fechaHoraInicio);
      const clave = format(d, "yyyy-MM-dd");
      const grupo = mapa.get(clave) ?? { dia: d, horas: [] };
      grupo.horas.push({ iso: s.fechaHoraInicio, hora: format(d, "H:mm") });
      mapa.set(clave, grupo);
    }
    return [...mapa.values()];
  }, [slots]);

  const elegidos = new Set(slotsElegidos);
  const completo = slotsElegidos.length >= cantidadRequerida;

  function alternar(iso: string) {
    if (elegidos.has(iso)) return onCambiarSeleccion(slotsElegidos.filter((s) => s !== iso));
    if (cantidadRequerida === 1) return onCambiarSeleccion([iso]); // reemplaza
    if (!completo) onCambiarSeleccion([...slotsElegidos, iso]);
  }

  const puedeAtras = semanaInicio.getTime() > inicioSemanaHoy.getTime();
  const puedeAdelante = semanaInicio.getTime() < addDays(inicioSemanaHoy, SEMANAS_MAX * 7).getTime();
  const resumen = [...slotsElegidos].sort();

  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <Boton
          variante="tonal"
          tamano="sm"
          aria-label="Semana anterior"
          disabled={!puedeAtras}
          onClick={() => setSemanaInicio(addDays(semanaInicio, -7))}
          className="w-11 px-0"
        >
          <Icono nombre="chev-r" className="size-5 rotate-180" />
        </Boton>
        <p className="min-w-0 flex-1 text-center text-[15px] leading-[1.35] font-semibold" aria-live="polite">
          {tituloSemana(semanaInicio)}
        </p>
        <Boton
          variante="tonal"
          tamano="sm"
          aria-label="Semana siguiente"
          disabled={!puedeAdelante}
          onClick={() => setSemanaInicio(addDays(semanaInicio, 7))}
          className="w-11 px-0"
        >
          <Icono nombre="chev-r" className="size-5" />
        </Boton>
      </div>

      <div className="px-4 py-4">
        {cargando ? (
          <div aria-busy="true" aria-label="Cargando horarios" className="grid gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="grid gap-2">
                <Esqueleto className="h-4 w-40" />
                <div className="flex gap-2">
                  <Esqueleto className="h-11 w-20 rounded-control" />
                  <Esqueleto className="h-11 w-20 rounded-control" />
                  <Esqueleto className="h-11 w-20 rounded-control" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Aviso
            tono="danger"
            titulo="No pudimos cargar los horarios."
            acciones={
              <Boton variante="secundario" tamano="sm" onClick={() => setIntento((n) => n + 1)}>
                Reintentar
              </Boton>
            }
          >
            {error}
          </Aviso>
        ) : dias.length === 0 ? (
          <div className="grid justify-items-start gap-2.5">
            <p className="text-[15px] text-ink-2">No quedan horarios libres esta semana.</p>
            {puedeAdelante && (
              <Boton variante="secundario" tamano="sm" onClick={() => setSemanaInicio(addDays(semanaInicio, 7))}>
                Ver la semana siguiente
              </Boton>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {dias.map((d) => (
              <section key={d.dia.toISOString()} aria-label={diaLargo(d.dia)}>
                <h3 className="mb-2 text-[15px] font-[650] text-ink-2">{diaLargo(d.dia)}</h3>
                <ul className="flex flex-wrap gap-2">
                  {d.horas.map((s) => {
                    const activo = elegidos.has(s.iso);
                    const bloqueado = !activo && completo && cantidadRequerida > 1;
                    return (
                      <li key={s.iso}>
                        <button
                          type="button"
                          aria-pressed={activo}
                          aria-disabled={bloqueado || undefined}
                          onClick={() => alternar(s.iso)}
                          className={`inline-flex min-h-11 min-w-21 items-center justify-center gap-1.5 rounded-control px-3.5 text-base font-semibold ${
                            activo
                              ? "bg-accent text-on-accent hover:bg-accent-hover"
                              : bloqueado
                                ? "cursor-not-allowed bg-surface-2 text-ink-3"
                                : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)] hover:bg-surface-2"
                          }`}
                        >
                          {activo && <Icono nombre="check" className="size-[18px]" />}
                          {s.hora}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-line px-4 py-3">
        <p className="text-[15px] font-semibold" aria-live="polite">
          {cantidadRequerida === 1
            ? slotsElegidos.length === 1
              ? "Elegiste este horario"
              : "Todavía no elegiste un horario"
            : `Elegiste ${slotsElegidos.length} de ${cantidadRequerida} horarios`}
        </p>
        {completo && cantidadRequerida > 1 && (
          <p className="text-[14px] text-ink-2">Para cambiar uno, quitalo y elegí otro.</p>
        )}
        {resumen.length > 0 && (
          <ul className="mt-1">
            {resumen.map((iso) => (
              <li key={iso} className="flex items-center justify-between gap-2 text-[15px]">
                <span>{etiquetaSlot(iso)}</span>
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  aria-label={`Quitar ${etiquetaSlot(iso)}`}
                  onClick={() => onCambiarSeleccion(slotsElegidos.filter((s) => s !== iso))}
                >
                  Quitar
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
