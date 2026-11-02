"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatFechaAR, formatFechaHoraAR, obtenerConstancia, type Constancia } from "@/lib/practicas";
import { ApiError } from "@/lib/api";
import { Hoja } from "@/components/ds/Hoja";
import { Aviso } from "@/components/ds/Aviso";
import { Esqueleto } from "@/components/ds/Estados";
import { Definiciones } from "@/components/publico/Datos";

// Constancia completa, para las partes de la práctica (estudiante y cliente inscripto).
// La cátedra no necesita esto: verifica con el código en /constancias/{codigo}, que no
// muestra ningún dato del paciente. Se monta cuando hace falta y abre como Hoja: foco
// atrapado, Escape y el foco vuelve a quien la abrió.
export function ConstanciaModal({ practicaId, onCerrar }: { practicaId: number; onCerrar: () => void }) {
  const [constancia, setConstancia] = useState<Constancia | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    obtenerConstancia(practicaId)
      .then((c) => {
        if (!cancelado) setConstancia(c);
      })
      .catch((err) => {
        if (!cancelado) setError(err instanceof ApiError ? err.message : "No pudimos cargar la constancia.");
      });
    return () => {
      cancelado = true;
    };
  }, [practicaId]);

  return (
    <Hoja abierto onCerrar={onCerrar} titulo="Constancia del turno">
      <div className="grid w-full max-w-xl gap-4">
        {error && <Aviso tono="danger" titulo="No pudimos cargar la constancia.">{error}</Aviso>}

        {!constancia && !error && (
          <div aria-busy="true" aria-label="Cargando la constancia" className="grid gap-3">
            <Esqueleto className="h-20 w-full rounded-card" />
            <Esqueleto className="h-40 w-full rounded-card" />
          </div>
        )}

        {constancia && (
          <>
            <div className="rounded-card bg-surface-2 px-4 py-3.5">
              <p className="text-[15px] text-ink-2">Código de verificación</p>
              <p className="mt-0.5 text-[24px] leading-[1.2] font-bold tracking-[0.04em] break-all text-ink">
                {constancia.codigo}
              </p>
            </div>

            <Aviso tono={constancia.asistenciaRegistrada ? "ok" : "neutro"}>
              {constancia.asistenciaRegistrada
                ? "El paciente asistió al turno."
                : "El paciente no se presentó al turno."}
            </Aviso>

            <Definiciones
              filas={[
                { rotulo: "Estudiante", valor: constancia.nombreEstudiante },
                { rotulo: "Materia", valor: constancia.nombreMateria },
                { rotulo: "Carrera", valor: constancia.nombreCarrera },
                { rotulo: "Institución", valor: constancia.nombreInstitucion },
                { rotulo: "Fecha del turno", valor: <span className="first-letter:uppercase">{formatFechaHoraAR(constancia.fechaPractica)}</span> },
                { rotulo: "Emitida", valor: formatFechaAR(constancia.fechaEmision) },
                {
                  rotulo: "Paciente",
                  valor: `${constancia.nombrePaciente} (${constancia.tipoPaciente === "Animal" ? "mascota" : "persona"})`,
                },
                ...(constancia.observaciones
                  ? [{ rotulo: "Observaciones", valor: <span className="whitespace-pre-line">{constancia.observaciones}</span> }]
                  : []),
              ]}
            />

            <p className="text-[15px] text-ink-2">
              La cátedra la puede verificar con el código en{" "}
              <Link href={`/constancias/${encodeURIComponent(constancia.codigo)}`} className="font-semibold">
                Verificar una constancia
              </Link>
              . Esa verificación no muestra datos del paciente.
            </p>
          </>
        )}
      </div>
    </Hoja>
  );
}
