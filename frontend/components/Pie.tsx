// Pie de página: el descargo (LEX no es un servicio de las universidades) y el
// único acceso público a "Verificar una constancia".

import Link from "next/link";

const LINKS = [
  { href: "/", label: "Servicios" },
  { href: "/practicas", label: "Banco de Turnos" },
  { href: "/constancias", label: "Verificar una constancia" },
];

export function Pie() {
  return (
    <footer className="mt-14 border-t border-line pt-7 pb-10 text-[15px] text-ink-2">
      <div className="mx-auto grid max-w-lex gap-5 px-4 md:px-6 lg:grid-cols-[1fr_auto] lg:items-start lg:px-8">
        <div>
          <p className="text-[19px] font-[760] tracking-[0.04em] text-ink">LEX</p>
          <p className="mt-2 max-w-[56ch]">
            LEX conecta a estudiantes universitarios del NEA con quienes necesitan su trabajo. LEX no es un
            servicio de las universidades: verifica la constancia de alumno regular que carga cada estudiante.
          </p>
        </div>
        <nav aria-label="Pie" className="flex flex-wrap gap-x-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="-ml-2.5 inline-flex min-h-11 items-center rounded-control px-2.5 font-[550] text-ink no-underline hover:bg-surface-2"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
