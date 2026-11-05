"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  tutorSchema,
  type TutorFormValues,
} from "@/lib/tutor-schema";

const campos = [
  { name: "nombre", label: "Nombre", type: "text" },
  { name: "apellido", label: "Apellido", type: "text" },
  { name: "dni", label: "DNI — opcional", type: "text" },
  { name: "telefono", label: "Teléfono", type: "tel" },
  { name: "email", label: "Email — opcional", type: "email" },
  {
    name: "direccion",
    label: "Dirección — opcional",
    type: "text",
  },
] as const;

type Props = {
  tutor?: TutorFormValues & { id: number };
};

export default function TutorForm({ tutor }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TutorFormValues>({
    resolver: zodResolver(tutorSchema),
    defaultValues: {
      nombre: tutor?.nombre ?? "",
      apellido: tutor?.apellido ?? "",
      dni: tutor?.dni ?? "",
      telefono: tutor?.telefono ?? "",
      email: tutor?.email ?? "",
      direccion: tutor?.direccion ?? "",
      observaciones: tutor?.observaciones ?? "",
    },
  });

  async function onSubmit(values: TutorFormValues) {
    setError("");

    async function save() {
      return fetch(
        tutor ? `/api/tutores/${tutor.id}` : "/api/tutores",
        {
          method: tutor ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
    }

    try {
      let response = await save();

      if (response.status === 401) {
        const renewal = await fetch("/api/auth/refresh", {
          method: "POST",
        });

        if (!renewal.ok) {
          setError(
            "No pudimos renovar tu sesión. Iniciá sesión nuevamente si venció.",
          );
          return;
        }

        response = await save();
      }

      const data = await response.json();

      if (!response.ok) {
        const messages = Object.entries(data)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(" ")
              : String(value);

            return field === "detail"
              ? message
              : `${field}: ${message}`;
          })
          .join(" ");

        setError(messages || "No pudimos guardar el tutor.");
        return;
      }

      router.replace(`/tutores/${data.id}`);
      router.refresh();
    } catch {
      setError(
        "No pudimos confirmar el guardado. Revisá el listado antes de intentar nuevamente.",
      );
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition-colors placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800";

  const labelClass =
    "text-sm font-medium text-slate-700 dark:text-slate-200";

  const errorClass =
    "mt-1 text-sm text-red-600 dark:text-red-300";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
    >
      <fieldset disabled={isSubmitting}>
        <div className="grid gap-5 sm:grid-cols-2">
          {campos.map((campo) => (
            <div key={campo.name}>
              <label
                htmlFor={campo.name}
                className={labelClass}
              >
                {campo.label}
              </label>

              <input
                id={campo.name}
                type={campo.type}
                {...register(campo.name)}
                aria-invalid={!!errors[campo.name]}
                aria-describedby={
                  errors[campo.name]
                    ? `${campo.name}-error`
                    : undefined
                }
                className={inputClass}
              />

              {errors[campo.name] && (
                <p
                  id={`${campo.name}-error`}
                  className={errorClass}
                >
                  {errors[campo.name]?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5">
          <label
            htmlFor="observaciones"
            className={labelClass}
          >
            Observaciones — opcional
          </label>

          <textarea
            id="observaciones"
            rows={4}
            {...register("observaciones")}
            aria-invalid={!!errors.observaciones}
            aria-describedby={
              errors.observaciones
                ? "observaciones-error"
                : undefined
            }
            className={inputClass}
          />

          {errors.observaciones && (
            <p
              id="observaciones-error"
              className={errorClass}
            >
              {errors.observaciones.message}
            </p>
          )}
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          {isSubmitting
            ? "Guardando..."
            : tutor
              ? "Guardar cambios"
              : "Guardar tutor"}
        </button>

        <Link
          href={tutor ? `/tutores/${tutor.id}` : "/tutores"}
          className="rounded text-sm font-medium text-slate-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-slate-300"
        >
          {tutor ? "Volver a la ficha" : "Volver al listado"}
        </Link>
      </div>
    </form>
  );
}