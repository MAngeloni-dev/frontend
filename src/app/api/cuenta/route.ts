import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function consultarCuenta(
  request: Request,
  operacion: "consultar" | "perfil" | "password",
) {
  if (operacion !== "consultar") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    try {
      if (!origin || new URL(origin).host !== host) {
        return NextResponse.json(
          { detail: "Origen de la petición no permitido." },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { detail: "Origen de la petición no permitido." },
        { status: 403 },
      );
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "La sesión venció." },
      { status: 401 },
    );
  }

  const apiUrl = process.env.DJANGO_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { detail: "Falta configurar la conexión con Django." },
      { status: 500 },
    );
  }

  const headers = new Headers({
    Authorization: `Bearer ${token}`,
  });

  let endpoint = "/api/usuarios/me/";
  let method = "GET";
  let body: FormData | string | undefined;

  if (operacion === "perfil") {
    const recibido = await request.formData().catch(() => null);

    if (!recibido) {
      return NextResponse.json(
        { detail: "No pudimos leer el formulario." },
        { status: 400 },
      );
    }

    const nombre = recibido.get("first_name");
    const apellido = recibido.get("last_name");

    if (
      typeof nombre !== "string" ||
      typeof apellido !== "string" ||
      !nombre.trim() ||
      !apellido.trim() ||
      nombre.trim().length > 150 ||
      apellido.trim().length > 150
    ) {
      return NextResponse.json(
        { detail: "Revisá el nombre y el apellido." },
        { status: 400 },
      );
    }

    const datos = new FormData();
    datos.set("first_name", nombre.trim());
    datos.set("last_name", apellido.trim());

    const foto = recibido.get("foto");

    if (foto instanceof File && foto.size > 0) {
      if (
        foto.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(
          foto.type,
        )
      ) {
        return NextResponse.json(
          { detail: "Usá una foto JPG, PNG o WebP de hasta 5 MB." },
          { status: 400 },
        );
      }

      datos.set("foto", foto);
    }

    endpoint = "/api/usuarios/me/perfil/";
    method = "PATCH";
    body = datos;
  }

  if (operacion === "password") {
    const recibido = await request.json().catch(() => null);

    const campos = [
      "password_actual",
      "password_nueva",
      "password_confirmacion",
    ] as const;

    if (
      !recibido ||
      campos.some(
        (campo) =>
          typeof recibido[campo] !== "string" ||
          recibido[campo].length === 0 ||
          recibido[campo].length >
            (campo === "password_actual" ? 1024 : 128),
      )
    ) {
      return NextResponse.json(
        { detail: "Completá correctamente las contraseñas." },
        { status: 400 },
      );
    }

    if (
      recibido.password_nueva !== recibido.password_confirmacion
    ) {
      return NextResponse.json(
        { detail: "Las contraseñas nuevas no coinciden." },
        { status: 400 },
      );
    }

    endpoint = "/api/usuarios/me/password/";
    method = "POST";
    headers.set("Content-Type", "application/json");

    body = JSON.stringify({
      password_actual: recibido.password_actual,
      password_nueva: recibido.password_nueva,
      password_confirmacion: recibido.password_confirmacion,
    });
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}${endpoint}`,
      {
        method,
        headers,
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    const data: unknown = await response
      .json()
      .catch(() => null);

    if ([400, 401, 403, 404].includes(response.status)) {
      return NextResponse.json(
        data || { detail: "No pudimos realizar la operación." },
        { status: response.status },
      );
    }

    if (!response.ok || !data) {
      return NextResponse.json(
        {
          detail:
            "No pudimos confirmar la operación. Revisá tu cuenta antes de intentar nuevamente.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar la operación. Revisá tu cuenta antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  return consultarCuenta(request, "consultar");
}

export async function PATCH(request: Request) {
  return consultarCuenta(request, "perfil");
}

export async function POST(request: Request) {
  return consultarCuenta(request, "password");
}