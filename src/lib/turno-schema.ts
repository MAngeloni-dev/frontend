import { z } from "zod";

const identificador = z
  .string()
  .regex(/^[1-9]\d*$/, "Seleccioná una opción válida.");

function esFechaValida(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  );
}

export const turnoSchema = z
  .object({
    paciente: identificador,
    veterinario: identificador,

    inicio: z
      .string()
      .refine(esFechaValida, "Ingresá una fecha y hora válidas."),

    fin: z
      .string()
      .refine(esFechaValida, "Ingresá una fecha y hora válidas."),

    motivo: z
      .string()
      .trim()
      .min(1, "Ingresá el motivo del turno.")
      .max(255, "El motivo admite hasta 255 caracteres."),

    observaciones: z.string().trim(),
  })
  .superRefine((values, context) => {
    const inicio = new Date(values.inicio).getTime();
    const fin = new Date(values.fin).getTime();

    if (
      Number.isFinite(inicio) &&
      Number.isFinite(fin) &&
      fin <= inicio
    ) {
      context.addIssue({
        code: "custom",
        path: ["fin"],
        message: "La finalización debe ser posterior al inicio.",
      });
    }
  });

export type TurnoFormValues = z.infer<typeof turnoSchema>;