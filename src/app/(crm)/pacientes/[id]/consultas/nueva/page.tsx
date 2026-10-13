import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import ConsultaForm from "@/components/ConsultaForm";
import { djangoGet } from "@/lib/django";

type Props = {
  params: Promise<{ id: string }>;
};

type UsuarioActual = {
  username: string;
  first_name: string;
  last_name: string;
  rol: string;
};

type Paciente = {
  id: number;
  nombre: string;
  activo: boolean;
};

async function NuevaConsultaContenido({ params }: Props) {
  await connection();

  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const returnTo = `/pacientes/${id}/consultas/nueva`;

  const usuario = await djangoGet<UsuarioActual>(
    "/api/usuarios/me/",
    returnTo,
  );

  const permitido =
    usuario.rol === "ADMINISTRADOR" ||
    usuario.rol === "VETERINARIO";

  if (!permitido) {
    return (
      <p className="mt-4 text-red-700">
        Tu rol no tiene acceso a las consultas clínicas.
      </p>
    );
  }

  const paciente = await djangoGet<Paciente>(
    `/api/pacientes/${id}/`,
    returnTo,
  );

  if (!paciente.activo) {
    return (
      <div className="mt-4">
        <p className="text-slate-600">
          Reactivá al paciente antes de registrar una nueva consulta.
        </p>
        <Link
          href={`/pacientes/${id}`}
          className="mt-4 inline-block text-teal-700 hover:underline"
        >
          Volver a la ficha
        </Link>
      </div>
    );
  }

  const profesionalNombre =
    `${usuario.first_name} ${usuario.last_name}`.trim() ||
    usuario.username;

  return (
    <ConsultaForm
      pacienteId={paciente.id}
      pacienteNombre={paciente.nombre}
      profesionalNombre={profesionalNombre}
    />
  );
}

export default function NuevaConsultaPage(props: Props) {
  return (
    <main>
      <h1 className="text-3xl font-bold">Nueva consulta</h1>

      <Suspense
        fallback={
          <p role="status" className="mt-4 text-slate-600">
            Cargando el paciente y el profesional...
          </p>
        }
      >
        <NuevaConsultaContenido {...props} />
      </Suspense>
    </main>
  );
}