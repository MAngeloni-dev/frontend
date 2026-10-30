import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import PacienteForm from "@/components/PacienteForm";
import { djangoGet } from "@/lib/django";
import { djangoGetAll } from "@/lib/django-list";

type Especie = {
  id: number;
  nombre: string;
};

type Raza = {
  id: number;
  nombre: string;
  especie: number;
};

type Paciente = {
  id: number;
  nombre: string;
  especie: number;
  especie_detalle: Especie;
  raza: number | null;
  raza_detalle: Raza | null;
  sexo: "MACHO" | "HEMBRA" | "DESCONOCIDO";
  color: string;
  fecha_nacimiento: string | null;
  nacimiento_estimado: boolean;
  castrado: "SI" | "NO" | "DESCONOCIDO";
  microchip: string | null;
  observaciones: string;
  tutor_detalle: {
    id: number;
    nombre: string;
    apellido: string;
  };
};

type Props = {
  params: Promise<{ id: string }>;
};

async function EditarPacienteContenido({ params }: Props) {
  await connection();

  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const returnTo = `/pacientes/${id}/editar`;

  const paciente = await djangoGet<Paciente>(
    `/api/pacientes/${id}/`,
    returnTo,
  );

  const [especies, razas] = await Promise.all([
    djangoGetAll<Especie>(
      "/api/especies/",
      returnTo,
    ),
    djangoGetAll<Raza>(
      "/api/razas/",
      returnTo,
    ),
  ]);

  // Conservamos la especie histórica aunque esté inactiva
  // y ya no aparezca en el catálogo de opciones activas.
  if (
    !especies.some(
      (item) => item.id === paciente.especie,
    )
  ) {
    especies.push(paciente.especie_detalle);
  }

  // Lo mismo para la raza que el paciente ya tiene asociada.
  const razaHistorica = paciente.raza_detalle;

  if (
    razaHistorica &&
    !razas.some(
      (item) => item.id === razaHistorica.id,
    )
  ) {
    razas.push(razaHistorica);
  }

  return (
    <>
      <h1 className="text-3xl font-bold">
        Editar a {paciente.nombre}
      </h1>

      <p className="mt-2 text-slate-600">
        Actualizá los datos del paciente.
      </p>

      <PacienteForm
        key={paciente.id}
        tutor={paciente.tutor_detalle}
        especies={especies}
        razas={razas}
        paciente={paciente}
      />
    </>
  );
}

function EditarPacienteLoading() {
  return (
    <div aria-busy="true">
      <h1 className="text-3xl font-bold">
        Editar paciente
      </h1>

      <p
        role="status"
        className="mt-2 text-slate-600"
      >
        Cargando los datos y catálogos…
      </p>

      <div
        aria-hidden="true"
        className="mt-6 h-96 max-w-3xl animate-pulse rounded-2xl bg-slate-200"
      />
    </div>
  );
}

export default function EditarPacientePage(props: Props) {
  return (
    <main>
      <Suspense fallback={<EditarPacienteLoading />}>
        <EditarPacienteContenido {...props} />
      </Suspense>
    </main>
  );
}