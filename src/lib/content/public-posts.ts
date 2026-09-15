import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PostsFileSchema, sortPosts, type Post } from "./schema";

/**
 * The public site always reads the posts.json bundled with the current build.
 * In production, admin edits land as GitHub commits, which trigger a redeploy.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const raw = await readFile(path.join(process.cwd(), "content", "posts.json"), "utf8");
  const file = PostsFileSchema.parse(JSON.parse(raw));
  const published = file.posts.filter((post) => post.published);
  const sorted = sortPosts(published);
  return [...sorted.filter((p) => p.featured), ...sorted.filter((p) => !p.featured)];
}
