export default function TutoresLoading() {
  return (
    <main aria-busy="true">
      <h1 className="text-3xl font-bold">Tutores</h1>

      <p role="status" className="mt-2 text-slate-600">
        Cargando tutores...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 h-48 animate-pulse rounded-2xl bg-slate-200"
      />
    </main>
  );
}