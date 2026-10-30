import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import LoteForm from "@/components/LoteForm";
import { djangoGet } from "@/lib/django";

type Props = {
  params: Promise<{ id: string }>;
};

type UsuarioActual = {
  rol: "ADMINISTRADOR" | "VETERINARIO" | "RECEPCION";
};

type Medicamento = {
  id: number;
  nombre: string;
  activo: boolean;
};

async function NuevoLoteContenido({ params }: Props) {
  await connection();

  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const returnTo = `/medicamentos/${id}/lotes/nuevo`;

  const usuario = await djangoGet<UsuarioActual>(
    "/api/usuarios/me/",
    returnTo,
  );

  const puedeCrear =
    usuario.rol === "ADMINISTRADOR" ||
    usuario.rol === "VETERINARIO";

  if (!puedeCrear) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold">
          No tenés permiso para crear lotes
        </h1>

        <p className="mt-2 text-slate-600">
          Esta operación está disponible para administrador
          y veterinario.
        </p>

        <Link
          href={`/medicamentos/${id}`}
          className="mt-4 inline-block text-teal-700 hover:underline"
        >
          Volver al medicamento
        </Link>
      </section>
    );
  }

  const medicamento = await djangoGet<Medicamento>(
    `/api/medicamentos/${id}/`,
    returnTo,
  );

  return (
    <>
      <Link
        href={`/medicamentos/${medicamento.id}`}
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Volver al medicamento
      </Link>

      <h1 className="mt-5 text-3xl font-bold">
        Agregar lote
      </h1>

      {medicamento.activo ? (
        <>
          <p className="mt-2 text-slate-600">
            Registrá el número y vencimiento del lote de{" "}
            {medicamento.nombre}.
          </p>

          <LoteForm
            key={medicamento.id}
            medicamento={{
              id: medicamento.id,
              nombre: medicamento.nombre,
            }}
          />
        </>
      ) : (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-amber-50 p-4 text-amber-900"
        >
          El medicamento está inactivo. Reactivalo antes
          de agregar un lote.
        </p>
      )}
    </>
  );
}

export default function NuevoLotePage(props: Props) {
  return (
    <main>
      <Suspense
        fallback={
          <p role="status" className="text-slate-600">
            Cargando medicamento...
          </p>
        }
      >
        <NuevoLoteContenido {...props} />
      </Suspense>
    </main>
  );
}