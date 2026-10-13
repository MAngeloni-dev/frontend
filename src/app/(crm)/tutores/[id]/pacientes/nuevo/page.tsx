import Link from "next/link";
import { notFound } from "next/navigation";

import PacienteForm from "@/components/PacienteForm";
import { djangoGet } from "@/lib/django";

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

export default async function NuevoPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <main>
        <h1 className="text-2xl font-bold">Tutor inactivo</h1>
        <p className="mt-3 text-slate-600">
          Reactivá al tutor antes de agregar un paciente.
        </p>
        <Link
          href={`/tutores/${id}`}
          className="mt-4 inline-block text-teal-700 hover:underline"
        >
          Volver a la ficha
        </Link>
      </main>
    );
  }

  const [especies, razas] = await Promise.all([
    djangoGet<Especie[]>("/api/especies/", returnTo),
    djangoGet<Raza[]>("/api/razas/", returnTo),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-bold">Agregar paciente</h1>
      <p className="mt-2 text-slate-600">
        Completá los datos del animal.
      </p>

      <PacienteForm
        tutor={tutor}
        especies={especies}
        razas={razas}
      />
    </main>
  );
}