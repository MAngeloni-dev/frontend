"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  pacienteSchema,
  type PacienteFormValues,
} from "@/lib/paciente-schema";

type Especie = {
  id: number;
  nombre: string;
};

type Raza = {
  id: number;
  nombre: string;
  especie: number;
};

type PacienteInicial = {
  id: number;
  nombre: string;
  especie: number;
  raza: number | null;
  sexo: "MACHO" | "HEMBRA" | "DESCONOCIDO";
  color: string;
  fecha_nacimiento: string | null;
  nacimiento_estimado: boolean;
  castrado: "SI" | "NO" | "DESCONOCIDO";
  microchip: string | null;
  observaciones: string;
};

type Props = {
  tutor: {
    id: number;
    nombre: string;
    apellido: string;
  };
  especies: Especie[];
  razas: Raza[];
  paciente?: PacienteInicial;
};

const campos = [
  { name: "nombre", label: "Nombre del paciente", type: "text" },
  { name: "color", label: "Color — opcional", type: "text" },
  {
    name: "fecha_nacimiento",
    label: "Fecha de nacimiento — opcional",
    type: "date",
  },
  { name: "microchip", label: "Microchip — opcional", type: "text" },
] as const;

export default function PacienteForm({
  tutor,
  especies,
  razas,
  paciente,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      nombre: paciente?.nombre ?? "",
      especie: paciente ? String(paciente.especie) : "",
      raza: paciente?.raza ? String(paciente.raza) : "",
      sexo: paciente?.sexo ?? "DESCONOCIDO",
      color: paciente?.color ?? "",
      fecha_nacimiento: paciente?.fecha_nacimiento ?? "",
      nacimiento_estimado: paciente?.nacimiento_estimado ?? false,
      castrado: paciente?.castrado ?? "DESCONOCIDO",
      microchip: paciente?.microchip ?? "",
      observaciones: paciente?.observaciones ?? "",
    },
  });

  const especieSeleccionada = watch("especie");
  const especieField = register("especie");

  const razasDisponibles = razas.filter(
    (raza) => raza.especie === Number(especieSeleccionada),
  );

  const returnTo = paciente
    ? `/pacientes/${paciente.id}`
    : `/tutores/${tutor.id}`;

  async function onSubmit(values: PacienteFormValues) {
    setError("");

    async function save() {
      return fetch(
        paciente
          ? `/api/pacientes/${paciente.id}`
          : `/api/tutores/${tutor.id}/pacientes`,
        {
          method: paciente ? "PATCH" : "POST",
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

        setError(messages || "No pudimos guardar el paciente.");
        return;
      }

      router.replace(returnTo);
      router.refresh();
    } catch {
      setError(
        "No pudimos confirmar el guardado. Revisá la ficha antes de intentar nuevamente.",
      );
    }
  }

    const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400";

  const errorClass =
    "mt-1 text-sm text-red-600 dark:text-red-300";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
    >
      <div className="rounded-xl border border-teal-100 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950">
        <p className="text-sm text-teal-700 dark:text-teal-300">
          Tutor
        </p>

        <p className="font-semibold text-teal-950 dark:text-teal-100">
          {tutor.nombre} {tutor.apellido}
        </p>

        <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
          {paciente
            ? "El paciente conserva su tutor asociado."
            : "El paciente quedará asociado a este tutor."}
        </p>
      </div>

      <fieldset disabled={isSubmitting} className="mt-6 space-y-5">
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

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            {...register("nacimiento_estimado")}
            className="h-4 w-4 accent-teal-700 dark:accent-teal-400"
          />
          La fecha de nacimiento es estimada
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="especie" className="text-sm font-medium">
              Especie
            </label>

            <select
              id="especie"
              {...especieField}
              onChange={(event) => {
                void especieField.onChange(event);
                setValue("raza", "", { shouldValidate: true });
              }}
              aria-invalid={!!errors.especie}
              aria-describedby={
                errors.especie ? "especie-error" : undefined
              }
              className={inputClass}
            >
              <option value="">Seleccionar especie</option>
              {especies.map((especie) => (
                <option key={especie.id} value={especie.id}>
                  {especie.nombre}
                </option>
              ))}
            </select>

            {errors.especie && (
              <p id="especie-error" className={errorClass}>
                {errors.especie.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="raza" className="text-sm font-medium">
              Raza
            </label>

            <select
              id="raza"
              {...register("raza")}
              disabled={!especieSeleccionada || isSubmitting}
              aria-invalid={!!errors.raza}
              aria-describedby={
                errors.raza ? "raza-error" : undefined
              }
              className={inputClass}
            >
              <option value="">Sin registrar</option>
              {razasDisponibles.map((raza) => (
                <option key={raza.id} value={raza.id}>
                  {raza.nombre}
                </option>
              ))}
            </select>

            {errors.raza && (
              <p id="raza-error" className={errorClass}>
                {errors.raza.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="sexo" className="text-sm font-medium">
              Sexo
            </label>

            <select
              id="sexo"
              {...register("sexo")}
              aria-invalid={!!errors.sexo}
              className={inputClass}
            >
              <option value="DESCONOCIDO">Desconocido</option>
              <option value="MACHO">Macho</option>
              <option value="HEMBRA">Hembra</option>
            </select>

            {errors.sexo && (
              <p className={errorClass}>{errors.sexo.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="castrado" className="text-sm font-medium">
              Castrado
            </label>

            <select
              id="castrado"
              {...register("castrado")}
              aria-invalid={!!errors.castrado}
              className={inputClass}
            >
              <option value="DESCONOCIDO">Desconocido</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>

            {errors.castrado && (
              <p className={errorClass}>
                {errors.castrado.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="observaciones"
            className="text-sm font-medium"
          >
            Observaciones generales — opcional
          </label>

          <textarea
            id="observaciones"
            rows={4}
            {...register("observaciones")}
            aria-invalid={!!errors.observaciones}
            className={inputClass}
          />

          {errors.observaciones && (
            <p className={errorClass}>
              {errors.observaciones.message}
            </p>
          )}
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          {isSubmitting
            ? "Guardando..."
            : paciente
              ? "Guardar cambios"
              : "Guardar paciente"}
        </button>

        <Link
          href={returnTo}
          className="text-sm font-medium text-slate-600 hover:underline dark:text-slate-300"
        >
          Volver a la ficha
        </Link>
      </div>
    </form>
  );
}