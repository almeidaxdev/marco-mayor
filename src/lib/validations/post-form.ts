import * as z from "zod";

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((value) => value === "on" || value === "true");

export const PostFormSchema = z.object({
  id: z.uuid().optional(),
  version: z.string().min(1, { error: "Versão ausente. Recarregue a página." }),
  // Existence is checked on the server against the current content, not just the format.
  categoryId: z.uuid({ error: "Escolha uma categoria." }),
  title: z
    .string()
    .trim()
    .min(3, { error: "O título precisa ter pelo menos 3 caracteres." })
    .max(120, { error: "Use no máximo 120 caracteres." }),
  excerpt: z.string().trim().max(280, { error: "Use no máximo 280 caracteres." }),
  externalUrl: z
    .string()
    .trim()
    .max(500, { error: "Link muito longo." })
    .transform((value) => (value === "" ? null : value))
    .pipe(z.url({ protocol: /^https$/, error: "Informe um link completo começando com https://" }).nullable()),
  published: checkbox,
  featured: checkbox,
  order: z.coerce
    .number({ error: "Informe um número." })
    .int({ error: "Use um número inteiro." })
    .min(0, { error: "Use 0 ou mais." })
    .max(9999, { error: "Use no máximo 9999." }),
  imageMode: z.enum(["keep", "upload", "remove"]).default("keep"),
});

export type PostFormValues = z.infer<typeof PostFormSchema>;

export type FieldErrors = Partial<
  Record<"categoryId" | "title" | "excerpt" | "externalUrl" | "order" | "image" | "name" | "icon", string>
>;

export type ActionResult =
  | { status: "idle" }
  | { status: "success"; message: string; postId?: string; categoryId?: string }
  | { status: "error"; message: string; fieldErrors?: FieldErrors }
  | { status: "conflict"; message: string };
