"use client";

// Perfil y verificación: la credencial del estudiante con su estado, cómo se
// verifica una carrera, sus datos y cómo lo ven en público.
//
// Solo lectura: la API no tiene un endpoint para editar el perfil, ni expone
// al estudiante el motivo de un rechazo o si cargó la constancia.

import { useAuth } from "@/contexts/AuthContext";
import { obtenerPortafolio, type Portafolio } from "@/lib/portafolio";
import { Icono } from "@/components/Icono";
import { Cargando, Esqueleto, Vacio } from "@/components/ds/Estados";
import { Fila, Grupo } from "@/components/ds/Lista";
import { RielExplicativo } from "@/components/ds/Riel";
import { ErrorDeCarga } from "@/components/panel/Reintentar";
import { TarjetaVerificacion } from "@/components/panel/Verificacion";
import { useCarga, type Carga } from "@/components/panel/useCarga";

const H2 = "text-title-2-mobile md:text-title-2";
const decimal = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function Perfil() {
  const { user } = useAuth();
  const uid = user?.usuarioId ?? null;
  const portafolio = useCarga(uid !== null ? `portafolio-${uid}` : null, () => obtenerPortafolio(uid!));

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 pt-6 pb-12 md:px-6 lg:px-8 lg:pt-9">
      <h1 className="text-title-1-mobile text-balance md:text-title-1">Perfil y verificación</h1>
      <p className="mt-2 max-w-[62ch] text-[17px] leading-normal text-ink-2 md:text-lead">
        Tu carrera verificada por LEX es lo que te deja publicar, y lo que ven quienes te contratan.
      </p>

      <section aria-labelledby="t-verificacion" className="mt-10">
        <h2 id="t-verificacion" className={`mb-3 ${H2}`}>
          Tu verificación
        </h2>
        <Credenciales nombre={user?.nombreCompleto ?? ""} portafolio={portafolio} />
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-8">
        <section aria-labelledby="t-como">
          <h2 id="t-como" className={`mb-3 ${H2}`}>
            Cómo verifica LEX tu carrera
          </h2>
          <div className="rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)] dark:shadow-none">
            <RielExplicativo
              etiqueta="Cómo verifica LEX tu carrera"
              pasos={[
                {
                  icono: "id",
                  titulo: "Elegís tu carrera y tu año",
                  descripcion: "Y cargás el link a tu constancia de alumno regular.",
                },
                {
                  icono: "file-check",
                  titulo: "Un admin de LEX la revisa",
                  descripcion: "Mira la constancia y aprueba la carrera, o la rechaza si no alcanza.",
                },
                {
                  icono: "check-circle",
                  titulo: "Publicás con tu credencial",
                  descripcion: "Los servicios habilitados para tu carrera y tu año, y los turnos del Banco de tus materias.",
                },
              ]}
            />
          </div>
        </section>

        <section aria-labelledby="t-datos">
          <h2 id="t-datos" className={`mb-3 ${H2}`}>
            Tus datos
          </h2>
          <Datos portafolio={portafolio} />
        </section>
      </div>
    </div>
  );
}

function Credenciales({ nombre, portafolio }: { nombre: string; portafolio: Carga<Portafolio> }) {
  if (portafolio.cargando)
    return (
      <Cargando etiqueta="Cargando tu credencial">
        <div className="grid gap-3 md:grid-cols-2">
          <Esqueleto className="h-[196px] rounded-card" />
          <Esqueleto className="h-[160px] rounded-card" />
        </div>
      </Cargando>
    );
  if (portafolio.error)
    return <ErrorDeCarga que="No pudimos cargar tu credencial." motivo={portafolio.error} onReintentar={portafolio.reintentar} />;
  const carreras = portafolio.datos?.carreras ?? [];
  if (carreras.length === 0)
    return (
      <Vacio icono="id" titulo="Todavía no tenés una carrera cargada">
        Sin una carrera verificada por LEX no podés publicar servicios ni turnos.
      </Vacio>
    );
  return (
    <div className="grid gap-6">
      {carreras.map((c) => (
        <TarjetaVerificacion key={c.carreraId} nombre={nombre} carrera={c} anio={portafolio.datos?.anioCursado ?? null} />
      ))}
    </div>
  );
}

function Datos({ portafolio }: { portafolio: Carga<Portafolio> }) {
  const { user } = useAuth();
  const p = portafolio.datos;
  const cargando = <Esqueleto className="mt-1.5 h-3.5 w-40 max-w-full" />;
  const sinDato = portafolio.error ? "No lo pudimos cargar" : "Sin cargar";
  const resenas = p?.resenas.length ?? 0;

  return (
    <>
      <Grupo>
        <Fila titulo="Nombre" descripcion={user?.nombreCompleto} />
        <Fila titulo="Email" descripcion={<span className="[overflow-wrap:anywhere]">{user?.email}</span>} />
        <Fila titulo="Teléfono" descripcion={user?.telefono || "Sin cargar"} />
        <Fila
          titulo="Año que cursás"
          descripcion={portafolio.cargando ? cargando : p?.anioCursado ? `${p.anioCursado}.º año` : sinDato}
        />
        <Fila titulo="Sobre vos" descripcion={portafolio.cargando ? cargando : p?.bio || sinDato} />
      </Grupo>
      <p className="mt-2 px-1 text-[14px] text-ink-2">Por ahora estos datos no se pueden cambiar desde LEX.</p>

      {user && (
        <Grupo className="mt-6">
          <Fila
            href={`/estudiantes/${user.usuarioId}`}
            icono="user"
            titulo="Ver mi perfil público"
            descripcion={
              portafolio.cargando ? (
                cargando
              ) : p ? (
                <>
                  {resenas > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-ink">
                      <Icono nombre="star" className="size-4 text-star" />
                      {decimal.format(p.calificacionPromedio)}
                    </span>
                  )}
                  {resenas > 0 && ` de ${resenas === 1 ? "1 reseña" : `${resenas} reseñas`}, `}
                  {p.trabajosCompletados === 1 ? "1 trabajo completado" : `${p.trabajosCompletados} trabajos completados`}
                </>
              ) : (
                "Así te ven quienes te contratan"
              )
            }
          />
        </Grupo>
      )}
    </>
  );
}
