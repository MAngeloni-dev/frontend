import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { djangoGetAll } from "@/lib/django-list";
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
    search?: string | string[];
    especie?: string | string[];
    activo?: string | string[];
    page?: string | string[];
  }>;
};

const enlaceClass =
  "font-medium text-teal-700 hover:underline dark:text-teal-300";

const botonSecundario =
  "inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

async function PacientesContenido({ searchParams }: Props) {
  await connection();

  const params = await searchParams;

  const search =
    typeof params.search === "string"
      ? params.search.trim()
      : "";

  const especie =
    typeof params.especie === "string" &&
    /^[1-9]\d*$/.test(params.especie)
      ? params.especie
      : "";

  const activo =
    params.activo === "true" || params.activo === "false"
      ? params.activo
      : "";

  const requestedPage =
    typeof params.page === "string"
      ? Number(params.page)
      : 1;

  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
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
    return `/pacientes?${queryForPage(number)}`;
  }

  const returnTo = pageUrl(page);

  const [data, especies] = await Promise.all([
    djangoGet<PacientesResponse>(
      `/api/pacientes/?${queryForPage(page)}`,
      returnTo,
    ),
    djangoGetAll<Especie>("/api/especies/", returnTo),
  ]);

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400";

  return (
    <>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
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
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            Buscar
          </button>

          <Link
            href="/pacientes"
            className={`text-sm ${enlaceClass}`}
          >
            Limpiar
          </Link>
        </div>
      </form>

      <p
        role="status"
        className="mt-5 text-sm text-slate-600 dark:text-slate-300"
      >
        Resultados: {data.count}
      </p>

      <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
        {data.results.length === 0 ? (
          <p className="p-6 text-slate-600 dark:text-slate-300">
            No hay pacientes para los criterios seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Pacientes, especies, tutores y estado
              </caption>

              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
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

              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.results.map((paciente) => (
                  <tr
                    key={paciente.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/pacientes/${paciente.id}`}
                        className={enlaceClass}
                      >
                        {paciente.nombre}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <p>{paciente.especie_detalle.nombre}</p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {paciente.raza_detalle?.nombre ||
                          "Raza sin registrar"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/tutores/${paciente.tutor_detalle.id}`}
                        className={enlaceClass}
                      >
                        {paciente.tutor_detalle.apellido},{" "}
                        {paciente.tutor_detalle.nombre}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          paciente.activo
                            ? "bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-200"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
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
          {data.previous && page > 1 && (
            <Link
              href={pageUrl(page - 1)}
              className={botonSecundario}
            >
              Anterior
            </Link>
          )}
        </div>

        <span className="text-sm text-slate-600 dark:text-slate-300">
          Página {page}
        </span>

        <div>
          {data.next && (
            <Link
              href={pageUrl(page + 1)}
              className={botonSecundario}
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
      <p
        role="status"
        className="mt-2 text-slate-600 dark:text-slate-300"
      >
        Cargando pacientes...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
      />
    </div>
  );
}

export default function PacientesPage(props: Props) {
  return (
    <main className="text-slate-900 dark:text-slate-100">
      <h1 className="text-3xl font-bold">Pacientes</h1>

      <Suspense fallback={<PacientesLoading />}>
        <PacientesContenido {...props} />
      </Suspense>
    </main>
  );
}