import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const apiUrl = process.env.DJANGO_API_URL;

  if (!token) {
    return new Response(null, { status: 401 });
  }

  if (!apiUrl) {
    return new Response(null, { status: 500 });
  }

  try {
    const base = `${apiUrl.replace(/\/$/, "")}/`;

    const usuarioResponse = await fetch(
      new URL("api/usuarios/me/", base),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!usuarioResponse.ok) {
      return new Response(null, {
        status: usuarioResponse.status === 401 ? 401 : 502,
      });
    }

    const usuario = await usuarioResponse.json();

    if (typeof usuario.foto !== "string" || !usuario.foto) {
      return new Response(null, { status: 404 });
    }

    const ruta = new URL(usuario.foto, base).pathname;

    // Sólo se consulta el directorio de fotos esperado.
    if (
      !/^\/media\/perfiles\/[a-f0-9]{32}\.(jpg|jpeg|png|webp)$/i.test(
        ruta,
      )
    ) {
      return new Response(null, { status: 404 });
    }

    const fotoResponse = await fetch(new URL(ruta, base), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });

    const contentType =
      fotoResponse.headers.get("content-type")?.split(";")[0];

    if (
      !fotoResponse.ok ||
      !contentType ||
      !["image/jpeg", "image/png", "image/webp"].includes(
        contentType,
      )
    ) {
      return new Response(null, { status: 404 });
    }

    return new Response(fotoResponse.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}