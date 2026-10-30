import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import MedicamentoForm from "@/components/MedicamentoForm";
import { djangoGet } from "@/lib/django";
import { djangoGetAll } from "@/lib/django-list";

type UsuarioActual = {
  rol: "ADMINISTRADOR" | "VETERINARIO" | "RECEPCION";
};

type Especie = {
  id: number;
  nombre: string;
  activo: boolean;
};

async function NuevoMedicamentoContenido() {
  await connection();

  const returnTo = "/medicamentos/nuevo";

  const usuario = await djangoGet<UsuarioActual>(
    "/api/usuarios/me/",
    returnTo,
  );

  const puedeCrear =
    usuario.rol === "ADMINISTRADOR" ||
    usuario.rol === "VETERINARIO";

  if (!puedeCrear) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          No tenés permiso para crear medicamentos
        </h2>

        <p className="mt-2 text-slate-600">
          Esta operación está disponible para administrador
          y veterinario.
        </p>
      </section>
    );
  }

  const especies = await djangoGetAll<Especie>(
    "/api/especies/",
    returnTo,
  );

  const especiesDisponibles = especies
    .filter((especie) => especie.activo)
    .map((especie) => ({
      id: especie.id,
      nombre: especie.nombre,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <MedicamentoForm especies={especiesDisponibles} />
  );
}

export default function NuevoMedicamentoPage() {
  return (
    <main>
      <Link
        href="/medicamentos"
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Volver a medicamentos
      </Link>

      <h1 className="mt-5 text-3xl font-bold">
        Agregar medicamento
      </h1>

      <p className="mt-2 text-slate-600">
        Completá los datos del medicamento para incorporarlo
        al catálogo.
      </p>

      <Suspense
        fallback={
          <p role="status" className="mt-6 text-slate-600">
            Cargando formulario...
          </p>
        }
      >
        <NuevoMedicamentoContenido />
      </Suspense>
    </main>
  );
}