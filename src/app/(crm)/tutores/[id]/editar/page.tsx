import { Suspense } from "react";
import { notFound } from "next/navigation";

import TutorForm from "@/components/TutorForm";
import { djangoGet } from "@/lib/django";
import type { TutorFormValues } from "@/lib/tutor-schema";

type Tutor = TutorFormValues & {
  id: number;
};

type Props = {
  params: Promise<{ id: string }>;
};

async function EditarTutorContenido({ params }: Props) {
  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const tutor = await djangoGet<Tutor>(
    `/api/tutores/${id}/`,
    `/tutores/${id}/editar`,
  );

  return (
    <>
      <p className="mt-2 text-slate-600">
        Actualizá los datos de {tutor.nombre} {tutor.apellido}.
      </p>

      <TutorForm key={tutor.id} tutor={tutor} />
    </>
  );
}

function FormularioLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="mt-2 text-slate-600">
        Cargando los datos del tutor...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 h-96 max-w-3xl animate-pulse rounded-2xl bg-slate-200"
      />
    </div>
  );
}

export default function EditarTutorPage({ params }: Props) {
  return (
    <main>
      <h1 className="text-3xl font-bold">Editar tutor</h1>

      <Suspense fallback={<FormularioLoading />}>
        <EditarTutorContenido params={params} />
      </Suspense>
    </main>
  );
}