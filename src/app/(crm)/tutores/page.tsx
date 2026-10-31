import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { djangoGet } from "@/lib/django";

type Tutor = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  activo: boolean;
};

type TutorResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tutor[];
};

type Props = {
  searchParams: Promise<{
    search?: string | string[];
    page?: string | string[];
  }>;
};

const botonSecundario =
  "inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

async function TutoresContenido({ searchParams }: Props) {
  await connection();

  const params = await searchParams;

  const search =
    typeof params.search === "string"
      ? params.search.trim()
      : "";

  const requestedPage =
    typeof params.page === "string"
      ? Number(params.page)
      : 1;

  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  function pageUrl(number: number) {
    const query = new URLSearchParams({
      page: String(number),
    });

    if (search) {
      query.set("search", search);
    }

    return `/tutores?${query}`;
  }

  const query = new URLSearchParams({
    page: String(page),
  });

  if (search) {
    query.set("search", search);
  }

  const data = await djangoGet<TutorResponse>(
    `/api/tutores/?${query}`,
    pageUrl(page),
  );

  return (
    <>
      <form
        action="/tutores"
        method="GET"
        className="mt-6 flex flex-wrap gap-3"
      >
        <label htmlFor="search" className="sr-only">
          Buscar tutor
        </label>

        <input
          id="search"
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Nombre, apellido, DNI, teléfono o email"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
        />

        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          Buscar
        </button>

        {search && (
          <Link
            href="/tutores"
            className={`${botonSecundario} flex items-center`}
          >
            Limpiar
          </Link>
        )}
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
            {search
              ? "No encontramos tutores con esa búsqueda."
              : "Todavía no hay tutores registrados."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Tutores registrados y sus datos de contacto
              </caption>

              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Tutor
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Teléfono
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.results.map((tutor) => (
                  <tr
                    key={tutor.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <td className="px-6 py-4 font-medium">
                      <Link
                        href={`/tutores/${tutor.id}`}
                        className="text-teal-700 hover:underline dark:text-teal-300"
                      >
                        {tutor.apellido}, {tutor.nombre}
                      </Link>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      {tutor.telefono || "—"}
                    </td>

                    <td className="px-6 py-4">
                      {tutor.email || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          tutor.activo
                            ? "bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-200"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {tutor.activo ? "Activo" : "Inactivo"}
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
        aria-label="Paginación de tutores"
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

function TutoresLoading() {
  return (
    <div aria-busy="true" className="mt-6">
      <p
        role="status"
        className="text-slate-600 dark:text-slate-300"
      >
        Cargando tutores...
      </p>

      <div
        aria-hidden="true"
        className="mt-4 h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
      />
    </div>
  );
}

export default function TutoresPage(props: Props) {
  return (
    <main>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Tutores
        </h1>

        <Link
          href="/tutores/nuevo"
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          Nuevo tutor
        </Link>
      </header>

      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Consultá los responsables de los pacientes.
      </p>

      <Suspense fallback={<TutoresLoading />}>
        <TutoresContenido {...props} />
      </Suspense>
    </main>
  );
}