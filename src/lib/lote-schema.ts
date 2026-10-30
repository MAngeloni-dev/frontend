import { z } from "zod";

function fechaValida(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const fecha = new Date(`${valor}T00:00:00Z`);

  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
  );
}

export const loteSchema = z.object({
  numero: z
    .string()
    .trim()
    .min(1, "Ingresá el número de lote.")
    .max(100, "El número de lote admite hasta 100 caracteres."),

  fecha_vencimiento: z
    .string()
    .refine(fechaValida, "Ingresá una fecha válida."),

  observaciones: z.string().trim(),
});

export type LoteFormValues = z.infer<typeof loteSchema>;