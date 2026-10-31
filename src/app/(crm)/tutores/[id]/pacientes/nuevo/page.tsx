import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import PacienteForm from "@/components/PacienteForm";
import { djangoGet } from "@/lib/django";
import { djangoGetAll } from "@/lib/django-list";

type Tutor = {
  id: number;
  nombre: string;
  apellido: string;
  activo: boolean;
};

type Especie = {
  id: number;
  nombre: string;
};

type Raza = {
  id: number;
  nombre: string;
  especie: number;
};

type Props = {
  params: Promise<{ id: string }>;
};

async function NuevoPacienteContenido({ params }: Props) {
  await connection();

  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const returnTo = `/tutores/${id}/pacientes/nuevo`;

  const tutor = await djangoGet<Tutor>(
    `/api/tutores/${id}/`,
    returnTo,
  );

  if (!tutor.activo) {
    return (
      <section className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
        <h1 className="text-2xl font-bold">
          Tutor inactivo
        </h1>

        <p className="mt-3">
          El tutor debe estar activo antes de agregar un paciente.
        </p>

        <Link
          href={`/tutores/${id}`}
          className="mt-4 inline-block font-medium underline underline-offset-4"
        >
          Volver a la ficha
        </Link>
      </section>
    );
  }

  const [especies, razas] = await Promise.all([
    djangoGetAll<Especie>("/api/especies/", returnTo),
    djangoGetAll<Raza>("/api/razas/", returnTo),
  ]);

  return (
    <>
      <Link
        href={`/tutores/${tutor.id}`}
        className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
      >
        ← Volver a la ficha del tutor
      </Link>

      <h1 className="mt-5 text-3xl font-bold">
        Agregar paciente
      </h1>

      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Completá los datos del animal.
      </p>

      <PacienteForm
        tutor={tutor}
        especies={especies}
        razas={razas}
      />
    </>
  );
}

function NuevoPacienteLoading() {
  return (
    <div aria-busy="true">
      <h1 className="text-3xl font-bold">
        Agregar paciente
      </h1>

      <p
        role="status"
        className="mt-2 text-slate-600 dark:text-slate-300"
      >
        Cargando tutor, especies y razas…
      </p>

      <div
        aria-hidden="true"
        className="mt-6 h-96 max-w-3xl animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
      />
    </div>
  );
}

export default function NuevoPacientePage(props: Props) {
  return (
    <main className="text-slate-900 dark:text-slate-100">
      <Suspense fallback={<NuevoPacienteLoading />}>
        <NuevoPacienteContenido {...props} />
      </Suspense>
    </main>
  );
}