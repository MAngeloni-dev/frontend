"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  movimientoStockSchema,
  etiquetasMovimiento,
  tiposMovimiento,
  type MovimientoStockFormValues,
} from "@/lib/movimiento-stock-schema";

type Props = {
  lote: {
    id: number;
    numero: string;
    medicamento: number;
    medicamento_nombre: string;
    cantidad_actual: number;
  };
  soloAjustes: boolean;
};

function mostrarErrores(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "No pudimos registrar el movimiento.";
  }

  const etiquetas: Record<string, string> = {
    lote: "Lote",
    tipo: "Tipo",
    cantidad: "Cantidad",
    motivo: "Motivo",
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
      .join(" ") || "No pudimos registrar el movimiento."
  );
}

export default function MovimientoStockForm({
  lote,
  soloAjustes,
}: Props) {
  const router = useRouter();

  const [error, setError] = useState("");
  const [requiereRevision, setRequiereRevision] = useState(false);

  const returnTo = `/medicamentos/${lote.medicamento}`;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MovimientoStockFormValues>({
    resolver: zodResolver(movimientoStockSchema),
    defaultValues: {
      lote: String(lote.id),
      tipo: soloAjustes ? "AJUSTE_SALIDA" : "INGRESO",
      cantidad: "",
      motivo: "",
      observaciones: "",
    },
  });

  const tipo = watch("tipo");
  const cantidad = watch("cantidad");

  const esSalida =
    tipo === "RETIRO" || tipo === "AJUSTE_SALIDA";

  const cantidadNumero = Number(cantidad);

  const cantidadValida =
    /^[1-9]\d*$/.test(cantidad) &&
    Number.isSafeInteger(cantidadNumero) &&
    cantidadNumero <= 2147483647;

  const stockEstimado = cantidadValida
    ? lote.cantidad_actual +
      (esSalida ? -cantidadNumero : cantidadNumero)
    : null;

  const tiposDisponibles = tiposMovimiento.filter(
    (opcion) =>
      !soloAjustes || opcion === "AJUSTE_SALIDA",
  );

  async function onSubmit(values: MovimientoStockFormValues) {
    if (requiereRevision) {
      return;
    }

    setError("");

    if (
      (values.tipo === "RETIRO" ||
        values.tipo === "AJUSTE_SALIDA") &&
      Number(values.cantidad) > lote.cantidad_actual
    ) {
      setError(
        "La cantidad supera las existencias mostradas. Revisá el lote antes de registrar la salida.",
      );
      return;
    }

    async function guardar() {
      return fetch("/api/movimientos-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
    }

    try {
      let response = await guardar();

      // Solo reintentamos cuando no se autorizó la operación.
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

      // Evita repetir el movimiento mientras navegamos.
      setRequiereRevision(true);
      router.replace(returnTo);
      router.refresh();
    } catch {
      setError(
        "No pudimos confirmar el registro. Revisá las existencias y el historial antes de intentar nuevamente.",
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
        <p className="break-words font-semibold text-teal-950 dark:text-teal-100">
          {lote.medicamento_nombre}
        </p>

        <p className="mt-1 break-words text-sm text-teal-800 dark:text-teal-200">
          Lote: {lote.numero}
        </p>

        <p className="mt-1 text-sm text-teal-800 dark:text-teal-200">
          Existencias al cargar: {lote.cantidad_actual}
        </p>
      </div>

      {soloAjustes && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          El lote está vencido, inactivo o pertenece a un
          medicamento inactivo. Solo se permite un ajuste de
          salida para registrar el descarte de existencias.
        </p>
      )}

      <fieldset
        disabled={isSubmitting || requiereRevision}
        className="mt-6 space-y-5"
      >
        <input type="hidden" {...register("lote")} />

        <div>
          <label htmlFor="tipo" className={labelClass}>
            Tipo de movimiento
          </label>

          <select
            id="tipo"
            {...register("tipo")}
            aria-invalid={!!errors.tipo}
            aria-describedby={
              errors.tipo ? "tipo-error" : undefined
            }
            className={inputClass}
          >
            {tiposDisponibles.map((opcion) => (
              <option key={opcion} value={opcion}>
                {etiquetasMovimiento[opcion]}
              </option>
            ))}
          </select>

          {errors.tipo && (
            <p id="tipo-error" className={errorClass}>
              {errors.tipo.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cantidad" className={labelClass}>
            Cantidad de unidades
          </label>

          <input
            id="cantidad"
            type="text"
            inputMode="numeric"
            {...register("cantidad")}
            aria-invalid={!!errors.cantidad}
            aria-describedby={
              errors.cantidad
                ? "cantidad-ayuda cantidad-error"
                : "cantidad-ayuda"
            }
            className={inputClass}
          />

          <p
            id="cantidad-ayuda"
            className="mt-1 text-xs text-slate-500 dark:text-slate-400"
          >
            Ingresá cuánto sumar o restar, no el stock final.
            Usá un número entero positivo.
          </p>

          {errors.cantidad && (
            <p id="cantidad-error" className={errorClass}>
              {errors.cantidad.message}
            </p>
          )}
        </div>

        {stockEstimado !== null && (
          <p
            aria-live="polite"
            className={`rounded-lg border p-3 text-sm ${
              stockEstimado < 0 || stockEstimado > 2147483647
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            Stock estimado después del movimiento:{" "}
            <strong>{stockEstimado}</strong>. Las existencias
            se verificarán al guardar.
          </p>
        )}

        <div>
          <label htmlFor="motivo" className={labelClass}>
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
            <p id="motivo-error" className={errorClass}>
              {errors.motivo.message}
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
          {isSubmitting
            ? "Registrando..."
            : "Registrar movimiento"}
        </button>

        <Link
          href={returnTo}
          className="rounded text-sm font-medium text-slate-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-slate-300"
        >
          {requiereRevision
            ? "Revisar existencias"
            : "Volver al medicamento"}
        </Link>
      </div>
    </form>
  );
}