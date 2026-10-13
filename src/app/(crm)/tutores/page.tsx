import Link from "next/link";

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
    search?: string;
    page?: string;
  }>;
};

export default async function TutoresPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const search = (params.search || "").trim();
  const requestedPage = Number(params.page || "1");

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  function pageUrl(number: number) {
    const query = new URLSearchParams({
      page: String(number),
    });

    if (search) {
      query.set("search", search);
    }

    return `/tutores?${query.toString()}`;
  }

  const query = new URLSearchParams({
    page: String(page),
  });

  if (search) {
    query.set("search", search);
  }

  const data = await djangoGet<TutorResponse>(
    `/api/tutores/?${query.toString()}`,
    pageUrl(page),
  );

  return (
    <main>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Tutores</h1>

        <Link
          href="/tutores/nuevo"
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800"
        >
          Nuevo tutor
        </Link>
      </header>

      <p className="mt-2 text-slate-600">
        Consultá los responsables de los pacientes.
      </p>

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
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3"
        />

        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800"
        >
          Buscar
        </button>

        {search && (
          <Link
            href="/tutores"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3"
          >
            Limpiar
          </Link>
        )}
      </form>

      <p className="mt-5 text-sm text-slate-600">
        Resultados: {data.count}
      </p>

      <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {data.results.length === 0 ? (
          <p className="p-6 text-slate-600">
            {search
              ? "No encontramos tutores con esa búsqueda."
              : "Todavía no hay tutores registrados."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
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

              <tbody className="divide-y divide-slate-100">
                {data.results.map((tutor) => (
                  <tr key={tutor.id}>
                    <td className="px-6 py-4 font-medium">
                        <Link
                            href={`/tutores/${tutor.id}`}
                            className="text-teal-700 hover:underline"
                        >
                            {tutor.apellido}, {tutor.nombre}
                        </Link>
                    </td>

                    <td className="px-6 py-4">
                      {tutor.telefono || "—"}
                    </td>

                    <td className="px-6 py-4">
                      {tutor.email || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          tutor.activo
                            ? "bg-teal-50 text-teal-700"
                            : "bg-slate-100 text-slate-600"
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
    </main>
  );
}