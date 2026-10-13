import { notFound } from "next/navigation";

import PacienteForm from "@/components/PacienteForm";
import { djangoGet } from "@/lib/django";

type Paciente = {
  id: number;
  nombre: string;
  especie: number;
  raza: number | null;
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

type Especie = {
  id: number;
  nombre: string;
};

type Raza = {
  id: number;
  nombre: string;
  especie: number;
};

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    djangoGet<Especie[]>("/api/especies/", returnTo),
    djangoGet<Raza[]>("/api/razas/", returnTo),
  ]);

  // Incluir las selecciones históricas si su catálogo
  // fue desactivado y ya no aparece en las listas activas.
  const detalle = await djangoGet<{
    especie_detalle: Especie;
    raza_detalle: Raza | null;
  }>(`/api/pacientes/${id}/`, returnTo);

  if (!especies.some((item) => item.id === paciente.especie)) {
    especies.push(detalle.especie_detalle);
  }

  if (
    detalle.raza_detalle &&
    !razas.some((item) => item.id === detalle.raza_detalle?.id)
  ) {
    razas.push(detalle.raza_detalle);
  }

  return (
    <main>
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
    </main>
  );
}