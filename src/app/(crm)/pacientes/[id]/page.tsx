import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { djangoGet } from "@/lib/django";
import PacienteEstadoButton from "@/components/PacienteEstadoButton";
import HistorialConsultas from "@/components/HistorialConsultas";
type Paciente = {
  id: number;
  nombre: string;
  sexo: string;
  fecha_nacimiento: string | null;
  nacimiento_estimado: boolean;
  castrado: string;
  color: string;
  microchip: string | null;
  observaciones: string;
  activo: boolean;
  tutor_detalle: {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    activo: boolean;
  };
  especie_detalle: {
    id: number;
    nombre: string;
  };
  raza_detalle: {
    id: number;
    nombre: string;
  } | null;
};

type Props = {
  params: Promise<{ id: string }>;
};

type UsuarioActual = {
  id: number;
  username: string;
  rol: "ADMINISTRADOR" | "VETERINARIO" | "RECEPCION";
};

const sexos: Record<string, string> = {
  MACHO: "Macho",
  HEMBRA: "Hembra",
  DESCONOCIDO: "Desconocido",
};

const castracion: Record<string, string> = {
  SI: "Sí",
  NO: "No",
  DESCONOCIDO: "Desconocido",
};

function mostrarFecha(fecha: string | null) {
  if (!fecha) {
    return "Sin registrar";
  }

  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

async function PacienteDetalleContenido({ params }: Props) {
  await connection();
  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const paciente = await djangoGet<Paciente>(
    `/api/pacientes/${id}/`,
    `/pacientes/${id}`,
  );

  const usuario = await djangoGet<UsuarioActual>(
  "/api/usuarios/me/",
  `/pacientes/${id}`,
  );

  const puedeCambiarEstado =
    usuario.rol === "ADMINISTRADOR" ||
    usuario.rol === "VETERINARIO";

  const tutor = paciente.tutor_detalle;

  const puedeVerHistoriaClinica =
    usuario.rol === "ADMINISTRADOR" ||
    usuario.rol === "VETERINARIO";
    
  const datos = [
    ["Especie", paciente.especie_detalle.nombre],
    ["Raza", paciente.raza_detalle?.nombre || "Sin registrar"],
    ["Sexo", sexos[paciente.sexo] || paciente.sexo],
    ["Color", paciente.color || "Sin registrar"],
    [
      "Nacimiento",
      `${mostrarFecha(paciente.fecha_nacimiento)}${
        paciente.nacimiento_estimado ? " — estimado" : ""
      }`,
    ],
    ["Castrado", castracion[paciente.castrado] || paciente.castrado],
    ["Microchip", paciente.microchip || "Sin registrar"],
  ];

  return (
    <>
      <Link
        href={`/tutores/${tutor.id}`}
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Volver a la ficha del tutor
      </Link>

      <header className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">
              {paciente.nombre}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                paciente.activo
                  ? "bg-teal-50 text-teal-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {paciente.activo ? "Activo" : "Inactivo"}
            </span>
          </div>

          <p className="mt-2 text-slate-600">
            {paciente.especie_detalle.nombre}
            {" · "}
            {paciente.raza_detalle?.nombre || "Raza sin registrar"}
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <Link
            href={`/pacientes/${paciente.id}/editar`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Editar paciente
          </Link>
          {puedeVerHistoriaClinica && paciente.activo && (
            <Link
              href={`/pacientes/${paciente.id}/consultas/nueva`}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Nueva consulta
            </Link>
          )}
          {puedeCambiarEstado && (
            <PacienteEstadoButton
              pacienteId={paciente.id}
              nombre={paciente.nombre}
              activo={paciente.activo}
            />
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">
            Datos del paciente
          </h2>

          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            {datos.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 break-words font-medium">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Tutor responsable
          </h2>

          <Link
            href={`/tutores/${tutor.id}`}
            className="mt-4 inline-block font-semibold text-teal-700 hover:underline"
          >
            {tutor.nombre} {tutor.apellido}
          </Link>

          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-sm text-slate-500">
                Teléfono
              </dt>
              <dd className="mt-1">
                {tutor.telefono || "Sin registrar"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Email
              </dt>
              <dd className="mt-1 break-words">
                {tutor.email || "Sin registrar"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">
                Estado del tutor
              </dt>
              <dd className="mt-1">
                {tutor.activo ? "Activo" : "Inactivo"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="text-lg font-semibold">
            Observaciones generales
          </h2>

          <p className="mt-4 whitespace-pre-wrap text-slate-600">
            {paciente.observaciones ||
              "No hay observaciones registradas."}
          </p>
        </section>
        {puedeVerHistoriaClinica && (
          <div className="lg:col-span-3">
            <Suspense
              fallback={
                <section
                  aria-busy="true"
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h2 className="text-xl font-semibold">
                    Historia clínica
                  </h2>

                  <p role="status" className="mt-3 text-slate-600">
                    Cargando consultas...
                  </p>
                </section>
              }
            >
              <HistorialConsultas pacienteId={paciente.id} />
            </Suspense>
          </div>
        )}
      </div>
    </>
  );
}

function PacienteDetalleLoading() {
  return (
    <div aria-busy="true">
      <h1 className="text-3xl font-bold">Ficha del paciente</h1>

      <p role="status" className="mt-2 text-slate-600">
        Cargando los datos...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 grid animate-pulse gap-6 lg:grid-cols-3"
      >
        <div className="h-72 rounded-2xl bg-slate-200 lg:col-span-2" />
        <div className="h-72 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function PacienteDetallePage(props: Props) {
  return (
    <main>
      <Suspense fallback={<PacienteDetalleLoading />}>
        <PacienteDetalleContenido {...props} />
      </Suspense>
    </main>
  );
}