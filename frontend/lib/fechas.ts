// Fechas en hora argentina (UTC-3 fijo, igual que Common/HorarioArgentina.cs), sin
// depender del timezone del navegador.
//
// date-fns formatea en el timezone LOCAL de quien ejecuta. Restarle 3 horas a un Date y
// formatearlo da bien solo si el navegador está en UTC; en Argentina, donde el navegador ya
// está en UTC-3, resta el huso dos veces y la hora sale 3 horas antes. Por eso acá se
// corre el instante 3 horas y se arma un Date con esos componentes leídos en UTC: el
// resultado es el mismo en cualquier navegador.
import { format } from "date-fns";

const OFFSET_AR_MS = 3 * 60 * 60 * 1000;

/** Date con los componentes de reloj de pared de Argentina. Solo para mostrar, nunca como instante. */
export function relojAR(utcIso: string): Date {
  const s = new Date(new Date(utcIso).getTime() - OFFSET_AR_MS);
  return new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), s.getUTCHours(), s.getUTCMinutes());
}

/** "dd/MM/yyyy HH:mm" en hora argentina. */
export function formatFechaHoraCortaAR(utcIso: string): string {
  return format(relojAR(utcIso), "dd/MM/yyyy HH:mm");
}
