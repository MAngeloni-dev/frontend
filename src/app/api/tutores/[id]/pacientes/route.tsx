import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  pacienteSchema,
  pacientePayload,
} from "@/lib/paciente-schema";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || new URL(origin).host !== host) {
    return NextResponse.json(
      { detail: "Origen de la petición no permitido." },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json(
      { detail: "Tutor inválido." },
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
  const validation = pacienteSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { detail: "Revisá los datos del paciente." },
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

  const values = validation.data;

  try {
    const response = await fetch(`${apiUrl}/api/pacientes/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...pacientePayload(values),
        tutor: Number(id),
        activo: true,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if ([400, 401, 403, 404].includes(response.status)) {
      const errors = await response.json();

      return NextResponse.json(errors, {
        status: response.status,
      });
    }

    if (response.status !== 201) {
      return NextResponse.json(
        { detail: "No pudimos guardar el paciente." },
        { status: 502 },
      );
    }

    const paciente = await response.json();

    return NextResponse.json(
      { id: paciente.id },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el guardado. Revisá la ficha del tutor antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }
}