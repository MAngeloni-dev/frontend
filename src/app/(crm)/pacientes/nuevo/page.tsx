import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { djangoGet } from "@/lib/django";

type Tutor = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  activo: boolean;
};

type TutoresResponse = {
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

const enlaceClass =
  "font-medium text-teal-700 hover:underline dark:text-teal-300";

const botonSecundario =
  "inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

async function SeleccionarTutorContenido({
  searchParams,
}: Props) {
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

  function pageUrl(numero: number) {
    const query = new URLSearchParams({
      page: String(numero),
    });

    if (search) {
      query.set("search", search);
    }

    return `/pacientes/nuevo?${query.toString()}`;
  }

  const query = new URLSearchParams({
    activo: "true",
    page: String(page),
    ordering: "apellido",
  });

  if (search) {
    query.set("search", search);
  }

  const data = await djangoGet<TutoresResponse>(
    `/api/tutores/?${query.toString()}`,
    pageUrl(page),
  );

  return (
    <>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Primero elegí al tutor responsable del nuevo paciente.
      </p>

      <form
        action="/pacientes/nuevo"
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
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
        />

        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          Buscar
        </button>

        {search && (
          <Link
            href="/pacientes/nuevo"
            className="self-center text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
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

      <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="sr-only">Elegir tutor</h2>

        {data.results.length === 0 ? (
          <p className="p-6 text-slate-600 dark:text-slate-300">
            {search
              ? "No encontramos tutores activos con esa búsqueda."
              : "Todavía no hay tutores activos disponibles."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {data.results.map((tutor) => (
              <li
                key={tutor.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <h3 className="font-semibold">
                    {tutor.apellido}, {tutor.nombre}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {tutor.telefono || "Sin teléfono"}
                    {" · "}
                    Tutor #{tutor.id}
                  </p>
                </div>

                {tutor.activo ? (
                  <Link
                    href={`/tutores/${tutor.id}/pacientes/nuevo`}
                    aria-label={`Agregar paciente de ${tutor.nombre} ${tutor.apellido}`}
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                  >
                    Elegir tutor
                  </Link>
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Tutor inactivo
                  </span>
                )}
              </li>
            ))}
          </ul>
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

      <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950">
        <p className="text-sm text-teal-800 dark:text-teal-200">
          ¿El tutor todavía no está registrado?
        </p>

        <Link
          href="/tutores/nuevo"
          className={`mt-2 inline-block text-sm ${enlaceClass}`}
        >
          Registrar un tutor
        </Link>
      </div>
    </>
  );
}

export default function NuevoPacientePage(props: Props) {
  return (
    <main className="text-slate-900 dark:text-slate-100">
      <Link
        href="/pacientes"
        className={`text-sm ${enlaceClass}`}
      >
        ← Volver a pacientes
      </Link>

      <h1 className="mt-5 text-3xl font-bold">
        Nuevo paciente
      </h1>

      <Suspense
        fallback={
          <p
            role="status"
            className="mt-4 text-slate-600 dark:text-slate-300"
          >
            Cargando tutores…
          </p>
        }
      >
        <SeleccionarTutorContenido {...props} />
      </Suspense>
    </main>
  );
}