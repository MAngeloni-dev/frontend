import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const accionesPermitidas = new Set([
  "confirmar",
  "cancelar",
  "atender",
]);

type Context = {
  params: Promise<{
    id: string;
    accion: string;
  }>;
};

export async function POST(
  request: Request,
  context: Context,
) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  let origenPermitido = false;

  try {
    origenPermitido =
      origin !== null &&
      host !== null &&
      new URL(origin).host === host;
  } catch {
    origenPermitido = false;
  }

  if (!origenPermitido) {
    return NextResponse.json(
      { detail: "Origen de la petición no permitido." },
      { status: 403 },
    );
  }

  const { id, accion } = await context.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json(
      { detail: "Turno inválido." },
      { status: 400 },
    );
  }

  if (!accionesPermitidas.has(accion)) {
    return NextResponse.json(
      { detail: "Acción no encontrada." },
      { status: 404 },
    );
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
      {
        detail: "La conexión del servidor no está configurada.",
      },
      { status: 500 },
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl}/api/turnos/${id}/${accion}/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el cambio. Revisá el estado del turno antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  if ([400, 401, 403, 404, 409].includes(response.status)) {
    const errors = await response.json().catch(() => ({
      detail: "No pudimos realizar la operación.",
    }));

    return NextResponse.json(errors, {
      status: response.status,
    });
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el cambio. Revisá el estado del turno antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}