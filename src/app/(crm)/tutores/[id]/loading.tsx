export default function TutorDetalleLoading() {
  return (
    <main aria-busy="true">
      <p role="status" className="text-slate-600">
        Cargando la ficha del tutor...
      </p>

      <div
        aria-hidden="true"
        className="mt-6 grid animate-pulse gap-6 lg:grid-cols-3"
      >
        <div className="h-72 rounded-2xl bg-slate-200" />
        <div className="h-72 rounded-2xl bg-slate-200 lg:col-span-2" />
      </div>
    </main>
  );
}