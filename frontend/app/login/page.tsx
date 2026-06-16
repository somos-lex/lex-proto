"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { ErrorAlert, Field, Input, SubmitButton } from "@/components/ui";

export default function LoginPage() {
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
      router.push("/");
    } catch (err) {
      // El mensaje viene del backend (ej: credenciales inválidas → 401).
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
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-24">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Iniciá sesión
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-semibold text-accent hover:underline">
          Creá una
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            placeholder="••••••••"
          />
        </Field>

        <SubmitButton loading={submitting}>Entrar</SubmitButton>
      </form>
    </div>
  );
}
