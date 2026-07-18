import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-6xl font-bold text-slate-900 mb-2">404</h2>
        <p className="text-slate-600 mb-6">Esta página no existe.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 inline-block"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
