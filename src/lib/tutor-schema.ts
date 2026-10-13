import { z } from "zod";

export const tutorSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá el nombre.").max(100),
  apellido: z.string().trim().min(1, "Ingresá el apellido.").max(100),
  dni: z.string().trim().max(20),
  telefono: z
    .string()
    .trim()
    .min(1, "Ingresá un teléfono.")
    .max(30),
  email: z.union([
    z.literal(""),
    z.string().trim().email("Ingresá un email válido."),
  ]),
  direccion: z.string().trim().max(255),
  observaciones: z.string().trim(),
});

export type TutorFormValues = z.infer<typeof tutorSchema>;