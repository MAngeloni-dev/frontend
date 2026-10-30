import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  medicamentoSchema,
  medicamentoPayload,
} from "@/lib/medicamento-schema";

export async function POST(request: Request) {
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
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "La sesión venció." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const validation = medicamentoSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        detail: "Revisá los datos del medicamento.",
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

  let response: Response;

  try {
    response = await fetch(`${apiUrl}/api/medicamentos/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        medicamentoPayload(validation.data),
      ),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el guardado. Revisá el listado de medicamentos antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  if ([400, 401, 403, 404, 409].includes(response.status)) {
    const errors = await response.json().catch(() => ({
      detail: "No pudimos crear el medicamento.",
    }));

    return NextResponse.json(errors, {
      status: response.status,
    });
  }

  if (response.status !== 201) {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el guardado. Revisá el listado de medicamentos antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  const medicamento = await response.json().catch(() => null);

  return NextResponse.json(
    { id: medicamento?.id ?? null },
    { status: 201 },
  );
}