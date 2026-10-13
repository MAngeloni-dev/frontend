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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">
        Historia clínica
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Consultas registradas: {data.count}
      </p>

      {data.next && (
        <p className="mt-2 text-sm text-slate-500">
          Mostrando las 10 consultas más recientes.
        </p>
      )}

      {data.results.length === 0 ? (
        <p className="mt-5 text-slate-600">
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
                className="rounded-xl border border-slate-200 p-5"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-teal-800">
                      {consulta.motivo}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {mostrarFecha(consulta.fecha)}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Profesional: {consulta.veterinario_nombre}
                    </p>
                  </div>

                  {consulta.peso !== null && (
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
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
                    <div key={label}>
                      <dt className="text-sm font-medium text-slate-500">
                        {label}
                      </dt>

                      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
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