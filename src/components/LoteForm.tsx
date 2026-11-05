"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  loteSchema,
  type LoteFormValues,
} from "@/lib/lote-schema";

type Props = {
  medicamento: {
    id: number;
    nombre: string;
  };
};

function mostrarErrores(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "No pudimos crear el lote.";
  }

  const etiquetas: Record<string, string> = {
    medicamento: "Medicamento",
    numero: "Número de lote",
    fecha_vencimiento: "Vencimiento",
    observaciones: "Observaciones",
  };

  return (
    Object.entries(data)
      .map(([campo, valor]) => {
        const mensaje = Array.isArray(valor)
          ? valor.join(" ")
          : String(valor);

        return etiquetas[campo]
          ? `${etiquetas[campo]}: ${mensaje}`
          : mensaje;
      })
      .join(" ") || "No pudimos crear el lote."
  );
}

export default function LoteForm({ medicamento }: Props) {
  const router = useRouter();

  const [error, setError] = useState("");
  const [requiereRevision, setRequiereRevision] = useState(false);

  const returnTo = `/medicamentos/${medicamento.id}`;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoteFormValues>({
    resolver: zodResolver(loteSchema),
    defaultValues: {
      numero: "",
      fecha_vencimiento: "",
      observaciones: "",
    },
  });

  async function onSubmit(values: LoteFormValues) {
    if (requiereRevision) {
      return;
    }

    setError("");

    async function guardar() {
      return fetch(
        `/api/medicamentos/${medicamento.id}/lotes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        },
      );
    }

    try {
      let response = await guardar();

      if (response.status === 401) {
        const renewal = await fetch("/api/auth/refresh", {
          method: "POST",
        });

        if (!renewal.ok) {
          setError(
            "Tu sesión venció. Iniciá sesión nuevamente.",
          );
          return;
        }

        response = await guardar();
      }

      if (!response.ok) {
        const data: unknown = await response
          .json()
          .catch(() => null);

        setError(mostrarErrores(data));

        if (response.status >= 500) {
          setRequiereRevision(true);
        }

        return;
      }

      setRequiereRevision(true);
      router.replace(returnTo);
      router.refresh();
    } catch {
      setError(
        "No pudimos confirmar el guardado. Revisá los lotes del medicamento antes de intentar nuevamente.",
      );
      setRequiereRevision(true);
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
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950">
        <p className="text-sm text-teal-700 dark:text-teal-300">
          Medicamento
        </p>

        <p className="break-words font-semibold text-teal-950 dark:text-teal-100">
          {medicamento.nombre}
        </p>

        <p className="mt-2 text-sm text-teal-800 dark:text-teal-200">
          El lote comenzará sin existencias. Después de crearlo,
          registrá un ingreso para cargar el stock.
        </p>
      </div>

      <fieldset
        disabled={isSubmitting || requiereRevision}
        className="mt-6 space-y-5"
      >
        <div>
          <label htmlFor="numero" className={labelClass}>
            Número de lote
          </label>

          <input
            id="numero"
            type="text"
            maxLength={100}
            {...register("numero")}
            aria-invalid={!!errors.numero}
            aria-describedby={
              errors.numero ? "numero-error" : undefined
            }
            className={inputClass}
          />

          {errors.numero && (
            <p id="numero-error" className={errorClass}>
              {errors.numero.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="fecha_vencimiento"
            className={labelClass}
          >
            Fecha de vencimiento
          </label>

          <input
            id="fecha_vencimiento"
            type="date"
            {...register("fecha_vencimiento")}
            aria-invalid={!!errors.fecha_vencimiento}
            aria-describedby={
              errors.fecha_vencimiento
                ? "vencimiento-ayuda vencimiento-error"
                : "vencimiento-ayuda"
            }
            className={inputClass}
          />

          <p
            id="vencimiento-ayuda"
            className="mt-1 text-xs text-slate-500 dark:text-slate-400"
          >
            Si la fecha ya pasó, el lote se guardará inactivo
            y no permitirá ingresos de stock.
          </p>

          {errors.fecha_vencimiento && (
            <p id="vencimiento-error" className={errorClass}>
              {errors.fecha_vencimiento.message}
            </p>
          )}
        </div>

        <div>
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
            <p id="observaciones-error" className={errorClass}>
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
          disabled={isSubmitting || requiereRevision}
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          {isSubmitting ? "Guardando..." : "Crear lote"}
        </button>

        <Link
          href={returnTo}
          className="rounded text-sm font-medium text-slate-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-slate-300"
        >
          {requiereRevision
            ? "Revisar lotes del medicamento"
            : "Volver al medicamento"}
        </Link>
      </div>
    </form>
  );
}