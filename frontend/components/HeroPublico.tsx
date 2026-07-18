// Hero estatico de la home publica. Server Component (sin interactividad).

export default function HeroPublico() {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Servicios universitarios verificados
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mb-6">
              Estudiantes de universidades del NEA ofreciendo proyectos, tutorías
              y prácticas de salud supervisadas. Calidad institucional, pago en
              escrow.
            </p>
          </div>

          <a
            href="https://somoslex.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors text-sm font-medium shrink-0"
          >
            Conocé más de LEX
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
