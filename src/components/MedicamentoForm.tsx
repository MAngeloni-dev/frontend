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
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 disabled:bg-slate-100";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p className="rounded-xl bg-teal-50 p-4 text-sm text-teal-800">
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
                className="text-sm font-medium"
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
                  className="mt-1 text-sm text-red-600"
                >
                  {errors[campo.name]?.message}
                </p>
              )}
            </div>
          ))}

          <div>
            <label
              htmlFor="contenido_neto"
              className="text-sm font-medium"
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
              aria-describedby="contenido-ayuda"
              className={inputClass}
            />

            <p
              id="contenido-ayuda"
              className="mt-1 text-xs text-slate-500"
            >
              Usá punto para los decimales, sin separador
              de miles. Hasta 3 decimales.
            </p>

            {errors.contenido_neto && (
              <p className="mt-1 text-sm text-red-600">
                {errors.contenido_neto.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="unidad_contenido"
              className="text-sm font-medium"
            >
              Unidad del contenido
            </label>

            <select
              id="unidad_contenido"
              {...register("unidad_contenido")}
              className={inputClass}
            >
              {unidadesContenido.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidades[unidad]}
                </option>
              ))}
            </select>

            {errors.unidad_contenido && (
              <p className="mt-1 text-sm text-red-600">
                {errors.unidad_contenido.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="via_administracion"
              className="text-sm font-medium"
            >
              Vía de administración
            </label>

            <select
              id="via_administracion"
              {...register("via_administracion")}
              className={inputClass}
            >
              {viasAdministracion.map((via) => (
                <option key={via} value={via}>
                  {vias[via]}
                </option>
              ))}
            </select>

            {errors.via_administracion && (
              <p className="mt-1 text-sm text-red-600">
                {errors.via_administracion.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="stock_minimo"
              className="text-sm font-medium"
            >
              Stock mínimo de envases
            </label>

            <input
              id="stock_minimo"
              type="text"
              inputMode="numeric"
              {...register("stock_minimo")}
              aria-invalid={!!errors.stock_minimo}
              className={inputClass}
            />

            {errors.stock_minimo && (
              <p className="mt-1 text-sm text-red-600">
                {errors.stock_minimo.message}
              </p>
            )}
          </div>
        </div>

        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium">
            Especies — opcional
          </legend>

          {especies.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay especies activas disponibles.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {especies.map((especie) => (
                <label
                  key={especie.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    value={String(especie.id)}
                    {...register("especies")}
                    className="h-4 w-4 accent-teal-700"
                  />
                  {especie.nombre}
                </label>
              ))}
            </div>
          )}

          {errors.especies && (
            <p className="mt-2 text-sm text-red-600">
              Revisá las especies seleccionadas.
            </p>
          )}
        </fieldset>

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
          disabled={isSubmitting || requiereRevision}
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Crear medicamento"}
        </button>

        <Link
          href="/medicamentos"
          className="text-sm font-medium text-slate-600 hover:underline"
        >
          {requiereRevision
            ? "Revisar listado"
            : "Volver a medicamentos"}
        </Link>
      </div>
    </form>
  );
}