"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type RegisterPayload } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { ErrorAlert, Field, Input, SubmitButton } from "@/components/ui";
import { Icono } from "@/components/Icono";
import { Aviso } from "@/components/ds/Aviso";
import { conVolver } from "@/components/publico/Acceso";

// Dos flujos de registro: Cliente (con sub-tipo Particular/Empresa) y Agencia.
type Flujo = "Cliente" | "Agencia";
type TipoCliente = "Particular" | "Empresa";

export function FormularioRegistro({ volver, comoEstudiante }: { volver: string | null; comoEstudiante: boolean }) {
  const { register } = useAuth();
  const router = useRouter();

  const [flujo, setFlujo] = useState<Flujo>("Cliente");
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("Particular");

  // Campos comunes.
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");

  // Campos opcionales por tipo.
  const [dni, setDni] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [cuit, setCuit] = useState("");
  const [nombreAgencia, setNombreAgencia] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function construirPayload(): RegisterPayload {
    const base = {
      email,
      password,
      nombreCompleto,
      telefono: telefono.trim() || undefined,
    };

    if (flujo === "Agencia") {
      return { ...base, tipoRegistro: "Agencia", nombreAgencia: nombreAgencia.trim() || undefined };
    }
    if (tipoCliente === "Empresa") {
      return { ...base, tipoRegistro: "ClienteEmpresa", razonSocial: razonSocial.trim() || undefined, cuit: cuit.trim() || undefined };
    }
    return { ...base, tipoRegistro: "ClienteParticular", dni: dni.trim() || undefined };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(construirPayload());
      router.push(volver ?? "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos conectarnos con LEX. Revisá tu conexión y probá de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-title-1-mobile lg:text-title-1">Creá tu cuenta</h1>
      <p className="mt-2 text-[17px] text-ink-2">
        ¿Ya tenés una?{" "}
        <Link href={conVolver("/login", volver)} className="font-semibold">
          Ingresá
        </Link>
      </p>

      {comoEstudiante && (
        <Aviso tono="info" titulo="¿Sos estudiante?" className="mt-5">
          Creá tu cuenta como particular. Después, desde el menú, elegí &quot;Ofrecé tus servicios&quot; y cargá tu carrera:
          un admin de LEX revisa tu constancia de alumno regular antes de que puedas publicar.
        </Aviso>
      )}

      {/* Cliente (principal) o agencia: un segmentado, el estado actual no es violeta. */}
      <div role="group" aria-label="Tipo de cuenta" className="mt-6 flex w-full gap-0.5 rounded-pill bg-surface-2 p-[3px]">
        <Segmento activo={flujo === "Cliente"} onClick={() => setFlujo("Cliente")}>
          Soy cliente
        </Segmento>
        <Segmento activo={flujo === "Agencia"} onClick={() => setFlujo("Agencia")}>
          Soy una agencia
        </Segmento>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
        {error && <ErrorAlert message={error} />}

        {flujo === "Cliente" && (
          <fieldset>
            <legend className="mb-1.5 text-[15px] font-semibold">¿Cómo te registrás?</legend>
            <div className="grid grid-cols-2 gap-2.5">
              <Opcion nombre="tipoCliente" valor="Particular" actual={tipoCliente} onElegir={setTipoCliente} titulo="Particular" detalle="Una persona" icono="user" />
              <Opcion nombre="tipoCliente" valor="Empresa" actual={tipoCliente} onElegir={setTipoCliente} titulo="Empresa" detalle="Una organización" icono="briefcase" />
            </div>
          </fieldset>
        )}

        <Field label="Nombre completo" htmlFor="nombreCompleto">
          <Input id="nombreCompleto" type="text" autoComplete="name" required value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
        </Field>

        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
        </Field>

        <Field label="Contraseña" htmlFor="password" ayuda="Mínimo 6 caracteres.">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-ayuda"
          />
        </Field>

        <Field label="Teléfono (opcional)" htmlFor="telefono">
          <Input id="telefono" type="tel" autoComplete="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+54 9 379 ..." />
        </Field>

        {flujo === "Agencia" ? (
          <Field label="Nombre de la agencia (opcional)" htmlFor="nombreAgencia">
            <Input id="nombreAgencia" type="text" value={nombreAgencia} onChange={(e) => setNombreAgencia(e.target.value)} />
          </Field>
        ) : tipoCliente === "Particular" ? (
          <Field label="DNI (opcional)" htmlFor="dni">
            <Input id="dni" type="text" inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="30123456" />
          </Field>
        ) : (
          <>
            <Field label="Razón social (opcional)" htmlFor="razonSocial">
              <Input id="razonSocial" type="text" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
            </Field>
            <Field label="CUIT (opcional)" htmlFor="cuit">
              <Input id="cuit" type="text" inputMode="numeric" value={cuit} onChange={(e) => setCuit(e.target.value)} placeholder="30-12345678-9" />
            </Field>
          </>
        )}

        <SubmitButton loading={submitting}>{flujo === "Agencia" ? "Crear cuenta de agencia" : "Crear cuenta"}</SubmitButton>
      </form>
    </>
  );
}

function Segmento({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`flex min-h-11 flex-1 items-center justify-center rounded-pill px-4 text-[15px] focus-visible:-outline-offset-2 ${
        activo ? "bg-surface font-[620] text-ink shadow-thumb dark:bg-surface-3" : "font-[550] text-ink-2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Opcion<T extends string>({
  nombre,
  valor,
  actual,
  onElegir,
  titulo,
  detalle,
  icono,
}: {
  nombre: string;
  valor: T;
  actual: T;
  onElegir: (v: T) => void;
  titulo: string;
  detalle: string;
  icono: "user" | "briefcase";
}) {
  const elegida = actual === valor;
  return (
    <label
      className={`relative flex min-h-16 cursor-pointer items-center gap-3 rounded-control bg-surface px-3.5 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
        elegida ? "shadow-[inset_0_0_0_2px_var(--color-ink)]" : "shadow-[inset_0_0_0_1px_var(--color-line-strong)] hover:bg-surface-2"
      }`}
    >
      <input type="radio" name={nombre} value={valor} checked={elegida} onChange={() => onElegir(valor)} className="sr-only" />
      <Icono nombre={icono} className="size-5.5 text-ink-2" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{titulo}</span>
        <span className="block text-[14px] text-ink-2">{detalle}</span>
      </span>
      {elegida && <Icono nombre="check" className="size-5 text-ink" />}
    </label>
  );
}
