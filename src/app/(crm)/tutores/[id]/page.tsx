import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import TutorEstadoButton from "@/components/TutorEstadoButton";
import TutorDetalleLoading from "./loading";
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
  searchParams: Promise<{ page?: string }>;
};

type UsuarioActual = {
  id: number;
  username: string;
  rol: "ADMINISTRADOR" | "VETERINARIO" | "RECEPCION";
};

async function TutorDetalleContenido({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const filtros = await searchParams;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const requestedPage = Number(filtros.page || "1");
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const returnTo = `/tutores/${id}?page=${page}`;

  const tutor = await djangoGet<Tutor>(
    `/api/tutores/${id}/`,
    returnTo,
  );

  const usuario = await djangoGet<UsuarioActual>(
    "/api/usuarios/me/",
    returnTo,
  );

  const puedeCambiarEstado =
    usuario.rol === "ADMINISTRADOR" ||
    usuario.rol === "VETERINARIO";

  const pacientes = await djangoGet<PacientesResponse>(
    `/api/pacientes/?tutor=${id}&page=${page}`,
    returnTo,
  );

  const datos = [
    ["DNI", tutor.dni],
    ["Teléfono", tutor.telefono],
    ["Email", tutor.email],
    ["Dirección", tutor.direccion],
  ];

  const sexos: Record<string, string> = {
    MACHO: "Macho",
    HEMBRA: "Hembra",
    DESCONOCIDO: "Sexo desconocido",
  };

  return (
    <main>
      <Link
        href="/tutores"
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Volver a tutores
      </Link>

      <header className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">
          {tutor.nombre} {tutor.apellido}
        </h1>

        <span
          className={`rounded-full px-3 py-1 text-sm ${
            tutor.activo
              ? "bg-teal-50 text-teal-700"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {tutor.activo ? "Activo" : "Inactivo"}
        </span>
        <Link
          href={`/tutores/${tutor.id}/editar`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
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
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Datos del tutor
          </h2>

          <dl className="mt-5 space-y-5">
            {datos.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 break-words font-medium">
                  {value || "Sin registrar"}
                </dd>
              </div>
            ))}
          </dl>

          {tutor.observaciones && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-medium text-slate-500">
                Observaciones
              </h3>
              <p className="mt-2 whitespace-pre-wrap">
                {tutor.observaciones}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">
                    Pacientes asociados ({pacientes.count})
                </h2>

                {tutor.activo && (
                    <Link
                    href={`/tutores/${tutor.id}/pacientes/nuevo`}
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                    >
                    Agregar paciente
                    </Link>
                )}
            </div>

          {pacientes.results.length === 0 ? (
            <p className="mt-5 text-slate-600">
              Este tutor todavía no tiene pacientes registrados.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {pacientes.results.map((paciente) => (
                <li
                  key={paciente.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <h3 className="font-semibold">
                      <Link
                        href={`/pacientes/${paciente.id}`}
                        className="text-teal-700 hover:underline"
                      >
                        {paciente.nombre}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {paciente.especie_detalle.nombre}
                      {" · "}
                      {paciente.raza_detalle?.nombre ||
                        "Raza sin registrar"}
                      {" · "}
                      {sexos[paciente.sexo] || paciente.sexo}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      paciente.activo
                        ? "bg-teal-50 text-teal-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
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
                {pacientes.previous && (
                  <Link
                    href={`/tutores/${id}?page=${page - 1}`}
                    className="text-sm font-medium text-teal-700 hover:underline"
                  >
                    Anterior
                  </Link>
                )}
              </div>

              <span className="text-sm text-slate-500">
                Página {page}
              </span>

              <div>
                {pacientes.next && (
                  <Link
                    href={`/tutores/${id}?page=${page + 1}`}
                    className="text-sm font-medium text-teal-700 hover:underline"
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

export default function TutorDetallePage(props: Props) {
  return (
    <Suspense fallback={<TutorDetalleLoading />}>
      <TutorDetalleContenido {...props} />
    </Suspense>
  );
}