"use client";

import Link from "next/link";

import LogoutButton from "@/components/LogoutButton";

type Props = {
  usuario: {
    username: string;
    first_name: string;
    last_name: string;
    foto: string | null;
  };
};

export default function PerfilMenu({ usuario }: Props) {
  const nombre =
    `${usuario.first_name} ${usuario.last_name}`.trim() ||
    usuario.username;

  const iniciales =
    `${usuario.first_name.charAt(0)}${usuario.last_name.charAt(0)}`
      .toUpperCase() || usuario.username.slice(0, 2).toUpperCase();

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-500 dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">
          {usuario.foto ? (
            // La foto se sirve desde nuestra ruta autenticada.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/cuenta/foto?v=${encodeURIComponent(usuario.foto)}`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            iniciales
          )}
        </span>

        <span className="max-w-40 truncate text-sm font-medium">
          {nombre}
        </span>

        <span aria-hidden="true" className="text-xs">
          ▾
        </span>
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
        <p className="truncate px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
          @{usuario.username}
        </p>

        <Link
          href="/mi-cuenta"
          onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}
          className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          Ajustes de mi cuenta
        </Link>

        <div className="mt-2 border-t border-slate-200 pt-3 dark:border-slate-700">
          <LogoutButton />
        </div>
      </div>
    </details>
  );
}