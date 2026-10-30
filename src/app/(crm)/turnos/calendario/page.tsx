import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { djangoGetAll } from "@/lib/django-list";

type Turno = {
  id: number;
  paciente_nombre: string;
  veterinario_nombre: string;
  inicio: string;
  fin: string;
  estado: "PENDIENTE" | "CONFIRMADO" | "ATENDIDO" | "CANCELADO";
};

type Props = {
  searchParams: Promise<{
    mes?: string | string[];
  }>;
};

const zona = "America/Argentina/Buenos_Aires";

const colores: Record<Turno["estado"], string> = {
  PENDIENTE: "border-amber-200 bg-amber-50 text-amber-900",
  CONFIRMADO: "border-blue-200 bg-blue-50 text-blue-900",
  ATENDIDO: "border-teal-200 bg-teal-50 text-teal-900",
  CANCELADO: "border-slate-200 bg-slate-100 text-slate-500",
};

const estados: Record<Turno["estado"], string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  CANCELADO: "Cancelado",
};

function claveMes(anio: number, mes: number) {
  const fecha = new Date(Date.UTC(anio, mes - 1, 1));

  return `${fecha.getUTCFullYear()}-${String(
    fecha.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}

function fechaArgentina(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);

  const valor = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

function hora(valor: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: zona,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(valor));
}

async function CalendarioContenido({ searchParams }: Props) {
  await connection();

  const hoy = fechaArgentina(new Date());
  const parametros = await searchParams;
  const mes = parametros.mes ?? hoy.slice(0, 7);

  if (
    typeof mes !== "string" ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)
  ) {
    notFound();
  }

  const [anio, numeroMes] = mes.split("-").map(Number);

  if (anio < 2000 || anio > 2100) {
    notFound();
  }

  const mesAnterior = claveMes(anio, numeroMes - 1);
  const mesSiguiente = claveMes(anio, numeroMes + 1);

  const inicioMes = `${mes}-01T00:00:00-03:00`;
  const finMes = `${mesSiguiente}-01T00:00:00-03:00`;

  // Incluye los turnos que se superponen con el mes,
  // aunque hayan comenzado en el mes anterior.
  const filtros = new URLSearchParams({
    inicio__lt: finMes,
    fin__gt: inicioMes,
    ordering: "inicio",
  });

  const turnos = await djangoGetAll<Turno>(
    `/api/turnos/?${filtros}`,
    `/turnos/calendario?mes=${mes}`,
  );

  const primerDia = new Date(Date.UTC(anio, numeroMes - 1, 1));
  const cantidadDias = new Date(
    Date.UTC(anio, numeroMes, 0),
  ).getUTCDate();

  // Convertimos domingo=0 a una semana que empieza el lunes.
  const espacios = (primerDia.getUTCDay() + 6) % 7;
  const cantidadCeldas =
    Math.ceil((espacios + cantidadDias) / 7) * 7;

  const titulo = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(primerDia);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold capitalize">
          {titulo}
        </h2>

        <nav
          aria-label="Navegación del calendario"
          className="flex flex-wrap gap-2"
        >
          <Link
            href={`/turnos/calendario?mes=${mesAnterior}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            ← Anterior
          </Link>

          <Link
            href="/turnos/calendario"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Mes actual
          </Link>

          <Link
            href={`/turnos/calendario?mes=${mesSiguiente}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Siguiente →
          </Link>
        </nav>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {Object.entries(estados).map(([estado, nombre]) => (
          <span
            key={estado}
            className={`rounded-full border px-3 py-1 ${
              colores[estado as Turno["estado"]]
            }`}
          >
            {nombre}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Horarios de Argentina. Seleccioná un turno para ver
        sus datos y acciones.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="min-w-[840px]">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
              (dia) => (
                <div
                  key={dia}
                  className="p-3 text-center text-sm font-semibold"
                >
                  {dia}
                </div>
              ),
            )}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: cantidadCeldas }, (_, indice) => {
              const dia = indice - espacios + 1;

              if (dia < 1 || dia > cantidadDias) {
                return (
                  <div
                    key={indice}
                    aria-hidden="true"
                    className="min-h-36 border-b border-r border-slate-100 bg-slate-50"
                  />
                );
              }

              const fecha = `${mes}-${String(dia).padStart(2, "0")}`;
              const inicioDia = Date.parse(
                `${fecha}T00:00:00-03:00`,
              );
              const finDia = inicioDia + 24 * 60 * 60 * 1000;

              const turnosDia = turnos.filter(
                (turno) =>
                  Date.parse(turno.inicio) < finDia &&
                  Date.parse(turno.fin) > inicioDia,
              );

              return (
                <section
                  key={indice}
                  aria-label={`Turnos del ${dia} de ${titulo}`}
                  className={`min-h-36 border-b border-r border-slate-100 p-2 ${
                    fecha === hoy ? "bg-teal-50/50" : ""
                  }`}
                >
                  <time
                    dateTime={fecha}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                      fecha === hoy
                        ? "bg-teal-700 text-white"
                        : "text-slate-700"
                    }`}
                  >
                    {dia}
                  </time>

                  <div className="mt-2 space-y-2">
                    {turnosDia.map((turno) => {
                      const comienzaHoy =
                        fechaArgentina(new Date(turno.inicio)) === fecha;

                      return (
                        <Link
                          key={turno.id}
                          href={`/turnos/${turno.id}`}
                          className={`block rounded-lg border p-2 text-xs hover:shadow-sm ${colores[turno.estado]}`}
                        >
                          <span className="block font-semibold">
                            {comienzaHoy
                              ? hora(turno.inicio)
                              : "Continúa"}{" "}
                            · {turno.paciente_nombre}
                          </span>

                          <span className="mt-1 block break-words">
                            {turno.veterinario_nombre}
                          </span>

                          <span className="mt-1 block">
                            {estados[turno.estado]}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {turnos.length === 0 && (
        <p role="status" className="mt-4 text-slate-600">
          No hay turnos registrados para este mes.
        </p>
      )}
    </>
  );
}

export default function CalendarioPage(props: Props) {
  return (
    <main>
      <Link
        href="/turnos"
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Volver al listado
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Calendario de turnos
        </h1>

        <Link
          href="/turnos/nuevo"
          className="rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800"
        >
          Agendar turno
        </Link>
      </div>

      <Suspense
        fallback={
          <p role="status" className="mt-6 text-slate-600">
            Cargando calendario...
          </p>
        }
      >
        <CalendarioContenido {...props} />
      </Suspense>
    </main>
  );
}