import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { turnoSchema } from "@/lib/turno-schema";

export async function POST(request: Request) {
  // Verificar que la petición provenga de nuestra aplicación.
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

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { detail: "La sesión venció." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const validation = turnoSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        detail: "Revisá los datos del turno.",
        ...validation.error.flatten().fieldErrors,
      },
      { status: 400 },
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

  const values = validation.data;

  // datetime-local no incluye zona horaria.
  // Interpretamos ambos valores como horarios de Argentina.
  const inicio = `${values.inicio}:00-03:00`;
  const fin = `${values.fin}:00-03:00`;

  let response: Response;

  try {
    response = await fetch(`${apiUrl}/api/turnos/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paciente: Number(values.paciente),
        veterinario: Number(values.veterinario),
        inicio,
        fin,
        motivo: values.motivo,
        observaciones: values.observaciones,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el guardado. Revisá el listado de turnos antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  if ([400, 401, 403, 404, 409].includes(response.status)) {
    const errors = await response.json().catch(() => ({
      detail: "No pudimos registrar el turno.",
    }));

    return NextResponse.json(errors, {
      status: response.status,
    });
  }

  if (response.status !== 201) {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el guardado. Revisá el listado de turnos antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  // El 201 confirma la creación, aunque no podamos leer su cuerpo.
  const turno = await response.json().catch(() => null);

  return NextResponse.json(
    { id: turno?.id ?? null },
    { status: 201 },
  );
}