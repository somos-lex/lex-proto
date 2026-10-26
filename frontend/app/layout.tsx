import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Pie } from "@/components/Pie";
import { SCRIPT_APARIENCIA } from "@/lib/apariencia";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LEX — Talento universitario a un clic",
  description:
    "LEX conecta estudiantes universitarios con clientes que necesitan su talento.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme="light" es el default del servidor; el script de apariencia lo
    // corrige antes del primer pintado (por eso suppressHydrationWarning).
    <html
      lang="es"
      data-theme="light"
      suppressHydrationWarning
      className={`${onest.variable} h-full antialiased`}
    >
      <head>
        {/* Ternario y no &&: un "" suelto en <head> rompe la hidratación. */}
        {SCRIPT_APARIENCIA ? (
          <script dangerouslySetInnerHTML={{ __html: SCRIPT_APARIENCIA }} />
        ) : null}
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <a
          href="#contenido"
          className="sr-only rounded-control bg-surface px-3.5 py-2.5 font-semibold text-ink shadow-float focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Saltar al contenido
        </a>
        <AuthProvider>
          <Navbar />
          <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Pie />
        </AuthProvider>
      </body>
    </html>
  );
}
