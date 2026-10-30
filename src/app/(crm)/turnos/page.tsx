import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { djangoGet } from "@/lib/django";

type EstadoTurno =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "ATENDIDO"
  | "CANCELADO";

type Turno = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  veterinario: number;
  veterinario_nombre: string;
  inicio: string;
  fin: string;
  motivo: string;
  estado: EstadoTurno;
};

type PaginaTurnos = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Turno[];
};

type Props = {
  searchParams: Promise<{
    search?: string | string[];
    estado?: string | string[];
    page?: string | string[];
  }>;
};

const estados: Record<EstadoTurno, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  CANCELADO: "Cancelado",
};

const colores: Record<EstadoTurno, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  ATENDIDO: "bg-teal-100 text-teal-800",
  CANCELADO: "bg-slate-200 text-slate-700",
};

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

function primerValor(
  valor: string | string[] | undefined,
) {
  return Array.isArray(valor) ? valor[0] ?? "" : valor ?? "";
}

async function TurnosContenido({ searchParams }: Props) {
  await connection();

  const parametros = await searchParams;

  const busqueda = primerValor(
    parametros.search,
  ).trim().slice(0, 150);

  const estadoRecibido = primerValor(parametros.estado);

  const estado = Object.hasOwn(estados, estadoRecibido)
    ? (estadoRecibido as EstadoTurno)
    : "";

  const paginaRecibida = primerValor(parametros.page);
  const numeroPagina = Number(paginaRecibida);

  const pagina =
    /^[1-9]\d*$/.test(paginaRecibida) &&
    Number.isSafeInteger(numeroPagina)
      ? numeroPagina
      : 1;

  function parametrosPagina(numero: number) {
    const query = new URLSearchParams({
      page: String(numero),
    });

    if (busqueda) {
      query.set("search", busqueda);
    }

    if (estado) {
      query.set("estado", estado);
    }

    return query;
  }

  function enlacePagina(numero: number) {
    return `/turnos?${parametrosPagina(numero)}`;
  }

  const query = parametrosPagina(pagina);
  query.set("ordering", "inicio");

  const datos = await djangoGet<PaginaTurnos>(
    `/api/turnos/?${query}`,
    enlacePagina(pagina),
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900";

  return (
    <>
      <header>
        <h1 className="text-3xl font-bold">Turnos</h1>

        <p className="mt-2 text-slate-600">
          Consultá la agenda y el estado de las reservas.
        </p>
      </header>

      <form
        action="/turnos"
        method="GET"
        className="mt-6 grid items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="lg:col-span-2">
          <label
            htmlFor="search"
            className="text-sm font-medium"
          >
            Buscar por paciente, tutor o motivo
          </label>

          <input
            key={`search-${busqueda}`}
            id="search"
            name="search"
            type="search"
            defaultValue={busqueda}
            maxLength={150}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="estado"
            className="text-sm font-medium"
          >
            Estado
          </label>

          <select
            key={`estado-${estado}`}
            id="estado"
            name="estado"
            defaultValue={estado}
            className={inputClass}
          >
            <option value="">Todos</option>

            {Object.entries(estados).map(
              ([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800"
          >
            Filtrar
          </button>

          <Link
            href="/turnos"
            className="text-sm font-medium text-slate-600 hover:underline"
          >
            Limpiar
          </Link>

          <Link
            href="/turnos/nuevo"
            className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800"
          >
            Agendar turno
          </Link>
          <Link
            href="/turnos/calendario"
            className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800"
          >
            Ver calendario
          </Link>
        </div>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        {datos.count}{" "}
        {datos.count === 1
          ? "turno encontrado"
          : "turnos encontrados"}
      </p>

      {datos.results.length === 0 ? (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold">
            No hay turnos para mostrar
          </h2>

          <p className="mt-2 text-slate-600">
            Todavía no se registraron reservas o ninguna
            coincide con los filtros seleccionados.
          </p>
        </section>
      ) : (
        <div
          role="region"
          aria-label="Listado de turnos"
          tabIndex={0}
          className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          <table className="w-full text-left text-sm">
            
            <caption className="sr-only">
              Turnos ordenados por fecha de inicio
            </caption>

            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-5 py-4">
                  Paciente
                </th>
                <th scope="col" className="px-5 py-4">
                  Veterinario
                </th>
                <th scope="col" className="px-5 py-4">
                  Inicio
                </th>
                <th scope="col" className="px-5 py-4">
                  Fin
                </th>
                <th scope="col" className="px-5 py-4">
                  Motivo
                </th>
                <th scope="col" className="px-5 py-4">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {datos.results.map((turno) => (
                <tr
                  key={turno.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/pacientes/${turno.paciente}`}
                      className="font-semibold text-teal-700 hover:underline"
                    >
                      {turno.paciente_nombre}
                    </Link>
                    <Link
                      href={`/turnos/${turno.id}`}
                      className="mt-1 block text-sm font-medium text-teal-700 hover:underline"
                    >
                      Ver turno →
                    </Link>
                  </td>

                  <td className="px-5 py-4">
                    {turno.veterinario_nombre}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    {formatoFecha.format(
                      new Date(turno.inicio),
                    )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    {formatoFecha.format(
                      new Date(turno.fin),
                    )}
                  </td>

                  <td className="min-w-48 px-5 py-4">
                    {turno.motivo}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${colores[turno.estado]}`}
                    >
                      {estados[turno.estado]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav
        aria-label="Paginación de turnos"
        className="mt-6 flex flex-wrap items-center justify-between gap-4"
      >
        <span className="text-sm text-slate-600">
          Página {pagina}
        </span>

        <div className="flex gap-3">
          {datos.previous && pagina > 1 && (
            <Link
              href={enlacePagina(pagina - 1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Anterior
            </Link>
          )}

          {datos.next && (
            <Link
              href={enlacePagina(pagina + 1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Siguiente
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

function TurnosLoading() {
  return (
    <div aria-busy="true">
      <h1 className="text-3xl font-bold">Turnos</h1>

      <p role="status" className="mt-2 text-slate-600">
        Cargando la agenda…
      </p>

      <div
        aria-hidden="true"
        className="mt-6 h-80 animate-pulse rounded-2xl bg-slate-200"
      />
    </div>
  );
}

export default function TurnosPage(props: Props) {
  return (
    <main>
      <Suspense fallback={<TurnosLoading />}>
        <TurnosContenido {...props} />
      </Suspense>
    </main>
  );
}