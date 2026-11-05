import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import MovimientoStockForm from "@/components/MovimientoStockForm";
import { djangoGet } from "@/lib/django";

type Props = {
  params: Promise<{ id: string }>;
};

type UsuarioActual = {
  id: number;
  rol: "ADMINISTRADOR" | "VETERINARIO" | "RECEPCION";
};

type Lote = {
  id: number;
  numero: string;
  medicamento: number;
  medicamento_nombre: string;
  cantidad_actual: number;
  fecha_vencimiento: string;
  activo: boolean;
};

type Medicamento = {
  id: number;
  activo: boolean;
};

const enlaceClass =
  "text-sm font-medium text-teal-700 hover:underline dark:text-teal-300";

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

async function NuevoMovimientoContenido({ params }: Props) {
  await connection();

  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const returnTo = `/lotes/${id}/movimientos/nuevo`;

  const usuario = await djangoGet<UsuarioActual>(
    "/api/usuarios/me/",
    returnTo,
  );

  const puedeRegistrar =
    usuario.rol === "ADMINISTRADOR" ||
    usuario.rol === "VETERINARIO";

  if (!puedeRegistrar) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
        <h2 className="text-lg font-semibold">
          No tenés permiso para registrar movimientos
        </h2>

        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Esta operación está disponible para administrador
          y veterinario.
        </p>

        <Link
          href="/medicamentos"
          className={`mt-4 inline-block ${enlaceClass}`}
        >
          Volver a medicamentos
        </Link>
      </section>
    );
  }

  const lote = await djangoGet<Lote>(
    `/api/lotes/${id}/`,
    returnTo,
  );

  const medicamento = await djangoGet<Medicamento>(
    `/api/medicamentos/${lote.medicamento}/`,
    returnTo,
  );

  const vencido =
    lote.fecha_vencimiento < fechaActualArgentina();

  const soloAjustes =
    vencido || !lote.activo || !medicamento.activo;

  return (
    <>
      <Link
        href={`/medicamentos/${lote.medicamento}`}
        className={enlaceClass}
      >
        ← Volver al medicamento
      </Link>

      <h1 className="mt-5 text-3xl font-bold">
        Registrar movimiento de stock
      </h1>

      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Registrá un ingreso, retiro o corrección de existencias.
      </p>

      <MovimientoStockForm
        key={lote.id}
        lote={lote}
        soloAjustes={soloAjustes}
      />
    </>
  );
}

export default function NuevoMovimientoPage(props: Props) {
  return (
    <main className="text-slate-900 dark:text-slate-100">
      <Suspense
        fallback={
          <p
            role="status"
            className="text-slate-600 dark:text-slate-300"
          >
            Cargando los datos del lote...
          </p>
        }
      >
        <NuevoMovimientoContenido {...props} />
      </Suspense>
    </main>
  );
}