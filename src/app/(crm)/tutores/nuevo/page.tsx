import TutorForm from "@/components/TutorForm";
import { djangoGet } from "@/lib/django";

export default async function NuevoTutorPage() {
  // Validar la sesión con Django antes de mostrar el formulario.
  await djangoGet<unknown>(
    "/api/tutores/?page_size=1",
    "/tutores/nuevo",
  );

  return (
    <main>
      <h1 className="text-3xl font-bold">Nuevo tutor</h1>

      <p className="mt-2 text-slate-600">
        Registrá al responsable de los pacientes.
      </p>

      <TutorForm />
    </main>
  );
}