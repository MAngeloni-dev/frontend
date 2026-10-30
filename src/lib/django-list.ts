import "server-only";

import { djangoGet } from "@/lib/django";

type PaginaDjango<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function djangoGetAll<T>(
  endpoint: string,
  returnTo: string,
): Promise<T[]> {
  const registros: T[] = [];

  // Esta URL solo permite construir la ruta y sus parámetros.
  // Las peticiones las realiza djangoGet con DJANGO_API_URL.
  const ruta = new URL(endpoint, "http://django.local");

  if (
    !endpoint.startsWith("/api/") ||
    ruta.origin !== "http://django.local"
  ) {
    throw new Error("La ruta del catálogo no es válida.");
  }

  for (let pagina = 1; pagina <= 1000; pagina += 1) {
    ruta.searchParams.set("page", String(pagina));

    const respuesta = await djangoGet<PaginaDjango<T>>(
      `${ruta.pathname}${ruta.search}`,
      returnTo,
    );

    if (
      !respuesta ||
      !Array.isArray(respuesta.results) ||
      !(
        respuesta.next === null ||
        typeof respuesta.next === "string"
      )
    ) {
      throw new Error(
        "La API devolvió un listado con formato inesperado.",
      );
    }

    registros.push(...respuesta.results);

    if (respuesta.next === null) {
      return registros;
    }
  }

  throw new Error(
    "El catálogo supera el límite de páginas permitido.",
  );
}