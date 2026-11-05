import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { djangoGet } from "@/lib/django";

type Lote = {
  id: number;
  medicamento: number;
  medicamento_nombre: string;
  numero: string;
  fecha_vencimiento: string;
  cantidad_actual: number;
  activo: boolean;
};

type PaginaLotes = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Lote[];
};

type Props = {
  searchParams: Promise<{
    vista?: string | string[];
    dias?: string | string[];
    page?: string | string[];
  }>;
};

const enlaceClass =
  "font-medium text-teal-700 hover:underline dark:text-teal-300";

const botonSecundario =
  "inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

const inputClass =
  "mt-1 rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

const labelClass =
  "block text-sm font-medium text-slate-700 dark:text-slate-200";

function mostrarFecha(valor: string) {
  const [anio, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${anio}`;
}

async function AlertasContenido({ searchParams }: Props) {
  await connection();

  const parametros = await searchParams;

  const vista = parametros.vista ?? "proximos";
  const diasTexto = parametros.dias ?? "30";
  const paginaTexto = parametros.page ?? "1";

  if (
    typeof vista !== "string" ||
    !["proximos", "vencidos"].includes(vista) ||
    typeof diasTexto !== "string" ||
    !/^[1-9]\d*$/.test(diasTexto) ||
    Number(diasTexto) > 365 ||
    typeof paginaTexto !== "string" ||
    !/^[1-9]\d*$/.test(paginaTexto) ||
    !Number.isSafeInteger(Number(paginaTexto))
  ) {
    notFound();
  }

  const pagina = Number(paginaTexto);
  const dias = Number(diasTexto);

  function enlacePagina(numero: number) {
    const query = new URLSearchParams();

    query.set("vista", String(vista));
    query.set("dias", String(dias));
    query.set("page", String(numero));

    return `/inventario/alertas?${query}`;
  }

  const filtros = new URLSearchParams({
    page: String(pagina),
    ordering: "fecha_vencimiento",
  });

  if (vista === "proximos") {
    filtros.set("dias", String(dias));
  }

  const endpoint =
    vista === "proximos"
      ? "/api/lotes/proximos-vencer/"
      : "/api/lotes/vencidos/";

  const datos = await djangoGet<PaginaLotes>(
    `${endpoint}?${filtros}`,
    enlacePagina(pagina),
  );

  return (
    <>
      <form
        action="/inventario/alertas"
        method="GET"
        className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div>
          <label htmlFor="vista" className={labelClass}>
            Tipo de alerta
          </label>

          <select
            id="vista"
            name="vista"
            defaultValue={vista}
            className={inputClass}
          >
            <option value="proximos">Próximos a vencer</option>
            <option value="vencidos">Vencidos</option>
          </select>
        </div>

        <div>
          <label htmlFor="dias" className={labelClass}>
            Plazo para próximos vencimientos
          </label>

          <input
            id="dias"
            name="dias"
            type="number"
            min={1}
            max={365}
            required
            defaultValue={dias}
            className={`${inputClass} w-28`}
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          Consultar
        </button>
      </form>

      <p
        role="status"
        className="mt-5 text-sm text-slate-600 dark:text-slate-300"
      >
        {datos.count} lote{datos.count === 1 ? "" : "s"}{" "}
        {vista === "proximos"
          ? `con existencias y vencimiento entre hoy y los próximos ${dias} días.`
          : "vencidos con existencias pendientes de descarte."}
      </p>

      {vista === "vencidos" && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          No utilices estas existencias. Registrá su descarte
          mediante un ajuste de salida. El plazo en días no
          modifica esta consulta.
        </p>
      )}

      {datos.results.length === 0 ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          No hay lotes que coincidan con esta alerta.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Lotes con alertas de vencimiento
            </caption>

            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Medicamento
                </th>
                <th scope="col" className="px-4 py-3">
                  Lote
                </th>
                <th scope="col" className="px-4 py-3">
                  Vencimiento
                </th>
                <th scope="col" className="px-4 py-3">
                  Existencias
                </th>
                <th scope="col" className="px-4 py-3">
                  Estado del lote
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {datos.results.map((lote) => (
                <tr
                  key={lote.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <td className="px-4 py-4">
                    <Link
                      href={`/medicamentos/${lote.medicamento}`}
                      className={enlaceClass}
                    >
                      {lote.medicamento_nombre}
                    </Link>
                  </td>

                  <td className="px-4 py-4">
                    {lote.numero}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4">
                    <time
                      dateTime={lote.fecha_vencimiento}
                      className={
                        vista === "vencidos"
                          ? "font-medium text-red-700 dark:text-red-300"
                          : "font-medium text-amber-800 dark:text-amber-200"
                      }
                    >
                      {mostrarFecha(lote.fecha_vencimiento)}
                    </time>
                  </td>

                  <td className="px-4 py-4 font-semibold">
                    {lote.cantidad_actual}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        lote.activo
                          ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {lote.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav
        aria-label="Paginación de alertas"
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

export default function AlertasInventarioPage(props: Props) {
  return (
    <main className="text-slate-900 dark:text-slate-100">
      <h1 className="text-3xl font-bold">
        Alertas de inventario
      </h1>

      <Link
        href="/medicamentos?stock=bajo"
        className="mt-4 inline-block rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
      >
        Consultar medicamentos con stock bajo
      </Link>

      <Suspense
        fallback={
          <p
            role="status"
            className="mt-6 text-slate-600 dark:text-slate-300"
          >
            Cargando alertas...
          </p>
        }
      >
        <AlertasContenido {...props} />
      </Suspense>
    </main>
  );
}