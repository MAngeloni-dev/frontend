"use client";

import { useEffect, useRef, useState } from "react";

export default function RenovarSesionPage() {
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    async function renewSession() {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
        });

        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudo renovar la sesión.");
        }

        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");

        const safeDestination =
          next &&
          next.startsWith("/") &&
          !next.startsWith("//") &&
          !next.includes("\\")
            ? next
            : "/dashboard";

        window.location.replace(safeDestination);
      } catch {
        setError(
          "No pudimos renovar la sesión. Revisá la conexión e intentá nuevamente.",
        );
      }
    }

    void renewSession();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold text-teal-700">
          CRM Veterinario
        </h1>

        {error ? (
          <>
            <p role="alert" className="mt-4 text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-teal-700 px-4 py-2 text-white"
            >
              Reintentar
            </button>
          </>
        ) : (
          <p role="status" className="mt-4 text-slate-600">
            Renovando tu sesión...
          </p>
        )}
      </section>
    </main>
  );
}