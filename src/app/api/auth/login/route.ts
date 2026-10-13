import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(150),
  password: z.string().min(1).max(1024),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || new URL(origin).host !== host) {
    return NextResponse.json(
      { detail: "Origen de la petición no permitido." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const validation = loginSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { detail: "Completá usuario y contraseña." },
      { status: 400 },
    );
  }

  const apiUrl = process.env.DJANGO_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { detail: "La conexión del servidor no está configurada." },
      { status: 500 },
    );
  }

  try {
    const djangoResponse = await fetch(`${apiUrl}/api/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validation.data),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (djangoResponse.status === 401) {
      return NextResponse.json(
        { detail: "Usuario o contraseña incorrectos." },
        { status: 401 },
      );
    }

    if (!djangoResponse.ok) {
      return NextResponse.json(
        { detail: "No pudimos iniciar sesión. Intentá nuevamente." },
        { status: 502 },
      );
    }

    const tokens = await djangoResponse.json();

    if (
      typeof tokens.access !== "string" ||
      typeof tokens.refresh !== "string"
    ) {
      return NextResponse.json(
        { detail: "El servidor devolvió una respuesta inesperada." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ success: true });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    // Coinciden con las duraciones predeterminadas de SimpleJWT.
    response.cookies.set("access_token", tokens.access, {
      ...cookieOptions,
      maxAge: 5 * 60,
    });

    response.cookies.set("refresh_token", tokens.refresh, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60,
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