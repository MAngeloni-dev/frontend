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
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="rounded-xl bg-teal-50 p-4">
        <p className="text-sm text-teal-700">Tutor</p>
        <p className="font-semibold text-teal-950">
          {tutor.nombre} {tutor.apellido}
        </p>
        <p className="mt-1 text-sm text-teal-700">
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

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            {...register("nacimiento_estimado")}
            className="h-4 w-4 accent-teal-700"
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
              <p className="mt-1 text-sm text-red-600">
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
              className={inputClass}
            >
              <option value="">Sin registrar</option>
              {razasDisponibles.map((raza) => (
                <option key={raza.id} value={raza.id}>
                  {raza.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sexo" className="text-sm font-medium">
              Sexo
            </label>
            <select
              id="sexo"
              {...register("sexo")}
              className={inputClass}
            >
              <option value="DESCONOCIDO">Desconocido</option>
              <option value="MACHO">Macho</option>
              <option value="HEMBRA">Hembra</option>
            </select>
          </div>

          <div>
            <label htmlFor="castrado" className="text-sm font-medium">
              Castrado
            </label>
            <select
              id="castrado"
              {...register("castrado")}
              className={inputClass}
            >
              <option value="DESCONOCIDO">Desconocido</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
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
            : paciente
              ? "Guardar cambios"
              : "Guardar paciente"}
        </button>

        <Link
          href={returnTo}
          className="text-sm font-medium text-slate-600 hover:underline"
        >
          Volver a la ficha
        </Link>
      </div>
    </form>
  );
}