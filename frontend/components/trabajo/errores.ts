import { ApiError } from "@/lib/api";

/** Texto para el cuerpo de un aviso de error. El mensaje del backend sirve
 *  cuando dice qué pasó (400, 403, 404); un "Error 500" o una caída de red no,
 *  y ahí va la indicación de qué hacer. */
export function mensajeDeError(err: unknown, siNo = "Revisá tu conexión y probá de nuevo."): string {
  if (err instanceof ApiError && err.status < 500 && !/^Error \d+$/.test(err.message)) return err.message;
  return siNo;
}
