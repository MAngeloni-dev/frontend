import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { djangoGet } from "@/lib/django";
import { etiquetasMovimiento } from "@/lib/movimiento-stock-schema";

type TipoMovimiento = keyof typeof etiquetasMovimiento;

type Movimiento = {
  id: number;
  lote: number;
  lote_numero: string;
  medicamento_nombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_posterior: number;
  responsable_nombre: string;
  motivo: string;
  observaciones: string;
  fecha_creacion: string;
};

type PaginaMovimientos = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Movimiento[];
};

type Props = {
  searchParams: Promise<{
    page?: string | string[];
    search?: string | string[];
    tipo?: string | string[];
    lote?: string | string[];
  }>;
};

const enlaceClass =
  "font-medium text-teal-700 hover:underline dark:text-teal-300";

const botonSecundario =
  "inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : "";
}

function mostrarFecha(valor: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

async function HistorialContenido({ searchParams }: Props) {
  await connection();

  const parametros = await searchParams;

  const paginaTexto = texto(parametros.page) || "1";
  const busqueda = texto(parametros.search).trim();
  const tipo = texto(parametros.tipo);
  const lote = texto(parametros.lote);

  if (
    !/^[1-9]\d*$/.test(paginaTexto) ||
    !Number.isSafeInteger(Number(paginaTexto)) ||
    (tipo !== "" &&
      !Object.prototype.hasOwnProperty.call(
        etiquetasMovimiento,
        tipo,
      )) ||
    (lote !== "" && !/^[1-9]\d*$/.test(lote))
  ) {
    notFound();
  }

  const pagina = Number(paginaTexto);

  function queryPagina(numero: number) {
    const query = new URLSearchParams({
      page: String(numero),
    });

    if (busqueda) query.set("search", busqueda);
    if (tipo) query.set("tipo", tipo);
    if (lote) query.set("lote", lote);

    return query;
  }

  function enlacePagina(numero: number) {
    return `/movimientos-stock?${queryPagina(numero)}`;
  }

  const filtros = queryPagina(pagina);

  const datos = await djangoGet<PaginaMovimientos>(
    `/api/movimientos-stock/?${filtros}`,
    enlacePagina(pagina),
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition-colors placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400";

  const labelClass =
    "text-sm font-medium text-slate-700 dark:text-slate-200";

  return (
    <>
      <form
        action="/movimientos-stock"
        method="GET"
        className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-3"
      >
        {lote && (
          <input type="hidden" name="lote" value={lote} />
        )}

        <div className="sm:col-span-2">
          <label htmlFor="search" className={labelClass}>
            Buscar movimiento
          </label>

          <input
            id="search"
            name="search"
            type="search"
            defaultValue={busqueda}
            placeholder="Medicamento, lote, motivo u observaciones"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="tipo" className={labelClass}>
            Tipo de movimiento
          </label>

          <select
            id="tipo"
            name="tipo"
            defaultValue={tipo}
            className={inputClass}
          >
            <option value="">Todos</option>

            {Object.entries(etiquetasMovimiento).map(
              ([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-3">
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            Aplicar filtros
          </button>

          <Link
            href={
              lote
                ? `/movimientos-stock?lote=${lote}`
                : "/movimientos-stock"
            }
            className="text-sm font-medium text-slate-600 hover:underline dark:text-slate-300"
          >
            Limpiar búsqueda y tipo
          </Link>

          {lote && (
            <Link
              href="/movimientos-stock"
              className={`text-sm ${enlaceClass}`}
            >
              Ver todos los lotes
            </Link>
          )}
        </div>
      </form>

      {lote && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Historial filtrado por lote #{lote}.
        </p>
      )}

      <p
        role="status"
        className="mt-5 text-sm text-slate-600 dark:text-slate-300"
      >
        {datos.count} movimiento
        {datos.count === 1 ? "" : "s"} encontrado
        {datos.count === 1 ? "" : "s"}.
      </p>

      {datos.results.length === 0 ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          No hay movimientos para los filtros seleccionados.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Historial de movimientos y cambios de existencias
            </caption>

            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3">
                  Medicamento / lote
                </th>
                <th scope="col" className="px-4 py-3">
                  Movimiento
                </th>
                <th scope="col" className="px-4 py-3">
                  Cantidad
                </th>
                <th scope="col" className="px-4 py-3">
                  Antes → Después
                </th>
                <th scope="col" className="px-4 py-3">
                  Responsable
                </th>
                <th scope="col" className="px-4 py-3">
                  Motivo
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {datos.results.map((movimiento) => {
                const entrada =
                  movimiento.tipo === "INGRESO" ||
                  movimiento.tipo === "AJUSTE_ENTRADA";

                return (
                  <tr
                    key={movimiento.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      <time dateTime={movimiento.fecha_creacion}>
                        {mostrarFecha(movimiento.fecha_creacion)}
                      </time>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Movimiento #{movimiento.id}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {movimiento.medicamento_nombre}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Lote: {movimiento.lote_numero}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          entrada
                            ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200"
                            : "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                        }`}
                      >
                        {etiquetasMovimiento[movimiento.tipo]}
                      </span>
                    </td>

                    <td
                      className={`px-4 py-4 font-semibold ${
                        entrada
                          ? "text-teal-700 dark:text-teal-300"
                          : "text-amber-800 dark:text-amber-200"
                      }`}
                    >
                      {entrada ? "+" : "−"}
                      {movimiento.cantidad}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      {movimiento.cantidad_anterior} →{" "}
                      {movimiento.cantidad_posterior}
                    </td>

                    <td className="px-4 py-4">
                      {movimiento.responsable_nombre}
                    </td>

                    <td className="min-w-48 px-4 py-4">
                      <p className="break-words">
                        {movimiento.motivo}
                      </p>

                      {movimiento.observaciones && (
                        <details className="mt-2">
                          <summary className="cursor-pointer rounded text-xs font-medium text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-teal-300">
                            Observaciones
                          </summary>

                          <p className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-600 dark:text-slate-300">
                            {movimiento.observaciones}
                          </p>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <nav
        aria-label="Paginación del historial"
        className="mt-6 flex flex-wrap items-center gap-4"
      >
        {datos.previous && pagina > 1 && (
          <Link
            href={enlacePagina(pagina - 1)}
            className={botonSecundario}
          >
            ← Anterior
          </Link>
        )}

        <span className="text-sm text-slate-600 dark:text-slate-300">
          Página {pagina}
        </span>

        {datos.next && (
          <Link
            href={enlacePagina(pagina + 1)}
            className={botonSecundario}
          >
            Siguiente →
          </Link>
        )}
      </nav>
    </>
  );
}

export default function MovimientosStockPage(props: Props) {
  return (
    <main className="text-slate-900 dark:text-slate-100">
      <Link
        href="/medicamentos"
        className={`text-sm ${enlaceClass}`}
      >
        ← Volver a medicamentos
      </Link>

      <h1 className="mt-5 text-3xl font-bold">
        Historial de stock
      </h1>

      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Consultá ingresos, retiros, ajustes y sus responsables.
        Los horarios corresponden a Argentina.
      </p>

      <Suspense
        fallback={
          <p
            role="status"
            className="mt-6 text-slate-600 dark:text-slate-300"
          >
            Cargando movimientos...
          </p>
        }
      >
        <HistorialContenido {...props} />
      </Suspense>
    </main>
  );
}