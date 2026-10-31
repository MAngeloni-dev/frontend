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
    estilo:
      "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
  CONFIRMADO: {
    nombre: "Confirmado",
    estilo:
      "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  },
  ATENDIDO: {
    nombre: "Atendido",
    estilo:
      "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  },
  CANCELADO: {
    nombre: "Cancelado",
    estilo:
      "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
  },
};

const tarjetaClass =
  "rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const etiquetaClass =
  "text-sm text-slate-500 dark:text-slate-400";

const enlaceClass =
  "text-teal-700 hover:underline dark:text-teal-300";

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

          <p className="mt-2 break-words text-slate-600 dark:text-slate-300">
            {turno.paciente_nombre} · {turno.motivo}
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={tarjetaClass}>
          <h2 className="text-lg font-semibold">
            Datos del turno
          </h2>

          <dl className="mt-5 space-y-5">
            <div>
              <dt className={etiquetaClass}>
                Paciente
              </dt>
              <dd className="mt-1 break-words font-medium">
                <Link
                  href={`/pacientes/${turno.paciente}`}
                  className={enlaceClass}
                >
                  {turno.paciente_nombre}
                </Link>
              </dd>
            </div>

            <div>
              <dt className={etiquetaClass}>
                Profesional
              </dt>
              <dd className="mt-1 break-words font-medium">
                {turno.veterinario_nombre}
              </dd>
            </div>

            <div>
              <dt className={etiquetaClass}>
                Inicio
              </dt>
              <dd className="mt-1 font-medium">
                <time dateTime={turno.inicio}>
                  {mostrarFechaHora(turno.inicio)}
                </time>
              </dd>
            </div>

            <div>
              <dt className={etiquetaClass}>
                Finalización
              </dt>
              <dd className="mt-1 font-medium">
                <time dateTime={turno.fin}>
                  {mostrarFechaHora(turno.fin)}
                </time>
              </dd>
            </div>

            <div>
              <dt className={etiquetaClass}>
                Motivo
              </dt>
              <dd className="mt-1 break-words font-medium">
                {turno.motivo}
              </dd>
            </div>
          </dl>

          <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
            Horarios de Argentina (UTC−03:00).
          </p>
        </section>

        <section className={tarjetaClass}>
          <h2 className="text-lg font-semibold">
            Observaciones
          </h2>

          <p className="mt-4 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">
            {turno.observaciones ||
              "No hay observaciones registradas."}
          </p>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Registrado el{" "}
            <time dateTime={turno.fecha_creacion}>
              {mostrarFechaHora(turno.fecha_creacion)}
            </time>
            .
          </p>
        </section>

        <section className={`${tarjetaClass} lg:col-span-2`}>
          <h2 className="text-lg font-semibold">
            Acciones del turno
          </h2>

          {(turno.estado === "PENDIENTE" ||
            turno.estado === "CONFIRMADO") && (
            <Link
              href={`/turnos/${turno.id}/editar`}
              className="mt-4 inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
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
      <p
        role="status"
        className="mt-5 text-slate-600 dark:text-slate-300"
      >
        Cargando los datos del turno...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 grid animate-pulse gap-6 lg:grid-cols-2"
      >
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function TurnoDetallePage(props: Props) {
  return (
    <main className="text-slate-900 dark:text-slate-100">
      <Link
        href="/turnos"
        className={`text-sm font-medium ${enlaceClass}`}
      >
        ← Volver al listado de turnos
      </Link>

      <Suspense fallback={<TurnoDetalleLoading />}>
        <TurnoDetalleContenido {...props} />
      </Suspense>
    </main>
  );
}