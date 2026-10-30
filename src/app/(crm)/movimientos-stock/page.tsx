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
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900";

  return (
    <>
      <form
        action="/movimientos-stock"
        method="GET"
        className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3"
      >
        {lote && (
          <input type="hidden" name="lote" value={lote} />
        )}

        <div className="sm:col-span-2">
          <label
            htmlFor="search"
            className="text-sm font-medium"
          >
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
          <label htmlFor="tipo" className="text-sm font-medium">
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
            className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800"
          >
            Aplicar filtros
          </button>

          <Link
            href={
              lote
                ? `/movimientos-stock?lote=${lote}`
                : "/movimientos-stock"
            }
            className="text-sm font-medium text-slate-600 hover:underline"
          >
            Limpiar búsqueda y tipo
          </Link>

          {lote && (
            <Link
              href="/movimientos-stock"
              className="text-sm font-medium text-teal-700 hover:underline"
            >
              Ver todos los lotes
            </Link>
          )}
        </div>
      </form>

      {lote && (
        <p className="mt-4 text-sm text-slate-600">
          Historial filtrado por lote #{lote}.
        </p>
      )}

      <p role="status" className="mt-5 text-sm text-slate-600">
        {datos.count} movimiento
        {datos.count === 1 ? "" : "s"} encontrado
        {datos.count === 1 ? "" : "s"}.
      </p>

      {datos.results.length === 0 ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No hay movimientos para los filtros seleccionados.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Historial de movimientos y cambios de existencias
            </caption>

            <thead className="border-b border-slate-200 bg-slate-50">
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

            <tbody className="divide-y divide-slate-100">
              {datos.results.map((movimiento) => {
                const entrada =
                  movimiento.tipo === "INGRESO" ||
                  movimiento.tipo === "AJUSTE_ENTRADA";

                return (
                  <tr key={movimiento.id}>
                    <td className="whitespace-nowrap px-4 py-4">
                      {mostrarFecha(movimiento.fecha_creacion)}
                      <p className="mt-1 text-xs text-slate-500">
                        Movimiento #{movimiento.id}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {movimiento.medicamento_nombre}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Lote: {movimiento.lote_numero}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          entrada
                            ? "bg-teal-50 text-teal-800"
                            : "bg-amber-50 text-amber-900"
                        }`}
                      >
                        {etiquetasMovimiento[movimiento.tipo]}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-semibold">
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
                          <summary className="cursor-pointer text-xs text-teal-700">
                            Observaciones
                          </summary>
                          <p className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-600">
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
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            ← Anterior
          </Link>
        )}

        <span className="text-sm text-slate-600">
          Página {pagina}
        </span>

        {datos.next && (
          <Link
            href={enlacePagina(pagina + 1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
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
    <main>
      <Link
        href="/medicamentos"
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Volver a medicamentos
      </Link>

      <h1 className="mt-5 text-3xl font-bold">
        Historial de stock
      </h1>

      <p className="mt-2 text-slate-600">
        Consultá ingresos, retiros, ajustes y sus responsables.
        Los horarios corresponden a Argentina.
      </p>

      <Suspense
        fallback={
          <p role="status" className="mt-6 text-slate-600">
            Cargando movimientos...
          </p>
        }
      >
        <HistorialContenido {...props} />
      </Suspense>
    </main>
  );
}