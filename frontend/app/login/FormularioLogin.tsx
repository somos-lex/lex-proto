"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { ErrorAlert, Field, Input, SubmitButton } from "@/components/ui";
import { conVolver } from "@/components/publico/Acceso";

export function FormularioLogin({ volver }: { volver: string | null }) {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(volver ?? "/");
    } catch (err) {
      // El mensaje viene del backend (ej: credenciales inválidas → 401).
      setError(err instanceof ApiError ? err.message : "No pudimos conectarnos con LEX. Revisá tu conexión y probá de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-title-1-mobile lg:text-title-1">Ingresá a LEX</h1>
      <p className="mt-2 text-[17px] text-ink-2">
        ¿No tenés cuenta?{" "}
        <Link href={conVolver("/registro", volver)} className="font-semibold">
          Creala
        </Link>
      </p>
      {volver && <p className="mt-1 text-[15px] text-ink-2">Después de ingresar volvés adonde estabas.</p>}

      <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
        {error && <ErrorAlert message={error} />}

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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <SubmitButton loading={submitting}>Ingresar</SubmitButton>
      </form>
    </>
  );
}
