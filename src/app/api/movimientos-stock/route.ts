import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  movimientoStockSchema,
  movimientoStockPayload,
} from "@/lib/movimiento-stock-schema";

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
  const validation = movimientoStockSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        detail: "Revisá los datos del movimiento.",
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
    response = await fetch(
      `${apiUrl}/api/movimientos-stock/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          movimientoStockPayload(validation.data),
        ),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el registro. Revisá el historial de movimientos y las existencias antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  if ([400, 401, 403, 404, 409].includes(response.status)) {
    const errors = await response.json().catch(() => ({
      detail: "No pudimos registrar el movimiento.",
    }));

    return NextResponse.json(errors, {
      status: response.status,
    });
  }

  if (response.status !== 201) {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el registro. Revisá el historial de movimientos y las existencias antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  // El 201 confirma el registro, incluso si no podemos
  // interpretar el cuerpo de la respuesta.
  const movimiento = await response.json().catch(() => null);

  return NextResponse.json(
    { id: movimiento?.id ?? null },
    { status: 201 },
  );
}