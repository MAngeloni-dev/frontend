import Link from "next/link";
import type { ReactNode } from "react";

import LogoutButton from "@/components/LogoutButton";

export default function CRMLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="bg-teal-950 text-white md:fixed md:inset-y-0 md:left-0 md:w-64">
        <div className="border-b border-teal-800 px-6 py-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Veterinaria Cariñositos
          </Link>

          <p className="mt-1 text-sm text-teal-200">
            Gestión de la clínica
          </p>
        </div>

        <nav aria-label="Menú principal" className="p-4">
          <Link
            href="/dashboard"
            className="block rounded-lg bg-teal-800 px-4 py-3 font-medium hover:bg-teal-700"
          >
            Inicio
          </Link>
          <Link
            href="/tutores"
            className="mt-2 block rounded-lg px-4 py-3 font-medium hover:bg-teal-800"
          >
            Tutores
          </Link>

          <Link
            href="/turnos"
            className="mt-2 block rounded-lg px-4 py-3 font-medium hover:bg-teal-800"
          >
            Turnos
          </Link>

          <Link
            href="/pacientes"
            className="mt-2 block rounded-lg px-4 py-3 font-medium hover:bg-teal-800"
          >
            Pacientes
          </Link>

          <Link
            href="/medicamentos"
            className="mt-2 block rounded-lg px-4 py-3 font-medium hover:bg-teal-800"
          >
            Medicamentos
          </Link>

          <Link
            href="/inventario/alertas"
            className="mt-2 block rounded-lg px-4 py-3 font-medium hover:bg-teal-800"
          >
            Alertas de inventario
          </Link>

          
        </nav>
      </aside>

      <div className="md:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <p className="font-semibold text-slate-700">
            Panel de gestión
          </p>

          <LogoutButton />
        </header>

        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}