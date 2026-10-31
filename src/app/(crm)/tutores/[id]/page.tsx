import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import TutorEstadoButton from "@/components/TutorEstadoButton";
import { djangoGet } from "@/lib/django";

type Tutor = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  direccion: string;
  observaciones: string;
  activo: boolean;
};

type Paciente = {
  id: number;
  nombre: string;
  sexo: string;
  activo: boolean;
  especie_detalle: {
    nombre: string;
  };
  raza_detalle: {
    nombre: string;
  } | null;
};

type PacientesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Paciente[];
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

type UsuarioActual = {
  id: number;
  username: string;
  rol: "ADMINISTRADOR" | "VETERINARIO" | "RECEPCION";
};

const enlaceClass =
  "text-sm font-medium text-teal-700 hover:underline dark:text-teal-300";

const tarjetaClass =
  "rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

function estadoClass(activo: boolean) {
  return activo
    ? "bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-200"
    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200";
}

const sexos: Record<string, string> = {
  MACHO: "Macho",
  HEMBRA: "Hembra",
  DESCONOCIDO: "Sexo desconocido",
};

async function TutorDetalleContenido({
  params,
  searchParams,
}: Props) {
  await connection();

  const { id } = await params;
  const filtros = await searchParams;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const requestedPage =
    typeof filtros.page === "string"
      ? Number(filtros.page)
      : 1;

  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const returnTo = `/tutores/${id}?page=${page}`;

  const [tutor, usuario, pacientes] = await Promise.all([
    djangoGet<Tutor>(
      `/api/tutores/${id}/`,
      returnTo,
    ),
    djangoGet<UsuarioActual>(
      "/api/usuarios/me/",
      returnTo,
    ),
    djangoGet<PacientesResponse>(
      `/api/pacientes/?tutor=${id}&page=${page}`,
      returnTo,
    ),
  ]);

  const puedeCambiarEstado =
    usuario.rol === "ADMINISTRADOR" ||
    usuario.rol === "VETERINARIO";

  const datos = [
    ["DNI", tutor.dni],
    ["Teléfono", tutor.telefono],
    ["Email", tutor.email],
    ["Dirección", tutor.direccion],
  ];

  return (
    <main className="text-slate-900 dark:text-slate-100">
      <Link href="/tutores" className={enlaceClass}>
        ← Volver a tutores
      </Link>

      <header className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="break-words text-3xl font-bold">
            {tutor.nombre} {tutor.apellido}
          </h1>

          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${estadoClass(tutor.activo)}`}
          >
            {tutor.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <Link
            href={`/tutores/${tutor.id}/editar`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Editar tutor
          </Link>

          {puedeCambiarEstado && (
            <TutorEstadoButton
              tutorId={tutor.id}
              nombre={`${tutor.nombre} ${tutor.apellido}`}
              activo={tutor.activo}
            />
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className={tarjetaClass}>
          <h2 className="text-lg font-semibold">
            Datos del tutor
          </h2>

          <dl className="mt-5 space-y-5">
            {datos.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-slate-500 dark:text-slate-400">
                  {label}
                </dt>

                <dd className="mt-1 break-words font-medium">
                  {value || "Sin registrar"}
                </dd>
              </div>
            ))}
          </dl>

          {tutor.observaciones && (
            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Observaciones
              </h3>

              <p className="mt-2 whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200">
                {tutor.observaciones}
              </p>
            </div>
          )}
        </section>

        <section className={`${tarjetaClass} lg:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">
              Pacientes asociados ({pacientes.count})
            </h2>

            {tutor.activo && (
              <Link
                href={`/tutores/${tutor.id}/pacientes/nuevo`}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                Agregar paciente
              </Link>
            )}
          </div>

          {pacientes.results.length === 0 ? (
            <p className="mt-5 text-slate-600 dark:text-slate-300">
              Este tutor todavía no tiene pacientes registrados.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {pacientes.results.map((paciente) => (
                <li
                  key={paciente.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold">
                      <Link
                        href={`/pacientes/${paciente.id}`}
                        className="text-teal-700 hover:underline dark:text-teal-300"
                      >
                        {paciente.nombre}
                      </Link>
                    </h3>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {paciente.especie_detalle.nombre}
                      {" · "}
                      {paciente.raza_detalle?.nombre ||
                        "Raza sin registrar"}
                      {" · "}
                      {sexos[paciente.sexo] || paciente.sexo}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${estadoClass(paciente.activo)}`}
                  >
                    {paciente.activo ? "Activo" : "Inactivo"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {(pacientes.previous || pacientes.next) && (
            <nav
              aria-label="Paginación de pacientes"
              className="mt-6 flex items-center justify-between gap-3"
            >
              <div>
                {pacientes.previous && page > 1 && (
                  <Link
                    href={`/tutores/${id}?page=${page - 1}`}
                    className={enlaceClass}
                  >
                    Anterior
                  </Link>
                )}
              </div>

              <span className="text-sm text-slate-500 dark:text-slate-400">
                Página {page}
              </span>

              <div>
                {pacientes.next && (
                  <Link
                    href={`/tutores/${id}?page=${page + 1}`}
                    className={enlaceClass}
                  >
                    Siguiente
                  </Link>
                )}
              </div>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

function TutorDetalleLoading() {
  return (
    <main aria-busy="true">
      <p
        role="status"
        className="text-slate-600 dark:text-slate-300"
      >
        Cargando ficha del tutor...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 grid animate-pulse gap-6 lg:grid-cols-3"
      >
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 lg:col-span-2" />
      </div>
    </main>
  );
}

export default function TutorDetallePage(props: Props) {
  return (
    <Suspense fallback={<TutorDetalleLoading />}>
      <TutorDetalleContenido {...props} />
    </Suspense>
  );
}