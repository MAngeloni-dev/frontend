import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import TurnoForm from "@/components/TurnosForm";
import { djangoGet } from "@/lib/django";
import { djangoGetAll } from "@/lib/django-list";

type Props = {
  params: Promise<{ id: string }>;
};

type Turno = {
  id: number;
  paciente: number;
  veterinario: number;
  veterinario_nombre: string;
  inicio: string;
  fin: string;
  motivo: string;
  observaciones: string;
  estado: "PENDIENTE" | "CONFIRMADO" | "ATENDIDO" | "CANCELADO";
};

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

async function EditarTurnoContenido({ params }: Props) {
  await connection();

  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const returnTo = `/turnos/${id}/editar`;

  const turno = await djangoGet<Turno>(
    `/api/turnos/${id}/`,
    returnTo,
  );

  if (
    turno.estado !== "PENDIENTE" &&
    turno.estado !== "CONFIRMADO"
  ) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Este turno no se puede editar
        </h2>

        <p className="mt-2 text-slate-600">
          Los turnos atendidos o cancelados conservan su
          historial sin modificaciones.
        </p>
      </section>
    );
  }

  const [pacientes, profesionales, pacienteActual] =
    await Promise.all([
      djangoGetAll<Paciente>("/api/pacientes/", returnTo),
      djangoGetAll<Profesional>(
        "/api/usuarios/profesionales/",
        returnTo,
      ),
      djangoGet<Paciente>(
        `/api/pacientes/${turno.paciente}/`,
        returnTo,
      ),
    ]);

  const pacientesDisponibles = pacientes.filter(
    (paciente) =>
      paciente.activo && paciente.tutor_detalle.activo,
  );

  // Conservamos la selección actual aunque haya sido
  // desactivada después de registrar el turno.
  if (
    !pacientesDisponibles.some(
      (paciente) => paciente.id === pacienteActual.id,
    )
  ) {
    pacientesDisponibles.push(pacienteActual);
  }

  const profesionalesDisponibles = [...profesionales];

  if (
    !profesionalesDisponibles.some(
      (profesional) => profesional.id === turno.veterinario,
    )
  ) {
    profesionalesDisponibles.push({
      id: turno.veterinario,
      nombre: `${turno.veterinario_nombre} (no disponible para nuevas reservas)`,
    });
  }

  const opcionesPacientes = pacientesDisponibles
    .map((paciente) => ({
      id: paciente.id,
      nombre:
        paciente.activo && paciente.tutor_detalle.activo
          ? paciente.nombre
          : `${paciente.nombre} (paciente o tutor inactivo)`,
      tutor_detalle: {
        nombre: paciente.tutor_detalle.nombre,
        apellido: paciente.tutor_detalle.apellido,
      },
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const seleccionActualInactiva =
    !pacienteActual.activo ||
    !pacienteActual.tutor_detalle.activo ||
    !profesionales.some(
      (profesional) => profesional.id === turno.veterinario,
    );

  return (
    <>
      <p className="mt-2 text-slate-600">
        Modificá los datos o reprogramá el horario del turno
        #{turno.id}.
      </p>

      {seleccionActualInactiva && (
        <p className="mt-5 max-w-3xl rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          El paciente, su tutor o el profesional actual ya no
          están activos. Para reprogramar, seleccioná un
          paciente con tutor activo y un profesional disponible.
        </p>
      )}

      <TurnoForm
        key={turno.id}
        turno={turno}
        pacientes={opcionesPacientes}
        profesionales={profesionalesDisponibles}
      />
    </>
  );
}

export default function EditarTurnoPage({ params }: Props) {
  return (
    <main>
      <Suspense
        fallback={
          <p role="status" className="text-slate-600">
            Cargando el turno...
          </p>
        }
      >
        <EditarTurnoPagina params={params} />
      </Suspense>
    </main>
  );
}

async function EditarTurnoPagina({ params }: Props) {
  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  return (
    <>
      <Link
        href={`/turnos/${id}`}
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Volver a la ficha del turno
      </Link>

      <h1 className="mt-5 text-3xl font-bold">
        Editar turno
      </h1>

      <EditarTurnoContenido params={params} />
    </>
  );
}