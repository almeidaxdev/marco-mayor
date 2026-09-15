import * as z from "zod";
import { CATEGORY_ICON_KEYS } from "./category-icons";

export const POST_IMAGE_PATTERN = /^\/posts\/[a-z0-9][a-z0-9-]{0,80}\.(webp|jpg|jpeg|png)$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Category names: letters (any script, with accents), digits, spaces and a few punctuation marks.
 * Rules out markup, quotes, colons (e.g. "javascript:"), backslashes and control characters.
 */
export const CATEGORY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} &'(),./-]*$/u;
export const CATEGORY_NAME_MIN = 2;
export const CATEGORY_NAME_MAX = 40;

const isoDate = z.iso.datetime({ offset: true });

/** Canonical form stored in content: NFC, trimmed, single spaces. */
export function normalizeCategoryName(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}

/** Comparison key for duplicate detection: ignores case and extra spaces. */
export function categoryNameKey(value: string): string {
  return normalizeCategoryName(value).toLocaleLowerCase("pt-BR");
}

export const CategorySchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .min(CATEGORY_NAME_MIN)
    .max(CATEGORY_NAME_MAX)
    .regex(CATEGORY_NAME_PATTERN)
    .refine((value) => value === normalizeCategoryName(value), { message: "Nome com espaços extras." }),
  slug: z.string().min(1).max(48).regex(SLUG_PATTERN),
  icon: z.enum(CATEGORY_ICON_KEYS),
  order: z.number().int().min(0).max(9999),
});

export type Category = z.infer<typeof CategorySchema>;

export const PostSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1).max(96).regex(SLUG_PATTERN),
  categoryId: z.uuid(),
  title: z.string().trim().min(1).max(120),
  excerpt: z.string().trim().max(280),
  image: z.string().regex(POST_IMAGE_PATTERN).nullable(),
  externalUrl: z.url({ protocol: /^https$/ }).nullable(),
  published: z.boolean(),
  featured: z.boolean(),
  order: z.number().int().min(0).max(9999),
  publishedAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export type Post = z.infer<typeof PostSchema>;

export const ContentFileSchema = z
  .object({
    categories: z.array(CategorySchema).max(100),
    posts: z.array(PostSchema),
  })
  .superRefine((file, ctx) => {
    const categoryIds = new Set<string>();
    const categorySlugs = new Set<string>();
    const categoryNames = new Set<string>();
    file.categories.forEach((category, index) => {
      const key = categoryNameKey(category.name);
      if (categoryIds.has(category.id)) {
        ctx.addIssue({ code: "custom", message: `ID de categoria duplicado: ${category.id}`, path: ["categories", index, "id"] });
      }
      if (categorySlugs.has(category.slug)) {
        ctx.addIssue({ code: "custom", message: `Slug de categoria duplicado: ${category.slug}`, path: ["categories", index, "slug"] });
      }
      if (categoryNames.has(key)) {
        ctx.addIssue({ code: "custom", message: `Nome de categoria duplicado: ${category.name}`, path: ["categories", index, "name"] });
      }
      categoryIds.add(category.id);
      categorySlugs.add(category.slug);
      categoryNames.add(key);
    });

    const ids = new Set<string>();
    const slugs = new Set<string>();
    file.posts.forEach((post, index) => {
      if (ids.has(post.id)) {
        ctx.addIssue({ code: "custom", message: `ID duplicado: ${post.id}`, path: ["posts", index, "id"] });
      }
      if (slugs.has(post.slug)) {
        ctx.addIssue({ code: "custom", message: `Slug duplicado: ${post.slug}`, path: ["posts", index, "slug"] });
      }
      if (!categoryIds.has(post.categoryId)) {
        ctx.addIssue({
          code: "custom",
          message: `Categoria inexistente (${post.categoryId}) em "${post.title}"`,
          path: ["posts", index, "categoryId"],
        });
      }
      ids.add(post.id);
      slugs.add(post.slug);
    });
  });

export type ContentFile = z.infer<typeof ContentFileSchema>;

export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "pt-BR"));
}

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "pt-BR"));
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
