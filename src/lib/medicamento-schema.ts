import { z } from "zod";

export const unidadesContenido = [
  "ML",
  "G",
  "COMPRIMIDO",
  "CAPSULA",
  "DOSIS",
  "UNIDAD",
] as const;

export const viasAdministracion = [
  "ORAL",
  "SUBCUTANEA",
  "INTRAMUSCULAR",
  "INTRAVENOSA",
  "TOPICA",
  "OFTALMICA",
  "OTICA",
  "OTRA",
] as const;

export const medicamentoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Ingresá el nombre.")
    .max(150, "El nombre admite hasta 150 caracteres."),

  laboratorio: z
    .string()
    .trim()
    .max(150, "El laboratorio admite hasta 150 caracteres."),

  principio_activo: z
    .string()
    .trim()
    .min(1, "Ingresá el principio activo.")
    .max(200, "Admite hasta 200 caracteres."),

  concentracion: z
    .string()
    .trim()
    .min(1, "Ingresá la concentración.")
    .max(100, "Admite hasta 100 caracteres."),

  presentacion: z
    .string()
    .trim()
    .min(1, "Ingresá la presentación.")
    .max(100, "Admite hasta 100 caracteres."),

  contenido_neto: z
    .string()
    .trim()
    .regex(
      /^\d{1,7}(\.\d{1,3})?$/,
      "Usá hasta 7 enteros y 3 decimales, con punto decimal.",
    )
    .refine(
      (valor) => Number(valor) > 0,
      "El contenido debe ser mayor que cero.",
    ),

  unidad_contenido: z.enum(unidadesContenido),

  codigo_barras: z
    .string()
    .trim()
    .max(100, "El código admite hasta 100 caracteres."),

  via_administracion: z.enum(viasAdministracion),

  especies: z.array(
    z
      .string()
      .regex(/^[1-9]\d*$/, "Seleccioná una especie válida.")
      .refine(
        (valor) => Number.isSafeInteger(Number(valor)),
        "Seleccioná una especie válida.",
      ),
  ),

  stock_minimo: z
    .string()
    .regex(/^(0|[1-9]\d*)$/, "Ingresá un entero mayor o igual a cero.")
    .refine(
      (valor) =>
        Number.isSafeInteger(Number(valor)) &&
        Number(valor) <= 2147483647,
      "El máximo permitido es 2147483647.",
    ),

  observaciones: z.string().trim(),
});

export type MedicamentoFormValues = z.infer<
  typeof medicamentoSchema
>;

export function medicamentoPayload(
  values: MedicamentoFormValues,
) {
  return {
    ...values,
    codigo_barras: values.codigo_barras || null,
    especies: [...new Set(values.especies.map(Number))],
    stock_minimo: Number(values.stock_minimo),
  };
}