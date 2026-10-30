"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  turnoSchema,
  type TurnoFormValues,
} from "@/lib/turno-schema";

type PacienteOpcion = {
  id: number;
  nombre: string;
  tutor_detalle: {
    nombre: string;
    apellido: string;
  };
};


type ProfesionalOpcion = {
  id: number;
  nombre: string;
};

type TurnoInicial = {
  id: number;
  paciente: number;
  veterinario: number;
  inicio: string;
  fin: string;
  motivo: string;
  observaciones: string;
};

function fechaParaInput(valor: string) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(valor));

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return (
    `${obtener("year")}-${obtener("month")}-${obtener("day")}` +
    `T${obtener("hour")}:${obtener("minute")}`
  );
}

type Props = {
  pacientes: PacienteOpcion[];
  profesionales: ProfesionalOpcion[];
  turno?: TurnoInicial;
};

function mostrarErrores(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "No pudimos guardar el turno.";
  }

  const etiquetas: Record<string, string> = {
    paciente: "Paciente",
    veterinario: "Profesional",
    inicio: "Inicio",
    fin: "Finalización",
    motivo: "Motivo",
    observaciones: "Observaciones",
  };

  return (
    Object.entries(data)
      .map(([campo, valor]) => {
        const mensaje = Array.isArray(valor)
          ? valor.join(" ")
          : String(valor);

        const etiqueta = etiquetas[campo];

        return etiqueta ? `${etiqueta}: ${mensaje}` : mensaje;
      })
      .join(" ") || "No pudimos guardar el turno."
  );
}

export default function TurnoForm({
  pacientes,
  profesionales,
  turno,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const returnTo = turno ? `/turnos/${turno.id}` : "/turnos";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TurnoFormValues>({
    resolver: zodResolver(turnoSchema),
    defaultValues: {
      paciente: turno ? String(turno.paciente) : "",
      veterinario: turno ? String(turno.veterinario) : "",
      inicio: turno ? fechaParaInput(turno.inicio) : "",
      fin: turno ? fechaParaInput(turno.fin) : "",
      motivo: turno?.motivo ?? "",
      observaciones: turno?.observaciones ?? "",
    },
  });

  async function onSubmit(values: TurnoFormValues) {
    setError("");

    async function guardar() {
      return fetch(turno ? `/api/turnos/${turno.id}` : "/api/turnos", {
        method: turno ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
    }

    try {
      let response = await guardar();

      // Reintentamos únicamente si la petición fue rechazada
      // por falta de autenticación.
      if (response.status === 401) {
        const renewal = await fetch("/api/auth/refresh", {
          method: "POST",
        });

        if (!renewal.ok) {
          setError(
            "Tu sesión venció. Iniciá sesión nuevamente para guardar el turno.",
          );
          return;
        }

        response = await guardar();
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(mostrarErrores(data));
        return;
      }

      router.replace(returnTo);
      router.refresh();
    } catch {
      setError(
        "No pudimos confirmar el guardado. Revisá el turno antes de intentar nuevamente.",
      );
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 disabled:bg-slate-100";

  const sinOpciones =
    pacientes.length === 0 || profesionales.length === 0;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p className="rounded-xl bg-teal-50 p-4 text-sm text-teal-800">
        Los horarios corresponden a la clínica en Argentina
        (UTC−03:00).{" "}
        {turno
          ? "La edición conserva el estado actual del turno."
          : "El turno se registrará como pendiente."}
      </p>

      {sinOpciones && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
        >
          {pacientes.length === 0
            ? "No hay pacientes disponibles con tutor activo. "
            : ""}
          {profesionales.length === 0
            ? "No hay profesionales activos disponibles."
            : ""}
        </p>
      )}

      <fieldset
        disabled={isSubmitting || sinOpciones}
        className="mt-6 space-y-5"
      >
        <div>
          <label
            htmlFor="paciente"
            className="text-sm font-medium"
          >
            Paciente
          </label>

          <select
            id="paciente"
            {...register("paciente")}
            aria-invalid={!!errors.paciente}
            aria-describedby={
              errors.paciente ? "paciente-error" : undefined
            }
            className={inputClass}
          >
            <option value="">Seleccionar paciente</option>

            {pacientes.map((paciente) => (
              <option key={paciente.id} value={paciente.id}>
                {paciente.nombre} — Tutor:{" "}
                {paciente.tutor_detalle.nombre}{" "}
                {paciente.tutor_detalle.apellido}
                {` · Paciente #${paciente.id}`}
              </option>
            ))}
          </select>

          {errors.paciente && (
            <p
              id="paciente-error"
              className="mt-1 text-sm text-red-600"
            >
              {errors.paciente.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="veterinario"
            className="text-sm font-medium"
          >
            Profesional
          </label>

          <select
            id="veterinario"
            {...register("veterinario")}
            aria-invalid={!!errors.veterinario}
            aria-describedby={
              errors.veterinario ? "veterinario-error" : undefined
            }
            className={inputClass}
          >
            <option value="">Seleccionar profesional</option>

            {profesionales.map((profesional) => (
              <option
                key={profesional.id}
                value={profesional.id}
              >
                {profesional.nombre}
              </option>
            ))}
          </select>

          {errors.veterinario && (
            <p
              id="veterinario-error"
              className="mt-1 text-sm text-red-600"
            >
              {errors.veterinario.message}
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="inicio"
              className="text-sm font-medium"
            >
              Fecha y hora de inicio
            </label>

            <input
              id="inicio"
              type="datetime-local"
              step={60}
              {...register("inicio")}
              aria-invalid={!!errors.inicio}
              aria-describedby={
                errors.inicio ? "inicio-error" : undefined
              }
              className={inputClass}
            />

            {errors.inicio && (
              <p
                id="inicio-error"
                className="mt-1 text-sm text-red-600"
              >
                {errors.inicio.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="fin"
              className="text-sm font-medium"
            >
              Fecha y hora de finalización
            </label>

            <input
              id="fin"
              type="datetime-local"
              step={60}
              {...register("fin")}
              aria-invalid={!!errors.fin}
              aria-describedby={
                errors.fin ? "fin-error" : undefined
              }
              className={inputClass}
            />

            {errors.fin && (
              <p
                id="fin-error"
                className="mt-1 text-sm text-red-600"
              >
                {errors.fin.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="motivo"
            className="text-sm font-medium"
          >
            Motivo
          </label>

          <input
            id="motivo"
            type="text"
            maxLength={255}
            {...register("motivo")}
            aria-invalid={!!errors.motivo}
            aria-describedby={
              errors.motivo ? "motivo-error" : undefined
            }
            className={inputClass}
          />

          {errors.motivo && (
            <p
              id="motivo-error"
              className="mt-1 text-sm text-red-600"
            >
              {errors.motivo.message}
            </p>
          )}
        </div>

        <div>
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
          disabled={isSubmitting || sinOpciones}
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {isSubmitting
            ? "Guardando..."
            : turno
              ? "Guardar cambios"
              : "Guardar turno"}
        </button>

        <Link
          href={returnTo}
          className="text-sm font-medium text-slate-600 hover:underline"
        >
          {turno ? "Volver a la ficha" : "Volver al listado"}
        </Link>
      </div>
    </form>
  );
}
