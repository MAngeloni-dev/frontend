"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  rol: string;
  foto: string | null;
};

type Props = {
  usuario: Usuario;
};

function mostrarError(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "No pudimos realizar la operación.";
  }

  const etiquetas: Record<string, string> = {
    first_name: "Nombre",
    last_name: "Apellido",
    foto: "Foto",
    password_actual: "Contraseña actual",
    password_nueva: "Contraseña nueva",
    password_confirmacion: "Confirmación",
  };

  return Object.entries(data)
    .map(([campo, valor]) => {
      const mensaje = Array.isArray(valor)
        ? valor.join(" ")
        : String(valor);

      return etiquetas[campo]
        ? `${etiquetas[campo]}: ${mensaje}`
        : mensaje;
    })
    .join(" ");
}

async function enviarConRenovacion(
  method: "PATCH" | "POST",
  body: FormData | string,
) {
  function enviar() {
    return fetch("/api/cuenta", {
      method,
      headers:
        typeof body === "string"
          ? { "Content-Type": "application/json" }
          : undefined,
      body,
    });
  }

  let response = await enviar();

  if (response.status === 401) {
    const renewal = await fetch("/api/auth/refresh", {
      method: "POST",
    });

    if (renewal.ok) {
      response = await enviar();
    }
  }

  return response;
}

export default function MiCuentaForm({ usuario }: Props) {
  const router = useRouter();

  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const [errorPerfil, setErrorPerfil] = useState("");
  const [mensajePerfil, setMensajePerfil] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  const [revisarPerfil, setRevisarPerfil] = useState(false);
  const [revisarPassword, setRevisarPassword] = useState(false);

  const ocupado = guardandoPerfil || guardandoPassword;

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

  const tarjetaClass =
    "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800";

  const botonClass =
    "rounded-lg bg-teal-700 px-5 py-3 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500";

  const errorClass =
    "mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200";

  async function guardarPerfil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (ocupado || revisarPerfil) return;

    const form = event.currentTarget;
    const datos = new FormData(form);
    const foto = datos.get("foto");

    setErrorPerfil("");
    setMensajePerfil("");

    if (foto instanceof File && foto.size > 0) {
      if (
        foto.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(
          foto.type,
        )
      ) {
        setErrorPerfil("Usá una foto JPG, PNG o WebP de hasta 5 MB.");
        return;
      }
    } else {
      datos.delete("foto");
    }

    setGuardandoPerfil(true);

    try {
      const response = await enviarConRenovacion("PATCH", datos);
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorPerfil(mostrarError(data));

        if (response.status >= 500) {
          setRevisarPerfil(true);
        }

        return;
      }

      setMensajePerfil("Tu perfil se actualizó.");

      const archivo = form.elements.namedItem("foto");

      if (archivo instanceof HTMLInputElement) {
        archivo.value = "";
      }

      router.refresh();
    } catch {
      setErrorPerfil(
        "No pudimos confirmar el cambio. Actualizá la página para revisar tu perfil.",
      );
      setRevisarPerfil(true);
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function guardarPassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (ocupado || revisarPassword) return;

    const form = event.currentTarget;
    const datos = new FormData(form);

    const actual = String(datos.get("password_actual") || "");
    const nueva = String(datos.get("password_nueva") || "");
    const confirmacion = String(
      datos.get("password_confirmacion") || "",
    );

    setErrorPassword("");

    if (nueva !== confirmacion) {
      setErrorPassword("Las contraseñas nuevas no coinciden.");
      return;
    }

    setGuardandoPassword(true);

    try {
      const response = await enviarConRenovacion(
        "POST",
        JSON.stringify({
          password_actual: actual,
          password_nueva: nueva,
          password_confirmacion: confirmacion,
        }),
      );

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorPassword(mostrarError(data));

        if (response.status >= 500) {
          setRevisarPassword(true);
        }

        return;
      }

      setRevisarPassword(true);
      form.reset();

      // Borramos las cookies mediante el cierre de sesión existente.
      const logout = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!logout.ok) {
        setErrorPassword(
          "La contraseña se actualizó, pero no pudimos cerrar la sesión. Usá el menú para cerrarla e ingresá con la nueva contraseña.",
        );
        return;
      }

      window.location.replace("/login");
    } catch {
      setErrorPassword(
        "No pudimos confirmar toda la operación. Si el cambio se guardó, tendrás que ingresar con la contraseña nueva.",
      );
      setRevisarPassword(true);
    } finally {
      setGuardandoPassword(false);
    }
  }

  return (
    <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
      <form onSubmit={guardarPerfil} className={tarjetaClass}>
        <h2 className="text-xl font-semibold">Datos personales</h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Usuario: {usuario.username}
          <br />
          Email: {usuario.email || "Sin registrar"}
        </p>

        <fieldset
          disabled={ocupado || revisarPerfil}
          className="mt-6 space-y-5"
        >
          <div>
            <label htmlFor="first_name" className="text-sm font-medium">
              Nombre
            </label>
            <input
              id="first_name"
              name="first_name"
              autoComplete="given-name"
              defaultValue={usuario.first_name}
              maxLength={150}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="last_name" className="text-sm font-medium">
              Apellido
            </label>
            <input
              id="last_name"
              name="last_name"
              autoComplete="family-name"
              defaultValue={usuario.last_name}
              maxLength={150}
              required
              className={inputClass}
            />
          </div>

          <div>
            {usuario.foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/cuenta/foto?v=${encodeURIComponent(usuario.foto)}`}
                alt="Tu foto de perfil actual"
                className="mb-4 h-24 w-24 rounded-full border border-slate-200 object-cover dark:border-slate-600"
              />
            )}

            <label htmlFor="foto" className="text-sm font-medium">
              Foto de perfil
            </label>
            <input
              id="foto"
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby="foto-ayuda"
              className={inputClass}
            />
            <p
              id="foto-ayuda"
              className="mt-2 text-xs text-slate-500 dark:text-slate-400"
            >
              JPG, PNG o WebP. Hasta 5 MB y 4096 píxeles de ancho
              o alto. Si no elegís otra foto, se conserva la actual.
            </p>
          </div>

          <button type="submit" className={botonClass}>
            {guardandoPerfil ? "Guardando..." : "Guardar perfil"}
          </button>
        </fieldset>

        {mensajePerfil && (
          <p
            role="status"
            className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200"
          >
            {mensajePerfil}
          </p>
        )}

        {errorPerfil && (
          <p role="alert" className={errorClass}>
            {errorPerfil}
          </p>
        )}

        {revisarPerfil && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-teal-700 hover:underline dark:text-teal-300"
          >
            Actualizar y revisar mi perfil
          </button>
        )}
      </form>

      <form onSubmit={guardarPassword} className={tarjetaClass}>
        <h2 className="text-xl font-semibold">Cambiar contraseña</h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Después del cambio tendrás que iniciar sesión nuevamente.
        </p>

        <fieldset
          disabled={ocupado || revisarPassword}
          className="mt-6 space-y-5"
        >
          {[
            {
              name: "password_actual",
              label: "Contraseña actual",
              autoComplete: "current-password",
              maxLength: 1024,
            },
            {
              name: "password_nueva",
              label: "Contraseña nueva",
              autoComplete: "new-password",
              maxLength: 128,
            },
            {
              name: "password_confirmacion",
              label: "Repetir contraseña nueva",
              autoComplete: "new-password",
              maxLength: 128,
            },
          ].map((campo) => (
            <div key={campo.name}>
              <label
                htmlFor={campo.name}
                className="text-sm font-medium"
              >
                {campo.label}
              </label>
              <input
                id={campo.name}
                name={campo.name}
                type="password"
                autoComplete={campo.autoComplete}
                maxLength={campo.maxLength}
                required
                className={inputClass}
              />
            </div>
          ))}

          <button type="submit" className={botonClass}>
            {guardandoPassword
              ? "Actualizando..."
              : "Cambiar contraseña"}
          </button>
        </fieldset>

        {errorPassword && (
          <p role="alert" className={errorClass}>
            {errorPassword}
          </p>
        )}
      </form>
    </div>
  );
}