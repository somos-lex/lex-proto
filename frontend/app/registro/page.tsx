"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type RegisterPayload } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { ErrorAlert, Field, Input, SubmitButton } from "@/components/ui";

// Dos flujos de registro: Cliente (con sub-tipo Particular/Empresa) y Agencia.
type Flujo = "Cliente" | "Agencia";
type TipoCliente = "Particular" | "Empresa";

export default function RegistroPage() {
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
      return {
        ...base,
        tipoRegistro: "Agencia",
        nombreAgencia: nombreAgencia.trim() || undefined,
      };
    }

    if (tipoCliente === "Empresa") {
      return {
        ...base,
        tipoRegistro: "ClienteEmpresa",
        razonSocial: razonSocial.trim() || undefined,
        cuit: cuit.trim() || undefined,
      };
    }

    return {
      ...base,
      tipoRegistro: "ClienteParticular",
      dni: dni.trim() || undefined,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(construirPayload());
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No pudimos conectarnos. ¿Está corriendo el backend?",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-20">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Creá tu cuenta
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        ¿Ya tenés una?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Iniciá sesión
        </Link>
      </p>

      {/* Tabs de flujo: Cliente (principal) / Agencia (secundario) */}
      <div className="mt-8 flex gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
        <TabButton active={flujo === "Cliente"} onClick={() => setFlujo("Cliente")}>
          Soy cliente
        </TabButton>
        <TabButton active={flujo === "Agencia"} onClick={() => setFlujo("Agencia")}>
          Registrarme como agencia
        </TabButton>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {error && <ErrorAlert message={error} />}

        {/* Toggle Particular/Empresa (solo flujo Cliente) */}
        {flujo === "Cliente" && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              ¿Cómo te registrás?
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Toggle
                active={tipoCliente === "Particular"}
                onClick={() => setTipoCliente("Particular")}
                title="Particular"
                subtitle="Una persona"
              />
              <Toggle
                active={tipoCliente === "Empresa"}
                onClick={() => setTipoCliente("Empresa")}
                title="Empresa"
                subtitle="Una organización"
              />
            </div>
          </div>
        )}

        <Field label="Nombre completo" htmlFor="nombreCompleto">
          <Input
            id="nombreCompleto"
            type="text"
            autoComplete="name"
            required
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder="Juana Pérez"
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </Field>

        <Field label="Contraseña" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </Field>

        <Field label="Teléfono (opcional)" htmlFor="telefono">
          <Input
            id="telefono"
            type="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+54 9 11 ..."
          />
        </Field>

        {/* Campos específicos */}
        {flujo === "Agencia" ? (
          <Field label="Nombre de la agencia (opcional)" htmlFor="nombreAgencia">
            <Input
              id="nombreAgencia"
              type="text"
              value={nombreAgencia}
              onChange={(e) => setNombreAgencia(e.target.value)}
              placeholder="Estudio Creativo SRL"
            />
          </Field>
        ) : tipoCliente === "Particular" ? (
          <Field label="DNI (opcional)" htmlFor="dni">
            <Input
              id="dni"
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="30123456"
            />
          </Field>
        ) : (
          <>
            <Field label="Razón social (opcional)" htmlFor="razonSocial">
              <Input
                id="razonSocial"
                type="text"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Mi Empresa SA"
              />
            </Field>
            <Field label="CUIT (opcional)" htmlFor="cuit">
              <Input
                id="cuit"
                type="text"
                inputMode="numeric"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                placeholder="30-12345678-9"
              />
            </Field>
          </>
        )}

        <SubmitButton loading={submitting}>
          {flujo === "Agencia" ? "Crear cuenta de agencia" : "Crear cuenta"}
        </SubmitButton>
      </form>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-white text-accent shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2.5 text-left transition ${
        active
          ? "border-accent bg-accent-soft/50 ring-2 ring-accent/20"
          : "border-gray-200 bg-white hover:border-accent/40"
      }`}
    >
      <span className="block text-sm font-semibold text-foreground">{title}</span>
      <span className="block text-xs text-gray-500">{subtitle}</span>
    </button>
  );
}
