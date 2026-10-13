"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("No se pudo cerrar la sesión.");
      }

      window.location.replace("/login");
    } catch {
      setError("No pudimos cerrar sesión. Intentá nuevamente.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}