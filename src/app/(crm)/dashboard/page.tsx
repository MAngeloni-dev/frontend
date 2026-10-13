import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Paciente = {
  id: number;
  nombre: string;
  activo: boolean;
};

type PacientesResponse = {
  count: number;
  results: Paciente[];
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    if (cookieStore.has("refresh_token")) {
      redirect("/renovar-sesion");
    }

    redirect("/login");
  }

  const apiUrl = process.env.DJANGO_API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar DJANGO_API_URL.");
  }

  const response = await fetch(`${apiUrl}/api/pacientes/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    if (cookieStore.has("refresh_token")) {
      redirect("/renovar-sesion");
    }

    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("No se pudo consultar la lista de pacientes.");
  }

  const data: PacientesResponse = await response.json();

  return (
    <main>
      <h1 className="text-3xl font-bold text-slate-900">
        Inicio
      </h1>

      <p className="mt-2 text-slate-600">
        Consultá los pacientes registrados en la clínica.
      </p>

      <section className="mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Pacientes registrados
        </p>

        <p className="mt-2 text-4xl font-bold text-teal-700">
          {data.count}
        </p>

        <h2 className="mt-6 font-semibold">
          Listado de pacientes
        </h2>

        {data.results.length === 0 ? (
          <p className="mt-4 text-slate-600">
            Todavía no hay pacientes registrados.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {data.results.map((paciente) => (
              <li
                key={paciente.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="font-medium">
                  {paciente.nombre}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    paciente.activo
                      ? "bg-teal-50 text-teal-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {paciente.activo ? "Activo" : "Inactivo"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}