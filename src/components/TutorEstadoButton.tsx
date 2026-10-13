"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  tutorId: number;
  nombre: string;
  activo: boolean;
};

export default function TutorEstadoButton({
  tutorId,
  nombre,
  activo,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function cambiarEstado() {
    const mensaje = activo
      ? `¿Dar de baja a ${nombre}? Sus pacientes e historial se conservarán.`
      : `¿Reactivar a ${nombre}?`;

    if (!window.confirm(mensaje)) {
      return;
    }

    setLoading(true);
    setError("");

    async function send() {
      return fetch(`/api/tutores/${tutorId}/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !activo }),
      });
    }

    try {
      let response = await send();

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

        response = await send();
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "No pudimos cambiar el estado.");
        return;
      }

      router.refresh();
    } catch {
      setError(
        "No pudimos confirmar el cambio. Recargá la ficha para comprobar el estado.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={cambiarEstado}
        disabled={loading}
        className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50 ${
          activo
            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
        }`}
      >
        {loading
          ? "Actualizando..."
          : activo
            ? "Dar de baja"
            : "Reactivar"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}