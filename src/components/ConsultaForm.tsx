"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  consultaSchema,
  type ConsultaFormValues,
} from "@/lib/consulta-schema";

type Props = {
  pacienteId: number;
  pacienteNombre: string;
  profesionalNombre: string;
};

const textos = [
  { name: "sintomas", label: "Síntomas" },
  { name: "diagnostico", label: "Diagnóstico" },
  { name: "tratamiento", label: "Tratamiento indicado" },
  { name: "observaciones", label: "Observaciones de la consulta" },
] as const;

export default function ConsultaForm({
  pacienteId,
  pacienteNombre,
  profesionalNombre,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConsultaFormValues>({
    resolver: zodResolver(consultaSchema),
    defaultValues: {
      motivo: "",
      sintomas: "",
      diagnostico: "",
      tratamiento: "",
      observaciones: "",
      peso: "",
    },
  });

  async function onSubmit(values: ConsultaFormValues) {
    setError("");

    async function save() {
      return fetch(`/api/pacientes/${pacienteId}/consultas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
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

        setError(messages || "No pudimos guardar la consulta.");
        return;
      }

      router.replace(`/pacientes/${pacienteId}`);
      router.refresh();
    } catch {
      setError(
        "No pudimos confirmar el guardado. Revisá el historial antes de intentar nuevamente.",
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
      <div className="rounded-xl bg-teal-50 p-4">
        <p className="font-semibold text-teal-950">
          Paciente: {pacienteNombre}
        </p>
        <p className="mt-1 text-sm text-teal-700">
          Profesional: {profesionalNombre}
        </p>
      </div>

      <fieldset disabled={isSubmitting} className="mt-6 space-y-5">
        <div>
          <label htmlFor="motivo" className="text-sm font-medium">
            Motivo de consulta
          </label>
          <input
            id="motivo"
            {...register("motivo")}
            className={inputClass}
          />
          {errors.motivo && (
            <p className="mt-1 text-sm text-red-600">
              {errors.motivo.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="peso" className="text-sm font-medium">
            Peso en kg — opcional
          </label>
          <input
            id="peso"
            type="text"
            inputMode="decimal"
            placeholder="Ejemplo: 28,500"
            {...register("peso")}
            className={inputClass}
          />
          {errors.peso && (
            <p className="mt-1 text-sm text-red-600">
              {errors.peso.message}
            </p>
          )}
        </div>

        {textos.map((campo) => (
          <div key={campo.name}>
            <label
              htmlFor={campo.name}
              className="text-sm font-medium"
            >
              {campo.label} — opcional
            </label>
            <textarea
              id={campo.name}
              rows={3}
              {...register(campo.name)}
              className={inputClass}
            />
          </div>
        ))}
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
          {isSubmitting ? "Guardando..." : "Guardar consulta"}
        </button>

        <Link
          href={`/pacientes/${pacienteId}`}
          className="text-sm text-slate-600 hover:underline"
        >
          Volver a la ficha
        </Link>
      </div>
    </form>
  );
}