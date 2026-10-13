import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { consultaSchema } from "@/lib/consulta-schema";

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
      { detail: "Paciente inválido." },
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
  const validation = consultaSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { detail: "Revisá los datos de la consulta." },
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
    const response = await fetch(`${apiUrl}/api/consultas/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paciente: Number(id),
        motivo: values.motivo,
        sintomas: values.sintomas,
        diagnostico: values.diagnostico,
        tratamiento: values.tratamiento,
        observaciones: values.observaciones,
        peso: values.peso
          ? values.peso.replace(",", ".")
          : null,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if ([400, 401, 403, 404].includes(response.status)) {
      return NextResponse.json(await response.json(), {
        status: response.status,
      });
    }

    if (response.status !== 201) {
      return NextResponse.json(
        { detail: "No pudimos guardar la consulta." },
        { status: 502 },
      );
    }

    const consulta = await response.json();

    return NextResponse.json(
      { id: consulta.id },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el guardado. Revisá el historial antes de intentar nuevamente.",
      },
      { status: 502 },
    );
  }
}