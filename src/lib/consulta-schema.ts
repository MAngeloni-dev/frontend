import { z } from "zod";

export const consultaSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, "Ingresá el motivo de consulta.")
    .max(255, "Máximo 255 caracteres."),
  sintomas: z.string().trim(),
  diagnostico: z.string().trim(),
  tratamiento: z.string().trim(),
  observaciones: z.string().trim(),
  peso: z
    .string()
    .trim()
    .refine(
      (value) => {
        if (value === "") return true;

        const normalized = value.replace(",", ".");

        return (
          /^\d{1,4}(\.\d{1,3})?$/.test(normalized) &&
          Number(normalized) > 0
        );
      },
      "Ingresá un peso positivo con hasta tres decimales.",
    ),
});

export type ConsultaFormValues = z.infer<typeof consultaSchema>;