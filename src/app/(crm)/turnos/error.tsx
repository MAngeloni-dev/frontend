"use client";

import Link from "next/link";

export default function TurnosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-red-200 bg-white p-6"
    >
      <h1 className="text-2xl font-bold">
        No pudimos cargar los turnos
      </h1>

      <p className="mt-3 text-slate-600">
        Revisá tu conexión e intentá nuevamente.
        Si el problema continúa, verificá que el backend
        esté disponible.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
        >
          Reintentar
        </button>

        <Link
          href="/dashboard"
          className="text-sm text-slate-600 hover:underline"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}