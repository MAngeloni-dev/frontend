import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { djangoGet } from "@/lib/django";

type UsuarioActual = {
  rol: "ADMINISTRADOR" | "VETERINARIO" | "RECEPCION";
};

type Medicamento = {
  id: number;
  nombre: string;
  laboratorio: string;
  principio_activo: string;
  concentracion: string;
  presentacion: string;
  stock_minimo: number;
  stock_utilizable: number;
  activo: boolean;
};

type PaginaMedicamentos = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Medicamento[];
};

type Props = {
  searchParams: Promise<{
    page?: string | string[];
    search?: string | string[];
    activo?: string | string[];
    stock?: string | string[];
  }>;
};

const botonPrincipal =
  "inline-block rounded-lg bg-teal-700 px-5 py-3 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-600 dark:hover:bg-teal-500";

const botonSecundario =
  "inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : "";
}

async function MedicamentosContenido({ searchParams }: Props) {
  await connection();

  const parametros = await searchParams;

  const paginaTexto = texto(parametros.page) || "1";
  const busqueda = texto(parametros.search).trim();
  const activo = texto(parametros.activo) || "true";
  const stock = texto(parametros.stock);

  if (
    !/^[1-9]\d*$/.test(paginaTexto) ||
    !Number.isSafeInteger(Number(paginaTexto)) ||
    !["true", "false", "todos"].includes(activo) ||
    !["", "bajo"].includes(stock)
  ) {
    notFound();
  }

  const pagina = Number(paginaTexto);

  function enlacePagina(numero: number) {
    const query = new URLSearchParams({
      page: String(numero),
      activo,
    });

    if (busqueda) query.set("search", busqueda);
    if (stock) query.set("stock", stock);

    return `/medicamentos?${query}`;
  }

  const filtros = new URLSearchParams({
    page: String(pagina),
    ordering: "nombre",
  });

  if (busqueda) {
    filtros.set("search", busqueda);
  }

  // El endpoint stock-bajo ya limita a medicamentos activos.
  if (stock !== "bajo" && activo !== "todos") {
    filtros.set("activo", activo);
  }

  const endpoint =
    stock === "bajo"
      ? "/api/medicamentos/stock-bajo/"
      : "/api/medicamentos/";

  const [datos, usuario] = await Promise.all([
    djangoGet<PaginaMedicamentos>(
      `${endpoint}?${filtros}`,
      enlacePagina(pagina),
    ),
    djangoGet<UsuarioActual>(
      "/api/usuarios/me/",
      enlacePagina(pagina),
    ),
  ]);

  const puedeCrear =
    usuario.rol === "ADMINISTRADOR" ||
    usuario.rol === "VETERINARIO";

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition-colors placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400";

  const labelClass =
    "text-sm font-medium text-slate-700 dark:text-slate-200";

  return (
    <>
      {puedeCrear && (
        <Link
          href="/medicamentos/nuevo"
          className={`mt-6 ${botonPrincipal}`}
        >
          Agregar medicamento
        </Link>
      )}

      <form
        action="/medicamentos"
        method="GET"
        className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:grid-cols-4"
      >
        <div className="lg:col-span-2">
          <label htmlFor="search" className={labelClass}>
            Buscar medicamento
          </label>

          <input
            id="search"
            name="search"
            type="search"
            defaultValue={busqueda}
            placeholder="Nombre, laboratorio, principio activo o código"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="activo" className={labelClass}>
            Estado
          </label>

          <select
            id="activo"
            name="activo"
            defaultValue={activo}
            className={inputClass}
          >
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        <div>
          <label htmlFor="stock" className={labelClass}>
            Stock
          </label>

          <select
            id="stock"
            name="stock"
            defaultValue={stock}
            className={inputClass}
          >
            <option value="">Todos los niveles</option>
            <option value="bajo">Stock bajo — activos</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4 lg:col-span-4">
          <button type="submit" className={botonPrincipal}>
            Aplicar filtros
          </button>

          <Link
            href="/medicamentos"
            className="text-sm font-medium text-slate-600 hover:underline dark:text-slate-300"
          >
            Limpiar filtros
          </Link>
        </div>
      </form>

      {stock === "bajo" && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Se muestran únicamente medicamentos activos cuyo
          stock utilizable es menor o igual al mínimo.
          Este filtro tiene prioridad sobre el estado elegido.
        </p>
      )}

      <p
        role="status"
        className="mt-5 text-sm text-slate-600 dark:text-slate-300"
      >
        {datos.count} medicamento
        {datos.count === 1 ? "" : "s"} encontrado
        {datos.count === 1 ? "" : "s"}.
      </p>

      {datos.results.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold">
            No hay medicamentos para mostrar
          </h2>

          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Probá cambiar la búsqueda o los filtros.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Medicamentos y stock utilizable
            </caption>

            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Medicamento
                </th>
                <th scope="col" className="px-4 py-3">
                  Laboratorio
                </th>
                <th scope="col" className="px-4 py-3">
                  Presentación
                </th>
                <th scope="col" className="px-4 py-3">
                  Stock utilizable
                </th>
                <th scope="col" className="px-4 py-3">
                  Mínimo
                </th>
                <th scope="col" className="px-4 py-3">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {datos.results.map((medicamento) => {
                const stockBajo =
                  medicamento.activo &&
                  medicamento.stock_utilizable <=
                    medicamento.stock_minimo;

                return (
                  <tr
                    key={medicamento.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/medicamentos/${medicamento.id}`}
                        className="font-semibold text-teal-700 hover:underline dark:text-teal-300"
                      >
                        {medicamento.nombre}
                      </Link>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {[
                          medicamento.principio_activo,
                          medicamento.concentracion,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Sin detalle"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      {medicamento.laboratorio || "Sin registrar"}
                    </td>

                    <td className="px-4 py-4">
                      {medicamento.presentacion || "Sin registrar"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-semibold">
                        {medicamento.stock_utilizable}
                      </span>

                      {stockBajo && (
                        <span className="ml-2 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          Stock bajo
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {medicamento.stock_minimo}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          medicamento.activo
                            ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {medicamento.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <nav
        aria-label="Paginación de medicamentos"
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

      <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
        El stock utilizable suma las existencias de lotes
        activos con vencimiento igual o posterior a hoy.
      </p>
    </>
  );
}

export default function MedicamentosPage(props: Props) {
  return (
    <main className="text-slate-900 dark:text-slate-100">
      <h1 className="text-3xl font-bold">Medicamentos</h1>

      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Consultá el catálogo y las existencias disponibles.
      </p>

      <Suspense
        fallback={
          <p
            role="status"
            className="mt-6 text-slate-600 dark:text-slate-300"
          >
            Cargando medicamentos...
          </p>
        }
      >
        <MedicamentosContenido {...props} />
      </Suspense>
    </main>
  );
}