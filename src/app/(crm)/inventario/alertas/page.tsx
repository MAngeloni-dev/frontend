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
                className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
                <div>
                    <label
                        htmlFor="vista"
                        className="block text-sm font-medium"
                    >
                        Tipo de alerta
                    </label>

                    <select
                        id="vista"
                        name="vista"
                        defaultValue={vista}
                        className="mt-1 rounded-lg border border-slate-300 bg-white p-3"
                    >
                        <option value="proximos">Próximos a vencer</option>
                        <option value="vencidos">Vencidos</option>
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="dias"
                        className="block text-sm font-medium"
                    >
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
                        className="mt-1 w-28 rounded-lg border border-slate-300 p-3"
                    />
                </div>

                <button
                    type="submit"
                    className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800"
                >
                    Consultar
                </button>
            </form>

            <p role="status" className="mt-5 text-sm text-slate-600">
                {datos.count} lote{datos.count === 1 ? "" : "s"}{" "}
                {vista === "proximos"
                    ? `con existencias y vencimiento entre hoy y los próximos ${dias} días.`
                    : "vencidos con existencias pendientes de descarte."}
            </p>

            {vista === "vencidos" && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                    No utilices estas existencias. Registrá su descarte
                    mediante un ajuste de salida. El plazo en días no
                    modifica esta consulta.
                </p>
            )}

            {datos.results.length === 0 ? (
                <p className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
                    No hay lotes que coincidan con esta alerta.
                </p>
            ) : (
                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">
                            Lotes con alertas de vencimiento
                        </caption>

                        <thead className="border-b border-slate-200 bg-slate-50">
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

                        <tbody className="divide-y divide-slate-100">
                            {datos.results.map((lote) => (
                                <tr key={lote.id}>
                                    <td className="px-4 py-4">
                                        <Link
                                            href={`/medicamentos/${lote.medicamento}`}
                                            className="font-medium text-teal-700 hover:underline"
                                        >
                                            {lote.medicamento_nombre}
                                        </Link>
                                    </td>

                                    <td className="px-4 py-4">
                                        {lote.numero}
                                    </td>

                                    <td className="px-4 py-4">
                                        <span
                                            className={
                                                vista === "vencidos"
                                                    ? "font-medium text-red-700"
                                                    : "font-medium text-amber-800"
                                            }
                                        >
                                            {mostrarFecha(lote.fecha_vencimiento)}
                                        </span>
                                    </td>

                                    <td className="px-4 py-4 font-semibold">
                                        {lote.cantidad_actual}
                                    </td>

                                    <td className="px-4 py-4">
                                        {lote.activo ? "Activo" : "Inactivo"}
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
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
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
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
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
        <main>
            <h1 className="text-3xl font-bold">
                Alertas de inventario
            </h1>

            <Link
                href="/medicamentos?stock=bajo"
                className="mt-4 inline-block rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
                Consultar medicamentos con stock bajo
            </Link>

            <Suspense
                fallback={
                    <p role="status" className="mt-6 text-slate-600">
                        Cargando alertas...
                    </p>
                }
            >
                <AlertasContenido {...props} />
            </Suspense>
        </main>
    );
}