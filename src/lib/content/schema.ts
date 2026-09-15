import * as z from "zod";

export const CATEGORIES = ["Saúde", "Inclusão", "Bairros"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_SLUGS: Record<Category, string> = {
  Saúde: "saude",
  Inclusão: "inclusao",
  Bairros: "bairros",
};

export const POST_IMAGE_PATTERN = /^\/posts\/[a-z0-9][a-z0-9-]{0,80}\.(webp|jpg|jpeg|png)$/;

const isoDate = z.iso.datetime({ offset: true });

export const PostSchema = z.object({
  id: z.uuid(),
  slug: z
    .string()
    .min(1)
    .max(96)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(CATEGORIES),
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

export const PostsFileSchema = z
  .object({
    posts: z.array(PostSchema),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    const slugs = new Set<string>();
    file.posts.forEach((post, index) => {
      if (ids.has(post.id)) {
        ctx.addIssue({ code: "custom", message: `ID duplicado: ${post.id}`, path: ["posts", index, "id"] });
      }
      if (slugs.has(post.slug)) {
        ctx.addIssue({ code: "custom", message: `Slug duplicado: ${post.slug}`, path: ["posts", index, "slug"] });
      }
      ids.add(post.id);
      slugs.add(post.slug);
    });
  });

export type PostsFile = z.infer<typeof PostsFileSchema>;

export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "pt-BR"));
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
