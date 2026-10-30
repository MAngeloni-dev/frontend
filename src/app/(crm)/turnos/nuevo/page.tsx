import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import TurnoForm from "@/components/TurnosForm";
import { djangoGetAll } from "@/lib/django-list";

type Paciente = {
  id: number;
  nombre: string;
  activo: boolean;
  tutor_detalle: {
    nombre: string;
    apellido: string;
    activo: boolean;
  };
};

type Profesional = {
  id: number;
  nombre: string;
};

async function NuevoTurnoContenido() {
  await connection();

  const returnTo = "/turnos/nuevo";

  const [pacientes, profesionales] = await Promise.all([
    djangoGetAll<Paciente>("/api/pacientes/", returnTo),
    djangoGetAll<Profesional>(
      "/api/usuarios/profesionales/",
      returnTo,
    ),
  ]);

  const pacientesDisponibles = pacientes
    .filter(
      (paciente) =>
        paciente.activo && paciente.tutor_detalle.activo,
    )
    .map((paciente) => ({
      id: paciente.id,
      nombre: paciente.nombre,
      tutor_detalle: {
        nombre: paciente.tutor_detalle.nombre,
        apellido: paciente.tutor_detalle.apellido,
      },
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <TurnoForm
      pacientes={pacientesDisponibles}
      profesionales={profesionales}
    />
  );
}

function NuevoTurnoLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="mt-6 text-slate-600">
        Cargando pacientes y profesionales...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 h-96 max-w-3xl animate-pulse rounded-2xl bg-slate-200"
      />
    </div>
  );
}

export default function NuevoTurnoPage() {
  return (
    <main>
      <Link
        href="/turnos"
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Volver al listado de turnos
      </Link>

      <h1 className="mt-5 text-3xl font-bold">
        Agendar turno
      </h1>

      <p className="mt-2 text-slate-600">
        Seleccioná el paciente, el profesional y el horario
        de atención.
      </p>

      <Suspense fallback={<NuevoTurnoLoading />}>
        <NuevoTurnoContenido />
      </Suspense>
    </main>
  );
}