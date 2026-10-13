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
  { name: "direccion", label: "Dirección — opcional", type: "text" },
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
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <fieldset disabled={isSubmitting}>
        <div className="grid gap-5 sm:grid-cols-2">
          {campos.map((campo) => (
            <div key={campo.name}>
              <label
                htmlFor={campo.name}
                className="text-sm font-medium"
              >
                {campo.label}
              </label>

              <input
                id={campo.name}
                type={campo.type}
                {...register(campo.name)}
                className={inputClass}
              />

              {errors[campo.name] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors[campo.name]?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5">
          <label
            htmlFor="observaciones"
            className="text-sm font-medium"
          >
            Observaciones — opcional
          </label>

          <textarea
            id="observaciones"
            rows={4}
            {...register("observaciones")}
            className={inputClass}
          />
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {isSubmitting
            ? "Guardando..."
            : tutor
            ? "Guardar cambios"
            : "Guardar tutor"
          }
        </button>

        <Link
          href={tutor ? `/tutores/${tutor.id}` : "/tutores"}
          className="text-sm text-slate-600 hover:underline"
        >
          {tutor ? "Volver a la ficha" : "Volver al listado"}
        </Link>
      </div>
    </form>
  );
}