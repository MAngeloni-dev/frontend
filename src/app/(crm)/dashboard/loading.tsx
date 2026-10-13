export default function DashboardLoading() {
  return (
    <main aria-busy="true">
      <h1 className="text-3xl font-bold text-slate-900">
        Inicio
      </h1>

      <p role="status" className="mt-2 text-slate-600">
        Cargando los pacientes...
      </p>

      <section className="mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4" aria-hidden="true">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="h-10 w-16 rounded bg-slate-200" />
          <div className="h-12 rounded bg-slate-100" />
          <div className="h-12 rounded bg-slate-100" />
        </div>
      </section>
    </main>
  );
}