import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { loteSchema } from "@/lib/lote-schema";

type Context = {
  params: Promise<{ id: string }>;
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

  const { id } = await context.params;

  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return NextResponse.json(
      { detail: "Medicamento inválido." },
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
  const validation = loteSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        detail: "Revisá los datos del lote.",
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
    response = await fetch(`${apiUrl}/api/lotes/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        medicamento: Number(id),
        numero: values.numero,
        fecha_vencimiento: values.fecha_vencimiento,
        observaciones: values.observaciones,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el guardado. Revisá los lotes del medicamento antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  if ([400, 401, 403, 404, 409].includes(response.status)) {
    const errors = await response.json().catch(() => ({
      detail: "No pudimos crear el lote.",
    }));

    return NextResponse.json(errors, {
      status: response.status,
    });
  }

  if (response.status !== 201) {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el guardado. Revisá los lotes del medicamento antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }

  const lote = await response.json().catch(() => null);

  return NextResponse.json(
    { id: lote?.id ?? null },
    { status: 201 },
  );
}