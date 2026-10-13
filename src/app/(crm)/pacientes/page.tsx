import { Suspense } from "react";
import Link from "next/link";

import { djangoGet } from "@/lib/django";

type Paciente = {
  id: number;
  nombre: string;
  activo: boolean;
  especie_detalle: {
    nombre: string;
  };
  raza_detalle: {
    nombre: string;
  } | null;
  tutor_detalle: {
    id: number;
    nombre: string;
    apellido: string;
  };
};

type PacientesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Paciente[];
};

type Especie = {
  id: number;
  nombre: string;
};

type Props = {
  searchParams: Promise<{
    search?: string;
    especie?: string;
    activo?: string;
    page?: string;
  }>;
};

async function PacientesContenido({ searchParams }: Props) {
  const params = await searchParams;

  const search = (params.search || "").trim();
  const especie = /^[1-9]\d*$/.test(params.especie || "")
    ? params.especie!
    : "";

  const activo =
    params.activo === "true" || params.activo === "false"
      ? params.activo
      : "";

  const requestedPage = Number(params.page || "1");
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  function queryForPage(number: number) {
    const query = new URLSearchParams({
      page: String(number),
    });

    if (search) query.set("search", search);
    if (especie) query.set("especie", especie);
    if (activo) query.set("activo", activo);

    return query;
  }

  function pageUrl(number: number) {
    return `/pacientes?${queryForPage(number).toString()}`;
  }

  const returnTo = pageUrl(page);

  const [data, especies] = await Promise.all([
    djangoGet<PacientesResponse>(
      `/api/pacientes/?${queryForPage(page).toString()}`,
      returnTo,
    ),
    djangoGet<Especie[]>("/api/especies/", returnTo),
  ]);

  const inputClass =
    "rounded-lg border border-slate-300 bg-white px-4 py-3";

  return (
    <>
      <p className="mt-2 text-slate-600">
        Buscá pacientes y accedé a sus fichas.
      </p>

      <form
        action="/pacientes"
        method="GET"
        className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        <div>
          <label htmlFor="search" className="sr-only">
            Buscar paciente
          </label>
          <input
            id="search"
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Paciente, tutor o microchip"
            className={`${inputClass} w-full`}
          />
        </div>

        <div>
          <label htmlFor="especie" className="sr-only">
            Especie
          </label>
          <select
            id="especie"
            name="especie"
            defaultValue={especie}
            className={`${inputClass} w-full`}
          >
            <option value="">Todas las especies</option>
            {especies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="activo" className="sr-only">
            Estado
          </label>
          <select
            id="activo"
            name="activo"
            defaultValue={activo}
            className={`${inputClass} w-full`}
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800"
          >
            Buscar
          </button>

          <Link
            href="/pacientes"
            className="text-sm text-teal-700 hover:underline"
          >
            Limpiar
          </Link>
        </div>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        Resultados: {data.count}
      </p>

      <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {data.results.length === 0 ? (
          <p className="p-6 text-slate-600">
            No hay pacientes para los criterios seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Paciente
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Especie / raza
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Tutor
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data.results.map((paciente) => (
                  <tr key={paciente.id}>
                    <td className="px-6 py-4 font-medium">
                      <Link
                        href={`/pacientes/${paciente.id}`}
                        className="text-teal-700 hover:underline"
                      >
                        {paciente.nombre}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <p>{paciente.especie_detalle.nombre}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {paciente.raza_detalle?.nombre ||
                          "Raza sin registrar"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/tutores/${paciente.tutor_detalle.id}`}
                        className="text-teal-700 hover:underline"
                      >
                        {paciente.tutor_detalle.apellido},{" "}
                        {paciente.tutor_detalle.nombre}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          paciente.activo
                            ? "bg-teal-50 text-teal-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {paciente.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav
        aria-label="Paginación de pacientes"
        className="mt-5 flex items-center justify-between gap-4"
      >
        <div>
          {data.previous && (
            <Link
              href={pageUrl(page - 1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2"
            >
              Anterior
            </Link>
          )}
        </div>

        <span className="text-sm text-slate-600">
          Página {page}
        </span>

        <div>
          {data.next && (
            <Link
              href={pageUrl(page + 1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2"
            >
              Siguiente
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

function PacientesLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="mt-2 text-slate-600">
        Cargando pacientes...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-200"
      />
    </div>
  );
}

export default function PacientesPage(props: Props) {
  return (
    <main>
      <h1 className="text-3xl font-bold">Pacientes</h1>

      <Suspense fallback={<PacientesLoading />}>
        <PacientesContenido {...props} />
      </Suspense>
    </main>
  );
}