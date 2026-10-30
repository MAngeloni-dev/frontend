import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { djangoGet } from "@/lib/django";

type Medicamento = {
  id: number;
  nombre: string;
  laboratorio: string;
  principio_activo: string;
  concentracion: string;
  presentacion: string;
  contenido_neto: string;
  unidad_contenido: string;
  codigo_barras: string | null;
  via_administracion: string;
  stock_minimo: number;
  stock_utilizable: number;
  observaciones: string;
  activo: boolean;
};

type UsuarioActual = {
  rol: "ADMINISTRADOR" | "VETERINARIO" | "RECEPCION";
};

type Lote = {
  id: number;
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
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

const vias: Record<string, string> = {
  ORAL: "Oral",
  SUBCUTANEA: "Subcutánea",
  INTRAMUSCULAR: "Intramuscular",
  INTRAVENOSA: "Intravenosa",
  TOPICA: "Tópica",
  OFTALMICA: "Oftálmica",
  OTICA: "Ótica",
  OTRA: "Otra",
};

const unidades: Record<string, string> = {
  ML: "ml",
  G: "g",
  COMPRIMIDO: "comprimidos",
  CAPSULA: "cápsulas",
  DOSIS: "dosis",
  UNIDAD: "unidades",
};

function mostrarFecha(valor: string) {
  const [anio, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${anio}`;
}

function fechaActualArgentina() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
}

async function MedicamentoContenido({
  params,
  searchParams,
}: Props) {
  await connection();

  const { id } = await params;
  const query = await searchParams;
  const paginaTexto = query.page ?? "1";

  if (
    !/^[1-9]\d*$/.test(id) ||
    typeof paginaTexto !== "string" ||
    !/^[1-9]\d*$/.test(paginaTexto) ||
    !Number.isSafeInteger(Number(paginaTexto))
  ) {
    notFound();
  }

  const pagina = Number(paginaTexto);
  const returnTo = `/medicamentos/${id}?page=${pagina}`;

  const filtros = new URLSearchParams({
    medicamento: id,
    page: String(pagina),
    ordering: "fecha_vencimiento",
  });

  const [medicamento, lotes, usuario] = await Promise.all([
    djangoGet<Medicamento>(
      `/api/medicamentos/${id}/`,
      returnTo,
    ),
    djangoGet<PaginaLotes>(
      `/api/lotes/?${filtros}`,
      returnTo,
    ),
    djangoGet<UsuarioActual>("/api/usuarios/me/", returnTo),
  ]);

  const puedeRegistrarMovimientos =
    usuario.rol === "ADMINISTRADOR" ||
    usuario.rol === "VETERINARIO";

  const hoy = fechaActualArgentina();

  const stockBajo =
    medicamento.activo &&
    medicamento.stock_utilizable <= medicamento.stock_minimo;

  const datos = [
    ["Laboratorio", medicamento.laboratorio || "Sin registrar"],
    [
      "Principio activo",
      medicamento.principio_activo || "Sin registrar",
    ],
    [
      "Concentración",
      medicamento.concentracion || "Sin registrar",
    ],
    ["Presentación", medicamento.presentacion || "Sin registrar"],
    [
      "Contenido neto",
      `${medicamento.contenido_neto} ${
        unidades[medicamento.unidad_contenido] ??
        medicamento.unidad_contenido
      }`,
    ],
    [
      "Vía de administración",
      vias[medicamento.via_administracion] ??
        medicamento.via_administracion,
    ],
    [
      "Código de barras",
      medicamento.codigo_barras || "Sin registrar",
    ],
  ];

  return (
    <>
      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">
            {medicamento.nombre}
          </h1>

          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              medicamento.activo
                ? "bg-teal-50 text-teal-700"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {medicamento.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">
            Datos del medicamento
          </h2>

          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            {datos.map(([etiqueta, valor]) => (
              <div key={etiqueta}>
                <dt className="text-sm text-slate-500">
                  {etiqueta}
                </dt>
                <dd className="mt-1 break-words font-medium">
                  {valor}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Existencias
          </h2>

          <dl className="mt-5 space-y-5">
            <div>
              <dt className="text-sm text-slate-500">
                Stock utilizable
              </dt>
              <dd className="mt-1 text-3xl font-bold">
                {medicamento.stock_utilizable}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Stock mínimo
              </dt>
              <dd className="mt-1 font-medium">
                {medicamento.stock_minimo}
              </dd>
            </div>
          </dl>

          {stockBajo && (
            <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Stock bajo: las existencias utilizables son
              menores o iguales al mínimo.
            </p>
          )}

          {!medicamento.activo && (
            <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
              Medicamento inactivo. Sus existencias no están
              habilitadas para retiros habituales.
            </p>
          )}

          <p className="mt-4 text-xs text-slate-500">
            El cálculo suma lotes activos no vencidos.
            Las cantidades representan unidades de inventario,
            no el contenido en ml o gramos.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="text-lg font-semibold">
            Observaciones
          </h2>

          <p className="mt-4 whitespace-pre-wrap break-words text-slate-600">
            {medicamento.observaciones ||
              "No hay observaciones registradas."}
          </p>
        </section>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            Lotes del medicamento
          </h2>

          {puedeRegistrarMovimientos && medicamento.activo && (
            <Link
              href={`/medicamentos/${medicamento.id}/lotes/nuevo`}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Agregar lote
            </Link>
          )}
        </div>

        <p className="mt-2 text-sm text-slate-600">
          {lotes.count} lote{lotes.count === 1 ? "" : "s"}.
          Se incluyen activos, inactivos y vencidos.
        </p>

        {lotes.results.length === 0 ? (
          <p className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            Todavía no hay lotes registrados.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Lotes, vencimientos y existencias
              </caption>

              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Número de lote
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Vencimiento
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Cantidad
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Acciones
                  </th>
                  
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {lotes.results.map((lote) => {
                  const vencido = lote.fecha_vencimiento < hoy;

                  return (
                    <tr key={lote.id}>
                      <td className="px-4 py-4 font-medium">
                        {lote.numero}
                      </td>

                      <td className="px-4 py-4">
                        {mostrarFecha(lote.fecha_vencimiento)}
                      </td>

                      <td className="px-4 py-4">
                        {lote.cantidad_actual}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              lote.activo
                                ? "bg-teal-50 text-teal-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {lote.activo ? "Activo" : "Inactivo"}
                          </span>

                          {vencido && (
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                              Vencido
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <Link
                            href={`/movimientos-stock?lote=${lote.id}`}
                            className="font-medium text-teal-700 hover:underline"
                          >
                            Ver historial
                          </Link>

                          {puedeRegistrarMovimientos && (
                            <Link
                              href={`/lotes/${lote.id}/movimientos/nuevo`}
                              className="font-medium text-teal-700 hover:underline"
                            >
                              Registrar movimiento
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <nav
          aria-label="Paginación de lotes"
          className="mt-5 flex flex-wrap items-center gap-4"
        >
          {lotes.previous && pagina > 1 && (
            <Link
              href={`/medicamentos/${id}?page=${pagina - 1}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              ← Anterior
            </Link>
          )}

          <span className="text-sm text-slate-600">
            Página {pagina}
          </span>

          {lotes.next && (
            <Link
              href={`/medicamentos/${id}?page=${pagina + 1}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Siguiente →
            </Link>
          )}
        </nav>
      </section>
    </>
  );
}

export default function MedicamentoDetallePage(props: Props) {
  return (
    <main>
      <Link
        href="/medicamentos"
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Volver a medicamentos
      </Link>

      <Suspense
        fallback={
          <p role="status" className="mt-6 text-slate-600">
            Cargando medicamento y lotes...
          </p>
        }
      >
        <MedicamentoContenido {...props} />
      </Suspense>
    </main>
  );
}