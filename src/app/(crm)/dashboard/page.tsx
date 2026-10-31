import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { djangoGet } from "@/lib/django";

type Paciente = {
  id: number;
  nombre: string;
  activo: boolean;
};

type PacientesResponse = {
  count: number;
  results: Paciente[];
};

async function DashboardContenido() {
  await connection();

  const data = await djangoGet<PacientesResponse>(
    "/api/pacientes/",
    "/dashboard",
  );

  return (
    <section className="mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
        Pacientes registrados
      </p>

      <p className="mt-2 text-4xl font-bold text-teal-700 dark:text-teal-300">
        {data.count}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">
          Pacientes de esta página
        </h2>

        <Link
          href="/pacientes"
          className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
        >
          Ver todos →
        </Link>
      </div>

      {data.results.length === 0 ? (
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Todavía no hay pacientes registrados.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
          {data.results.map((paciente) => (
            <li
              key={paciente.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <Link
                href={`/pacientes/${paciente.id}`}
                className="min-w-0 break-words font-medium text-slate-800 hover:text-teal-700 hover:underline dark:text-slate-100 dark:hover:text-teal-300"
              >
                {paciente.nombre}
              </Link>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  paciente.activo
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-200"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                }`}
              >
                {paciente.activo ? "Activo" : "Inactivo"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      className="mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
    >
      <p
        role="status"
        className="text-sm text-slate-600 dark:text-slate-300"
      >
        Cargando pacientes...
      </p>

      <div
        aria-hidden="true"
        className="mt-4 h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700"
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        Inicio
      </h1>

      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Consultá los pacientes registrados en la clínica.
      </p>

      <Suspense fallback={<DashboardLoading />}>
        <DashboardContenido />
      </Suspense>
    </main>
  );
}