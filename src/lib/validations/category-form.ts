import * as z from "zod";
import { CATEGORY_ICON_KEYS } from "@/lib/content/category-icons";
import {
  CATEGORY_NAME_MAX,
  CATEGORY_NAME_MIN,
  CATEGORY_NAME_PATTERN,
  normalizeCategoryName,
  slugify,
} from "@/lib/content/schema";

export const CategoryFormSchema = z.object({
  id: z.uuid().optional(),
  version: z.string().min(1, { error: "Versão ausente. Recarregue a página." }),
  name: z
    .string({ error: "Informe o nome." })
    .max(200, { error: `Use no máximo ${CATEGORY_NAME_MAX} caracteres.` })
    .transform(normalizeCategoryName)
    .pipe(
      z
        .string()
        .min(CATEGORY_NAME_MIN, { error: `O nome precisa ter pelo menos ${CATEGORY_NAME_MIN} caracteres.` })
        .max(CATEGORY_NAME_MAX, { error: `Use no máximo ${CATEGORY_NAME_MAX} caracteres.` })
        .regex(CATEGORY_NAME_PATTERN, {
          error: "Use apenas letras, números, espaços e os sinais & ' ( ) , . / -",
        })
        .refine((value) => slugify(value).length > 0, { error: "O nome precisa conter letras ou números." }),
    ),
  icon: z.enum(CATEGORY_ICON_KEYS, { error: "Escolha um ícone da lista." }),
  order: z.coerce
    .number({ error: "Informe um número." })
    .int({ error: "Use um número inteiro." })
    .min(0, { error: "Use 0 ou mais." })
    .max(9999, { error: "Use no máximo 9999." }),
});

export type CategoryFormValues = z.infer<typeof CategoryFormSchema>;
