import { z } from "zod";

export const pacienteSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, "Ingresá el nombre.")
      .max(100, "Máximo 100 caracteres."),
    especie: z
      .string()
      .regex(/^[1-9]\d*$/, "Seleccioná una especie."),
    raza: z.string().regex(/^$|^[1-9]\d*$/, "Raza inválida."),
    sexo: z.enum(["MACHO", "HEMBRA", "DESCONOCIDO"]),
    color: z.string().trim().max(100),
    fecha_nacimiento: z
      .string()
      .regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
    nacimiento_estimado: z.boolean(),
    castrado: z.enum(["SI", "NO", "DESCONOCIDO"]),
    microchip: z.string().trim().max(50),
    observaciones: z.string().trim(),
  })
  .refine(
    (values) =>
      !values.nacimiento_estimado || Boolean(values.fecha_nacimiento),
    {
      message: "Indicá una fecha de nacimiento estimada.",
      path: ["fecha_nacimiento"],
    },
  );

export type PacienteFormValues = z.infer<typeof pacienteSchema>;

export function pacientePayload(values: PacienteFormValues) {
  return {
    nombre: values.nombre,
    especie: Number(values.especie),
    raza: values.raza ? Number(values.raza) : null,
    sexo: values.sexo,
    color: values.color,
    fecha_nacimiento: values.fecha_nacimiento || null,
    nacimiento_estimado: values.nacimiento_estimado,
    castrado: values.castrado,
    microchip: values.microchip || null,
    observaciones: values.observaciones,
  };
}