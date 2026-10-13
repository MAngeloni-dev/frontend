export default function EditarPacienteLoading() {
  return (
    <main aria-busy="true">
      <h1 className="text-3xl font-bold">Editar paciente</h1>

      <p role="status" className="mt-2 text-slate-600">
        Cargando los datos...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 h-96 max-w-2xl animate-pulse rounded-2xl bg-slate-200"
      />
    </main>
  );
}