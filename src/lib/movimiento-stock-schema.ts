import { z } from "zod";

export const tiposMovimiento = [
  "INGRESO",
  "RETIRO",
  "AJUSTE_ENTRADA",
  "AJUSTE_SALIDA",
] as const;

export const etiquetasMovimiento = {
  INGRESO: "Ingreso",
  RETIRO: "Retiro",
  AJUSTE_ENTRADA: "Ajuste de entrada",
  AJUSTE_SALIDA: "Ajuste de salida",
} satisfies Record<(typeof tiposMovimiento)[number], string>;

export const movimientoStockSchema = z.object({
  lote: z
    .string()
    .regex(/^[1-9]\d*$/, "Seleccioná un lote válido.")
    .refine(
      (value) => Number.isSafeInteger(Number(value)),
      "Seleccioná un lote válido.",
    ),

  tipo: z.enum(tiposMovimiento),

  cantidad: z
    .string()
    .regex(
      /^[1-9]\d*$/,
      "Ingresá una cantidad entera mayor que cero.",
    )
    .refine(
      (value) =>
        Number.isSafeInteger(Number(value)) &&
        Number(value) <= 2147483647,
      "La cantidad máxima es 2147483647.",
    ),

  motivo: z
    .string()
    .trim()
    .min(1, "Ingresá el motivo del movimiento.")
    .max(255, "El motivo admite hasta 255 caracteres."),

  observaciones: z.string().trim(),
});

export type MovimientoStockFormValues = z.infer<
  typeof movimientoStockSchema
>;

export function movimientoStockPayload(
  values: MovimientoStockFormValues,
) {
  return {
    lote: Number(values.lote),
    tipo: values.tipo,
    cantidad: Number(values.cantidad),
    motivo: values.motivo,
    observaciones: values.observaciones,
  };
}