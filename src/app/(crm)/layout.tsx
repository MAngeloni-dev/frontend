import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";

export default function CRMLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="bg-teal-950 text-white md:fixed md:inset-y-0 md:left-0 md:w-64">
        <div className="border-b border-teal-800 px-6 py-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Veterinaria Cariñositos
          </Link>

          <p className="mt-1 text-sm text-teal-200">
            Gestión de la clínica
          </p>
        </div>

        <nav aria-label="Menú principal" className="space-y-2 p-4">
          {[
            { href: "/dashboard", label: "Inicio" },
            { href: "/tutores", label: "Tutores" },
            { href: "/pacientes", label: "Pacientes" },
            { href: "/turnos", label: "Turnos" },
            { href: "/medicamentos", label: "Medicamentos" },
            {
              href: "/movimientos-stock",
              label: "Historial de stock",
            },
            {
              href: "/inventario/alertas",
              label: "Alertas de inventario",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-4 py-3 font-medium transition-colors duration-150 hover:bg-teal-800 focus-visible:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="md:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Panel de gestión
          </p>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}