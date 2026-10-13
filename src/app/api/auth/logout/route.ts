import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || new URL(origin).host !== host) {
    return NextResponse.json(
      { detail: "Origen de la petición no permitido." },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ success: true });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set("access_token", "", options);
  response.cookies.set("refresh_token", "", options);
  response.headers.set("Cache-Control", "no-store");

  return response;
}