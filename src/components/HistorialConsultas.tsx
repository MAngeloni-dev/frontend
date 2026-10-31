import { connection } from "next/server";

import { djangoGet } from "@/lib/django";

type Consulta = {
  id: number;
  fecha: string;
  motivo: string;
  sintomas: string;
  diagnostico: string;
  tratamiento: string;
  peso: string | null;
  observaciones: string;
  veterinario_nombre: string;
};

type ConsultasResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Consulta[];
};

function mostrarFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(fecha));
}

export default async function HistorialConsultas({
  pacienteId,
}: {
  pacienteId: number;
}) {
  await connection();

  const data = await djangoGet<ConsultasResponse>(
    `/api/consultas/?paciente=${pacienteId}&page_size=10&ordering=-fecha`,
    `/pacientes/${pacienteId}`,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
      <h2 className="text-xl font-semibold">
        Historia clínica
      </h2>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Consultas registradas: {data.count}
      </p>

      {data.next && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Mostrando las 10 consultas más recientes.
        </p>
      )}

      {data.results.length === 0 ? (
        <p className="mt-5 text-slate-600 dark:text-slate-300">
          Este paciente todavía no tiene consultas registradas.
        </p>
      ) : (
        <ol className="mt-6 space-y-5">
          {data.results.map((consulta) => {
            const detalles = [
              ["Síntomas", consulta.sintomas],
              ["Diagnóstico", consulta.diagnostico],
              ["Tratamiento indicado", consulta.tratamiento],
              ["Observaciones", consulta.observaciones],
            ];

            return (
              <li
                key={consulta.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-semibold text-teal-800 dark:text-teal-300">
                      {consulta.motivo}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      <time dateTime={consulta.fecha}>
                        {mostrarFecha(consulta.fecha)}
                      </time>
                    </p>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Profesional: {consulta.veterinario_nombre}
                    </p>
                  </div>

                  {consulta.peso !== null && (
                    <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 dark:bg-teal-900 dark:text-teal-200">
                      Peso:{" "}
                      {Number(consulta.peso).toLocaleString("es-AR", {
                        maximumFractionDigits: 3,
                      })}{" "}
                      kg
                    </span>
                  )}
                </header>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  {detalles.map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {label}
                      </dt>

                      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-200">
                        {value || "Sin registrar"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}