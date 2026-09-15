import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseContentFile } from "./content-file";
import { sortCategories, sortPosts, type Category, type Post } from "./schema";

export type PublishedPost = Post & { category: Category };

export type PublishedContent = {
  posts: PublishedPost[];
  /** Categories with at least one published post, in admin order. */
  categories: Category[];
};

/**
 * The public site always reads the posts.json bundled with the current build.
 * In production, admin edits land as GitHub commits, which trigger a redeploy.
 */
export async function getPublishedPosts(): Promise<PublishedContent> {
  const raw = await readFile(path.join(process.cwd(), "content", "posts.json"), "utf8");
  const file = parseContentFile(raw);
  const categories = new Map(file.categories.map((category) => [category.id, category]));

  // The schema guarantees every categoryId resolves.
  const published = sortPosts(file.posts.filter((post) => post.published)).map((post) => ({
    ...post,
    category: categories.get(post.categoryId)!,
  }));
  const used = new Set(published.map((post) => post.categoryId));

  return {
    posts: [...published.filter((post) => post.featured), ...published.filter((post) => !post.featured)],
    categories: sortCategories(file.categories.filter((category) => used.has(category.id))),
  };
}
