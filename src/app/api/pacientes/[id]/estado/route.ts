import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const estadoSchema = z.object({
  activo: z.boolean(),
});

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
  const validation = estadoSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { detail: "Estado inválido." },
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
    const response = await fetch(`${apiUrl}/api/pacientes/${id}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.data),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if ([400, 401, 403, 404].includes(response.status)) {
      return NextResponse.json(await response.json(), {
        status: response.status,
      });
    }

    if (response.status !== 200) {
      return NextResponse.json(
        { detail: "No pudimos actualizar el estado." },
        { status: 502 },
      );
    }

    const paciente = await response.json();

    return NextResponse.json({
      id: paciente.id,
      activo: paciente.activo,
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "No pudimos confirmar el cambio. Recargá la ficha para comprobar el estado.",
      },
      { status: 502 },
    );
  }
}