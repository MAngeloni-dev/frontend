import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import TurnoAcciones from "@/components/TurnoAcciones";
import { djangoGet } from "@/lib/django";

type EstadoTurno =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "ATENDIDO"
  | "CANCELADO";

type Turno = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  veterinario: number;
  veterinario_nombre: string;
  inicio: string;
  fin: string;
  motivo: string;
  observaciones: string;
  estado: EstadoTurno;
  fecha_creacion: string;
};

type UsuarioActual = {
  id: number;
  username: string;
  rol: "ADMINISTRADOR" | "VETERINARIO" | "RECEPCION";
};

type Props = {
  params: Promise<{ id: string }>;
};

const estados: Record<
  EstadoTurno,
  { nombre: string; estilo: string }
> = {
  PENDIENTE: {
    nombre: "Pendiente",
    estilo: "bg-amber-50 text-amber-800",
  },
  CONFIRMADO: {
    nombre: "Confirmado",
    estilo: "bg-blue-50 text-blue-800",
  },
  ATENDIDO: {
    nombre: "Atendido",
    estilo: "bg-teal-50 text-teal-800",
  },
  CANCELADO: {
    nombre: "Cancelado",
    estilo: "bg-red-50 text-red-800",
  },
};

function mostrarFechaHora(valor: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(valor));
}

async function TurnoDetalleContenido({ params }: Props) {
  await connection();

  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const returnTo = `/turnos/${id}`;

  const [turno, usuario] = await Promise.all([
    djangoGet<Turno>(`/api/turnos/${id}/`, returnTo),
    djangoGet<UsuarioActual>("/api/usuarios/me/", returnTo),
  ]);

  const estado = estados[turno.estado];

  return (
    <>
      <header className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">
              Turno #{turno.id}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${estado.estilo}`}
            >
              {estado.nombre}
            </span>
          </div>

          <p className="mt-2 text-slate-600">
            {turno.paciente_nombre} · {turno.motivo}
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Datos del turno
          </h2>

          <dl className="mt-5 space-y-5">
            <div>
              <dt className="text-sm text-slate-500">
                Paciente
              </dt>
              <dd className="mt-1 font-medium">
                <Link
                  href={`/pacientes/${turno.paciente}`}
                  className="text-teal-700 hover:underline"
                >
                  {turno.paciente_nombre}
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Profesional
              </dt>
              <dd className="mt-1 font-medium">
                {turno.veterinario_nombre}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Inicio
              </dt>
              <dd className="mt-1 font-medium">
                {mostrarFechaHora(turno.inicio)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Finalización
              </dt>
              <dd className="mt-1 font-medium">
                {mostrarFechaHora(turno.fin)}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Motivo
              </dt>
              <dd className="mt-1 break-words font-medium">
                {turno.motivo}
              </dd>
            </div>
          </dl>

          <p className="mt-5 text-xs text-slate-500">
            Horarios de Argentina (UTC−03:00).
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Observaciones
          </h2>

          <p className="mt-4 whitespace-pre-wrap break-words text-slate-600">
            {turno.observaciones ||
              "No hay observaciones registradas."}
          </p>

          <p className="mt-6 text-sm text-slate-500">
            Registrado el{" "}
            {mostrarFechaHora(turno.fecha_creacion)}.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">
            Acciones del turno
          </h2>

          {(turno.estado === "PENDIENTE" ||
            turno.estado === "CONFIRMADO") && (
            <Link
              href={`/turnos/${turno.id}/editar`}
              className="mt-4 inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Editar o reprogramar
            </Link>
          )}

          <div className="mt-5">
            <TurnoAcciones
              key={`${turno.id}-${turno.estado}`}
              turnoId={turno.id}
              estado={turno.estado}
              rol={usuario.rol}
            />
          </div>
        </section>
      </div>
    </>
  );
}

function TurnoDetalleLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="mt-5 text-slate-600">
        Cargando los datos del turno...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 grid animate-pulse gap-6 lg:grid-cols-2"
      >
        <div className="h-80 rounded-2xl bg-slate-200" />
        <div className="h-80 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function TurnoDetallePage(props: Props) {
  return (
    <main>
      <Link
        href="/turnos"
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Volver al listado de turnos
      </Link>

      <Suspense fallback={<TurnoDetalleLoading />}>
        <TurnoDetalleContenido {...props} />
      </Suspense>
    </main>
  );
}