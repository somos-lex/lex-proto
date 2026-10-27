import type { ReactNode } from "react";
import type { PacienteResponse } from "@/lib/pacientes";
import { Icono } from "@/components/Icono";
import { Chip } from "@/components/ds/Chip";
import { Tesela } from "@/components/ds/Lista";

function fechaCorta(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function PacienteCard({ paciente }: { paciente: PacienteResponse }) {
  const esAnimal = paciente.tipo === "Animal";
  const nacimiento = fechaCorta(paciente.fechaNacimiento);

  return (
    <article className="flex flex-col justify-between rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Tesela icono={esAnimal ? "paw" : "user"} tono="acento" />
            <div>
              <h3 className="text-base font-semibold text-ink leading-tight">
                {paciente.nombreCompleto}
              </h3>
              <p className="mt-0.5 text-[14px] text-ink-2">
                {esAnimal ? (paciente.especie ? paciente.especie : "Mascota") : "Persona"}
              </p>
            </div>
          </div>
          {paciente.tipo === "Humano" && paciente.esTitular && (
            <Chip tono="neutro" icono="check">
              Titular
            </Chip>
          )}
        </div>

        <dl className="mt-4 space-y-2 text-[14px]">
          {esAnimal ? (
            <>
              {paciente.especie && paciente.raza && (
                <Dato label="Especie" valor={paciente.especie} />
              )}
              <Dato label="Raza" valor={paciente.raza || "Mestizo / No especificada"} />
            </>
          ) : (
            <>
              <Dato label="DNI" valor={paciente.dni} />
              <Dato
                label="Contacto de emergencia"
                valor={
                  paciente.contactoEmergenciaNombre
                    ? `${paciente.contactoEmergenciaNombre}${
                        paciente.contactoEmergenciaTelefono
                          ? ` · ${paciente.contactoEmergenciaTelefono}`
                          : ""
                      }`
                    : null
                }
              />
            </>
          )}
          <Dato label="Nacimiento" valor={nacimiento} />
        </dl>
      </div>

      {paciente.notasRelevantes && (
        <div className="mt-4 rounded-control bg-surface-2 p-3 text-[13px] leading-relaxed text-ink-2">
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-ink">
            <Icono nombre="info" className="size-3.5 text-ink-3" />
            <span>Notas relevantes</span>
          </p>
          <p className="line-clamp-3">{paciente.notasRelevantes}</p>
        </div>
      )}
    </article>
  );
}

function Dato({ label, valor }: { label: string; valor: ReactNode }) {
  if (!valor) return null;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-2">{label}</dt>
      <dd className="text-right font-medium text-ink">{valor}</dd>
    </div>
  );
}
