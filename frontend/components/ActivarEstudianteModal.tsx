"use client";

// Flujo para que un Cliente Particular active su perfil de Estudiante.
//
// Pasos: completa carrera + bio + año → POST /api/perfil/activar-estudiante →
// refrescarSesion() vuelve a loguear para obtener un token con el rol Estudiante
// (el token viejo no lo tiene) → quedamos en vista Estudiante.
//
// Si no hay credenciales en memoria para refrescar (NO_CREDS), avisamos y
// ofrecemos cerrar sesión para que el usuario vuelva a entrar: la activación ya
// quedó hecha en el backend, así que al re-loguear verá el modo estudiante.
//
// Va en la hoja de formularios del panel (diálogo modal, con aviso si se cierra
// con cambios). La API (`onClose`) es la de siempre: la usan el menú, el panel
// y la Home.

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { activarEstudiante, listarCarreras, type Carrera } from "@/lib/perfil";
import { Boton } from "@/components/Boton";
import { Aviso } from "@/components/ds/Aviso";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { HojaFormulario } from "@/components/panel/HojaFormulario";

export function ActivarEstudianteModal({ onClose }: { onClose: () => void }) {
  const { refrescarSesion, cambiarVista, logout } = useAuth();

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [cargandoCarreras, setCargandoCarreras] = useState(true);

  const [carreraId, setCarreraId] = useState<string>("");
  const [bio, setBio] = useState("");
  const [anioCursado, setAnioCursado] = useState<string>("1");
  const [comprobante, setComprobante] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Cuando la activación funcionó pero no pudimos refrescar el token.
  const [necesitaReLogin, setNecesitaReLogin] = useState(false);

  useEffect(() => {
    let cancelado = false;
    listarCarreras()
      .then((data) => {
        if (cancelado) return;
        setCarreras(data);
        if (data.length) setCarreraId(String(data[0].carreraId));
      })
      .catch((err) => {
        if (!cancelado)
          setError(err instanceof ApiError ? err.message : "No pudimos cargar las carreras. Cerrá y probá de nuevo.");
      })
      .finally(() => {
        if (!cancelado) setCargandoCarreras(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!carreraId) {
      setError("Elegí una carrera.");
      return;
    }

    setSubmitting(true);
    try {
      await activarEstudiante({
        carreraId: Number(carreraId),
        bio: bio.trim(),
        anioCursado: Number(anioCursado),
        documentoComprobante: comprobante.trim() || undefined,
      });

      // Token fresco con el rol Estudiante.
      try {
        await refrescarSesion();
        cambiarVista("Estudiante");
        onClose();
      } catch (refreshErr) {
        if (refreshErr instanceof Error && refreshErr.message === "NO_CREDS") {
          // Activado, pero hay que re-loguear manualmente.
          setNecesitaReLogin(true);
        } else {
          throw refreshErr;
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos activar tu perfil de estudiante.");
    } finally {
      setSubmitting(false);
    }
  }

  if (necesitaReLogin)
    return (
      <HojaFormulario titulo="Activaste tu perfil de estudiante" onCerrar={onClose}>
        <Aviso tono="ok" titulo="Falta un paso:">
          volvé a iniciar sesión para usar tu perfil de estudiante. Mientras LEX revisa tu carrera, podés explorar y contratar.
        </Aviso>
        <Boton
          tamano="lg"
          bloque
          className="mt-4"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          Ir a iniciar sesión
        </Boton>
      </HojaFormulario>
    );

  return (
    <HojaFormulario
      titulo="Activá tu perfil de estudiante"
      descripcion="Contanos qué estudiás. Un admin de LEX revisa tu carrera antes de que publiques."
      onCerrar={onClose}
      onSubmit={handleSubmit}
      enviando={submitting}
      deshabilitado={cargandoCarreras || carreras.length === 0}
      error={error}
      enviar="Activar mi perfil"
    >
      <div className="grid gap-5">
        <Field label="Carrera" htmlFor="carrera">
          <Select
            id="carrera"
            required
            disabled={cargandoCarreras}
            value={carreraId}
            onChange={(e) => setCarreraId(e.target.value)}
          >
            {cargandoCarreras ? (
              <option>Cargando carreras…</option>
            ) : carreras.length === 0 ? (
              <option value="">No hay carreras disponibles</option>
            ) : (
              carreras.map((c) => (
                <option key={c.carreraId} value={c.carreraId}>
                  {c.nombre}
                </option>
              ))
            )}
          </Select>
        </Field>

        <Field label="Año que cursás" htmlFor="anio">
          <Select id="anio" value={anioCursado} onChange={(e) => setAnioCursado(e.target.value)}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}.º año
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Link a tu constancia de alumno regular"
          htmlFor="comprobante"
          ayuda="LEX la revisa para verificar tu carrera; hasta entonces no podés publicar. Fijate que el link se abra sin pedir permiso."
        >
          <Input
            id="comprobante"
            type="url"
            inputMode="url"
            maxLength={500}
            value={comprobante}
            onChange={(e) => setComprobante(e.target.value)}
            placeholder="https://drive.google.com/…"
            aria-describedby="comprobante-ayuda"
          />
        </Field>

        <Field label="Sobre vos (opcional)" htmlFor="bio">
          <Textarea
            id="bio"
            rows={3}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Contá en qué te especializás…"
          />
        </Field>
      </div>
    </HojaFormulario>
  );
}
