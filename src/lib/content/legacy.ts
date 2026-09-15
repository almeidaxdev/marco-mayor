/**
 * Upgrade path for the original content format, where each post stored its category by display
 * name ({ "category": "Saúde" }) and categories were hardcoded.
 *
 * The seed categories have fixed ids so the upgrade is deterministic and idempotent: converting the
 * same legacy file twice yields byte-identical output, and a legacy file read by the admin during a
 * deploy transition maps to the same ids that the migrated repository file already uses.
 */
export const LEGACY_CATEGORIES = [
  { id: "1110b540-d087-4078-9d64-4576e8c42485", name: "Saúde", slug: "saude", icon: "health", order: 1 },
  { id: "ce8405e5-6e59-438c-aa7f-cf80650983df", name: "Inclusão", slug: "inclusao", icon: "inclusion", order: 2 },
  { id: "51b0fded-f355-4ce7-8b5c-da3f29d7a13c", name: "Bairros", slug: "bairros", icon: "neighborhoods", order: 3 },
] as const;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isLegacyContent(data: unknown): boolean {
  return isRecord(data) && !("categories" in data) && Array.isArray(data.posts);
}

/**
 * Returns the content in the current format. Non-legacy input is returned untouched (validation
 * happens afterwards in ContentFileSchema). Unknown legacy category names throw instead of guessing.
 */
export function upgradeLegacyContent(data: unknown): unknown {
  if (!isLegacyContent(data)) return data;
  const legacy = data as UnknownRecord & { posts: unknown[] };
  const byName = new Map<string, string>(LEGACY_CATEGORIES.map((category) => [category.name, category.id]));

  const posts = legacy.posts.map((post, index) => {
    if (!isRecord(post) || !("category" in post)) return post;
    const categoryId = typeof post.category === "string" ? byName.get(post.category) : undefined;
    if (!categoryId) {
      throw new Error(`Categoria legada desconhecida em posts[${index}]: ${JSON.stringify(post.category)}`);
    }
    // Rebuild the object so categoryId takes the exact position "category" had.
    return Object.fromEntries(
      Object.entries(post).map(([key, value]) => (key === "category" ? ["categoryId", categoryId] : [key, value])),
    );
  });

  return { categories: LEGACY_CATEGORIES.map((category) => ({ ...category })), posts };
}
