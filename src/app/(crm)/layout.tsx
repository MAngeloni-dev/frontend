import Link from "next/link";
import {
  Suspense,
  type ReactNode,
  type SVGProps,
} from "react";
import { connection } from "next/server";

import ThemeToggle from "@/components/ThemeToggle";
import PerfilMenu from "@/components/PerfilMenu";
import { djangoGet } from "@/lib/django";

type Usuario = {
  username: string;
  first_name: string;
  last_name: string;
  foto: string | null;
};

type NombreIcono =
  | "inicio"
  | "tutores"
  | "pacientes"
  | "turnos"
  | "medicamentos"
  | "historial"
  | "alertas";

type IconoProps = SVGProps<SVGSVGElement> & {
  nombre: NombreIcono;
};

function Icono({ nombre, ...props }: IconoProps) {
  const dibujos: Record<NombreIcono, ReactNode> = {
    inicio: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-7h6v7" />
      </>
    ),

    tutores: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
        <path d="M16 5a3 3 0 0 1 0 6" />
        <path d="M21 21v-2a6 6 0 0 0-4-5.65" />
      </>
    ),

    pacientes: (
      <>
        <ellipse cx="6" cy="8" rx="2" ry="3" />
        <ellipse cx="18" cy="8" rx="2" ry="3" />
        <ellipse cx="10" cy="5" rx="1.7" ry="2.5" />
        <ellipse cx="14" cy="5" rx="1.7" ry="2.5" />
        <path d="M7 14c-3 3-2 7 1 7 2 0 2-1 4-1s2 1 4 1c3 0 4-4 1-7-2-2-2-4-5-4s-3 2-5 4Z" />
      </>
    ),

    turnos: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
        <path d="M8 15h2M14 15h2M8 18h2" />
      </>
    ),

    medicamentos: (
      <>
        <path d="m9 4-5 5a5.66 5.66 0 0 0 8 8l5-5a5.66 5.66 0 0 0-8-8Z" />
        <path d="m7 7 8 8" />
      </>
    ),

    historial: (
      <>
        <path d="M3 11a9 9 0 1 1 2.6 7.4" />
        <path d="M3 4v7h7" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    alertas: (
      <>
        <path d="m10.3 4-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {dibujos[nombre]}
    </svg>
  );
}

const enlaces: {
  href: string;
  label: string;
  icono: NombreIcono;
}[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icono: "inicio",
  },
  {
    href: "/tutores",
    label: "Tutores",
    icono: "tutores",
  },
  {
    href: "/pacientes",
    label: "Pacientes",
    icono: "pacientes",
  },
  {
    href: "/turnos",
    label: "Turnos",
    icono: "turnos",
  },
  {
    href: "/medicamentos",
    label: "Medicamentos",
    icono: "medicamentos",
  },
  {
    href: "/movimientos-stock",
    label: "Historial de stock",
    icono: "historial",
  },
  {
    href: "/inventario/alertas",
    label: "Alertas de inventario",
    icono: "alertas",
  },
];

async function PerfilEncabezado() {
  await connection();

  const usuario = await djangoGet<Usuario>(
    "/api/usuarios/me/",
    "/mi-cuenta",
  );

  return <PerfilMenu usuario={usuario} />;
}

export default function CRMLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="crm-theme min-h-screen bg-background text-foreground">
      <aside className="bg-violet-950 text-white md:fixed md:inset-y-0 md:left-0 md:w-64 md:overflow-y-auto">
        <div className="border-b border-violet-800/70 px-5 py-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-800/60 text-violet-100">
              <Icono nombre="pacientes" className="h-7 w-7" />
            </span>

            <span className="text-lg font-bold leading-tight">
              Veterinaria
              <br />
              Cariñositos
            </span>
          </Link>

          <p className="mt-4 text-sm text-violet-200">
            Gestión de la clínica
          </p>
        </div>

        <nav
          aria-label="Menú principal"
          className="space-y-2 p-4"
        >
          {enlaces.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-violet-100 transition-colors duration-150 hover:bg-violet-800 hover:text-white focus-visible:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            >
              <Icono
                nombre={item.icono}
                className="h-5 w-5 shrink-0 text-violet-300 transition-colors group-hover:text-white"
              />

              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="md:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-violet-100 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-violet-900 dark:text-violet-200">
            Panel de gestión
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <ThemeToggle />

            <Suspense
              fallback={
                <span
                  role="status"
                  className="text-sm text-slate-500 dark:text-slate-400"
                >
                  Cargando perfil…
                </span>
              }
            >
              <PerfilEncabezado />
            </Suspense>
          </div>
        </header>

        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}