import { upgradeLegacyContent } from "./legacy";
import { ContentFileSchema, type ContentFile } from "./schema";

/** Parses content/posts.json (current or legacy format) and validates it, including category references. */
export function parseContentFile(raw: string): ContentFile {
  return ContentFileSchema.parse(upgradeLegacyContent(JSON.parse(raw)));
}

/** Validates and serializes the whole content file. Key order follows the schema, so diffs stay small. */
export function serializeContent(content: ContentFile): string {
  const parsed = ContentFileSchema.parse(content);
  return JSON.stringify({ categories: parsed.categories, posts: parsed.posts }, null, 2) + "\n";
}
