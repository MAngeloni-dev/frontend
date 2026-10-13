import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export async function djangoGet<T>(
  endpoint: string,
  returnTo: string,
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  function renewOrLogin(): never {
    if (cookieStore.has("refresh_token")) {
      redirect(
        `/renovar-sesion?next=${encodeURIComponent(returnTo)}`,
      );
    }

    redirect("/login");
  }

  if (!accessToken) {
    renewOrLogin();
  }

  const apiUrl = process.env.DJANGO_API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar DJANGO_API_URL.");
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    renewOrLogin();
  }
  if (response.status === 404) {
    notFound();
  }
  if (!response.ok) {
    throw new Error(
      `No se pudo consultar Django. Estado: ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}