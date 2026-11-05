"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Ingresá tu usuario."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginForm) {
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "No pudimos iniciar sesión.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Ocurrió un error de conexión. Intentá nuevamente.");
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-[#e3f2ec] px-5 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/images/login-veterinaria.png')",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-white/10 dark:bg-slate-950/40"
      />

      <section
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-7 text-slate-900 shadow-2xl shadow-teal-950/15 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 sm:p-9"
      >
        <div className="mb-5 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold tracking-wide text-teal-800 dark:bg-teal-950 dark:text-teal-200">
          Veterinaria Cariñositos
        </div>

        <h1
          id="login-title"
          className="text-3xl font-bold tracking-tight text-teal-800 dark:text-teal-300"
        >
          Bienvenido
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Ingresá con tu cuenta del equipo para acceder al
          panel de gestión.
        </p>

        <form
          method="POST"
          onSubmit={handleSubmit(onSubmit)}
          className="mt-7 space-y-5"
        >
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Usuario
            </label>

            <input
              id="username"
              autoComplete="username"
              placeholder="Tu nombre de usuario"
              {...register("username")}
              aria-invalid={!!errors.username}
              aria-describedby={
                errors.username ? "username-error" : undefined
              }
              className={inputClass}
            />

            {errors.username && (
              <p
                id="username-error"
                className="mt-2 text-sm text-red-600 dark:text-red-300"
              >
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "password-error" : undefined
              }
              className={inputClass}
            />

            {errors.password && (
              <p
                id="password-error"
                className="mt-2 text-sm text-red-600 dark:text-red-300"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-teal-700 p-3 font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 border-t border-slate-200 pt-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Cuidamos de ellos, acompañamos a sus familias.
        </p>
      </section>
    </main>
  );
}