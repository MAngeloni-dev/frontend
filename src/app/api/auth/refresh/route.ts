import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || new URL(origin).host !== host) {
    return NextResponse.json(
      { detail: "Origen de la petición no permitido." },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  function sessionExpired() {
    const response = NextResponse.json(
      { detail: "La sesión venció. Iniciá sesión nuevamente." },
      { status: 401 },
    );

    response.cookies.set("access_token", "", {
      ...options,
      maxAge: 0,
    });
    response.cookies.set("refresh_token", "", {
      ...options,
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "no-store");

    return response;
  }

  if (!refreshToken) {
    return sessionExpired();
  }

  const apiUrl = process.env.DJANGO_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { detail: "La conexión del servidor no está configurada." },
      { status: 500 },
    );
  }

  try {
    const djangoResponse = await fetch(
      `${apiUrl}/api/token/refresh/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (
      djangoResponse.status === 400 ||
      djangoResponse.status === 401
    ) {
      return sessionExpired();
    }

    if (!djangoResponse.ok) {
      return NextResponse.json(
        { detail: "No pudimos renovar la sesión." },
        { status: 502 },
      );
    }

    const tokens = await djangoResponse.json();

    if (typeof tokens.access !== "string") {
      return NextResponse.json(
        { detail: "El servidor devolvió una respuesta inesperada." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("access_token", tokens.access, {
      ...options,
      maxAge: 5 * 60,
    });
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch {
    return NextResponse.json(
      { detail: "No pudimos conectar con el servidor." },
      { status: 502 },
    );
  }
}