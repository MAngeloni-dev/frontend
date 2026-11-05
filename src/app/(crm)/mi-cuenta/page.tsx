import { Suspense } from "react";
import { connection } from "next/server";

import MiCuentaForm from "@/components/MiCuentaForm";
import { djangoGet } from "@/lib/django";

type Usuario = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  rol: string;
  foto: string | null;
};

async function MiCuentaContenido() {
  await connection();

  const usuario = await djangoGet<Usuario>(
    "/api/usuarios/me/",
    "/mi-cuenta",
  );

  return <MiCuentaForm usuario={usuario} />;
}

export default function MiCuentaPage() {
  return (
    <main className="text-slate-900 dark:text-slate-100">
      <h1 className="text-3xl font-bold">Mi cuenta</h1>

      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Actualizá tus datos personales, tu foto y tu contraseña.
      </p>

      <Suspense
        fallback={
          <p
            role="status"
            className="mt-6 text-slate-600 dark:text-slate-300"
          >
            Cargando tu cuenta…
          </p>
        }
      >
        <MiCuentaContenido />
      </Suspense>
    </main>
  );
}