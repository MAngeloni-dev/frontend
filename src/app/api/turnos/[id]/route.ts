import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { turnoSchema } from "@/lib/turno-schema";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
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

  const { id } = await context.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json(
      { detail: "Turno inválido." },
      { status: 400 },
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

  let response: Response;

  try {
    response = await fetch(`${apiUrl}/api/turnos/${id}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paciente: Number(values.paciente),
        veterinario: Number(values.veterinario),
        inicio: `${values.inicio}:00-03:00`,
        fin: `${values.fin}:00-03:00`,
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
          "No pudimos confirmar la actualización. Revisá la ficha del turno antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  if ([400, 401, 403, 404, 409].includes(response.status)) {
    const errors = await response.json().catch(() => ({
      detail: "No pudimos actualizar el turno.",
    }));

    return NextResponse.json(errors, {
      status: response.status,
    });
  }

  if (response.status !== 200) {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar la actualización. Revisá la ficha del turno antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ id: Number(id) });
}