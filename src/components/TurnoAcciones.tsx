"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EstadoTurno =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "ATENDIDO"
  | "CANCELADO";

type Rol =
  | "ADMINISTRADOR"
  | "VETERINARIO"
  | "RECEPCION";

type Accion = "confirmar" | "cancelar" | "atender";

type Props = {
  turnoId: number;
  estado: EstadoTurno;
  rol: Rol;
};

const etiquetas: Record<Accion, string> = {
  confirmar: "Confirmar turno",
  cancelar: "Cancelar turno",
  atender: "Marcar como atendido",
};

const estilos: Record<Accion, string> = {
  confirmar:
    "bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500",
  cancelar:
    "border border-red-300 bg-white text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900",
  atender:
    "bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300",
};

function mostrarError(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "No pudimos realizar la operación.";
  }

  return (
    Object.entries(data)
      .map(([campo, valor]) => {
        const mensaje = Array.isArray(valor)
          ? valor.join(" ")
          : String(valor);

        return campo === "detail" || campo === "non_field_errors"
          ? mensaje
          : `${campo}: ${mensaje}`;
      })
      .join(" ") || "No pudimos realizar la operación."
  );
}

export default function TurnoAcciones({
  turnoId,
  estado,
  rol,
}: Props) {
  const router = useRouter();

  const [procesando, setProcesando] = useState<Accion | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [requiereRevision, setRequiereRevision] = useState(false);

  const puedeGestionar =
    rol === "ADMINISTRADOR" ||
    rol === "VETERINARIO" ||
    rol === "RECEPCION";

  const puedeAtender =
    rol === "ADMINISTRADOR" || rol === "VETERINARIO";

  const abierto =
    estado === "PENDIENTE" || estado === "CONFIRMADO";

  const acciones: Accion[] = [];

  if (puedeGestionar && estado === "PENDIENTE") {
    acciones.push("confirmar");
  }

  if (puedeAtender && abierto) {
    acciones.push("atender");
  }

  if (puedeGestionar && abierto) {
    acciones.push("cancelar");
  }

  async function ejecutar(accion: Accion) {
    if (procesando || requiereRevision) {
      return;
    }

    const pregunta =
      accion === "cancelar"
        ? "¿Querés cancelar este turno?"
        : accion === "atender"
          ? "¿Querés marcar este turno como atendido?"
          : "¿Querés confirmar este turno?";

    if (!window.confirm(pregunta)) {
      return;
    }

    setProcesando(accion);
    setError("");
    setMensaje("");

    async function enviar() {
      return fetch(`/api/turnos/${turnoId}/${accion}`, {
        method: "POST",
      });
    }

    try {
      let response = await enviar();

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

        response = await enviar();
      }

      if (!response.ok) {
        const data: unknown = await response
          .json()
          .catch(() => null);

        setError(mostrarError(data));

        if (response.status >= 500) {
          setRequiereRevision(true);
        }

        return;
      }

      setMensaje("El estado del turno se actualizó.");
      setRequiereRevision(true);
      router.refresh();
    } catch {
      setError(
        "No pudimos confirmar el cambio. Actualizá la ficha y revisá el estado antes de intentar nuevamente.",
      );
      setRequiereRevision(true);
    } finally {
      setProcesando(null);
    }
  }

  return (
    <div className="space-y-4">
      {acciones.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {acciones.map((accion) => (
            <button
              key={accion}
              type="button"
              onClick={() => void ejecutar(accion)}
              disabled={
                procesando !== null || requiereRevision
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50 ${estilos[accion]}`}
            >
              {procesando === accion
                ? "Procesando..."
                : etiquetas[accion]}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          No hay acciones disponibles para este turno.
        </p>
      )}

      {mensaje && (
        <p
          role="status"
          className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200"
        >
          {mensaje}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {requiereRevision && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded text-sm font-medium text-teal-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-teal-300"
        >
          Actualizar ficha
        </button>
      )}
    </div>
  );
}