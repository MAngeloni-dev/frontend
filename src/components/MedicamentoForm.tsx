"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  medicamentoSchema,
  unidadesContenido,
  viasAdministracion,
  type MedicamentoFormValues,
} from "@/lib/medicamento-schema";

type Props = {
  especies: {
    id: number;
    nombre: string;
  }[];
};

const unidades: Record<string, string> = {
  ML: "Mililitros",
  G: "Gramos",
  COMPRIMIDO: "Comprimidos",
  CAPSULA: "Cápsulas",
  DOSIS: "Dosis",
  UNIDAD: "Unidades",
};

const vias: Record<string, string> = {
  ORAL: "Oral",
  SUBCUTANEA: "Subcutánea",
  INTRAMUSCULAR: "Intramuscular",
  INTRAVENOSA: "Intravenosa",
  TOPICA: "Tópica",
  OFTALMICA: "Oftálmica",
  OTICA: "Ótica",
  OTRA: "Otra",
};

const campos = [
  {
    name: "nombre",
    label: "Nombre comercial",
    maxLength: 150,
  },
  {
    name: "laboratorio",
    label: "Laboratorio — opcional",
    maxLength: 150,
  },
  {
    name: "principio_activo",
    label: "Principio activo",
    maxLength: 200,
  },
  {
    name: "concentracion",
    label: "Concentración",
    maxLength: 100,
  },
  {
    name: "presentacion",
    label: "Presentación",
    maxLength: 100,
  },
  {
    name: "codigo_barras",
    label: "Código de barras — opcional",
    maxLength: 100,
  },
] as const;

function mostrarErrores(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "No pudimos crear el medicamento.";
  }

  const etiquetas: Record<string, string> = {
    nombre: "Nombre",
    laboratorio: "Laboratorio",
    principio_activo: "Principio activo",
    concentracion: "Concentración",
    presentacion: "Presentación",
    contenido_neto: "Contenido neto",
    unidad_contenido: "Unidad",
    codigo_barras: "Código de barras",
    via_administracion: "Vía de administración",
    especies: "Especies",
    stock_minimo: "Stock mínimo",
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
      .join(" ") || "No pudimos crear el medicamento."
  );
}

export default function MedicamentoForm({ especies }: Props) {
  const router = useRouter();

  const [error, setError] = useState("");
  const [requiereRevision, setRequiereRevision] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MedicamentoFormValues>({
    resolver: zodResolver(medicamentoSchema),
    defaultValues: {
      nombre: "",
      laboratorio: "",
      principio_activo: "",
      concentracion: "",
      presentacion: "",
      contenido_neto: "",
      unidad_contenido: "ML",
      codigo_barras: "",
      via_administracion: "ORAL",
      especies: [],
      stock_minimo: "0",
      observaciones: "",
    },
  });

  async function onSubmit(values: MedicamentoFormValues) {
    if (requiereRevision) {
      return;
    }

    setError("");

    async function guardar() {
      return fetch("/api/medicamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
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

      const data: unknown = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setError(mostrarErrores(data));

        if (response.status >= 500) {
          setRequiereRevision(true);
        }

        return;
      }

      setRequiereRevision(true);

      const id =
        data && typeof data === "object" && "id" in data
          ? data.id
          : null;

      router.replace(
        typeof id === "number" &&
          Number.isSafeInteger(id) &&
          id > 0
          ? `/medicamentos/${id}`
          : "/medicamentos",
      );
      router.refresh();
    } catch {
      setError(
        "No pudimos confirmar el guardado. Revisá el listado de medicamentos antes de intentar nuevamente.",
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
      <p className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">
        El medicamento se creará activo y sin existencias.
        Después podrás agregar lotes y registrar sus ingresos.
      </p>

      <fieldset
        disabled={isSubmitting || requiereRevision}
        className="mt-6 space-y-5"
      >
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
                type="text"
                maxLength={campo.maxLength}
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

          <div>
            <label
              htmlFor="contenido_neto"
              className={labelClass}
            >
              Contenido neto por envase
            </label>

            <input
              id="contenido_neto"
              type="text"
              inputMode="decimal"
              placeholder="Ej.: 100 o 2.500"
              {...register("contenido_neto")}
              aria-invalid={!!errors.contenido_neto}
              aria-describedby={
                errors.contenido_neto
                  ? "contenido-ayuda contenido-error"
                  : "contenido-ayuda"
              }
              className={inputClass}
            />

            <p
              id="contenido-ayuda"
              className="mt-1 text-xs text-slate-500 dark:text-slate-400"
            >
              Usá punto para los decimales, sin separador
              de miles. Hasta 3 decimales.
            </p>

            {errors.contenido_neto && (
              <p id="contenido-error" className={errorClass}>
                {errors.contenido_neto.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="unidad_contenido"
              className={labelClass}
            >
              Unidad del contenido
            </label>

            <select
              id="unidad_contenido"
              {...register("unidad_contenido")}
              aria-invalid={!!errors.unidad_contenido}
              aria-describedby={
                errors.unidad_contenido
                  ? "unidad-error"
                  : undefined
              }
              className={inputClass}
            >
              {unidadesContenido.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidades[unidad]}
                </option>
              ))}
            </select>

            {errors.unidad_contenido && (
              <p id="unidad-error" className={errorClass}>
                {errors.unidad_contenido.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="via_administracion"
              className={labelClass}
            >
              Vía de administración
            </label>

            <select
              id="via_administracion"
              {...register("via_administracion")}
              aria-invalid={!!errors.via_administracion}
              aria-describedby={
                errors.via_administracion
                  ? "via-error"
                  : undefined
              }
              className={inputClass}
            >
              {viasAdministracion.map((via) => (
                <option key={via} value={via}>
                  {vias[via]}
                </option>
              ))}
            </select>

            {errors.via_administracion && (
              <p id="via-error" className={errorClass}>
                {errors.via_administracion.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="stock_minimo"
              className={labelClass}
            >
              Stock mínimo de envases
            </label>

            <input
              id="stock_minimo"
              type="text"
              inputMode="numeric"
              {...register("stock_minimo")}
              aria-invalid={!!errors.stock_minimo}
              aria-describedby={
                errors.stock_minimo
                  ? "stock-minimo-error"
                  : undefined
              }
              className={inputClass}
            />

            {errors.stock_minimo && (
              <p id="stock-minimo-error" className={errorClass}>
                {errors.stock_minimo.message}
              </p>
            )}
          </div>
        </div>

        <fieldset
          aria-describedby={
            errors.especies ? "especies-error" : undefined
          }
          className="rounded-xl border border-slate-200 p-4 dark:border-slate-600"
        >
          <legend className={`px-1 ${labelClass}`}>
            Especies — opcional
          </legend>

          {especies.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No hay especies activas disponibles.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {especies.map((especie) => (
                <label
                  key={especie.id}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                >
                  <input
                    type="checkbox"
                    value={String(especie.id)}
                    {...register("especies")}
                    className="h-4 w-4 accent-teal-700 dark:accent-teal-400"
                  />
                  {especie.nombre}
                </label>
              ))}
            </div>
          )}

          {errors.especies && (
            <p
              id="especies-error"
              className="mt-2 text-sm text-red-600 dark:text-red-300"
            >
              Revisá las especies seleccionadas.
            </p>
          )}
        </fieldset>

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
          {isSubmitting ? "Guardando..." : "Crear medicamento"}
        </button>

        <Link
          href="/medicamentos"
          className="rounded text-sm font-medium text-slate-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-slate-300"
        >
          {requiereRevision
            ? "Revisar listado"
            : "Volver a medicamentos"}
        </Link>
      </div>
    </form>
  );
}