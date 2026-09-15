import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PostsFileSchema, POST_IMAGE_PATTERN } from "./schema";
import {
  ContentConflictError,
  serializePosts,
  type CommitInput,
  type ContentSnapshot,
  type PostRepository,
} from "./repository";

// Literal segments keep file tracing scoped to these folders.
const postsFile = path.join(process.cwd(), "content", "posts.json");
const imagesDir = path.join(process.cwd(), "public", "posts");

function hash(content: string) {
  return createHash("sha256").update(content).digest("hex").slice(0, 40);
}

function resolveImagePath(publicPath: string): string {
  if (!POST_IMAGE_PATTERN.test(publicPath)) {
    throw new Error("Caminho de imagem inválido.");
  }
  const fileName = path.basename(publicPath);
  const resolved = path.join(process.cwd(), "public", "posts", fileName);
  if (path.dirname(resolved) !== imagesDir) {
    throw new Error("Caminho de imagem inválido.");
  }
  return resolved;
}

let queue: Promise<unknown> = Promise.resolve();

export class LocalPostRepository implements PostRepository {
  readonly driver = "local" as const;

  async read(): Promise<ContentSnapshot> {
    const raw = await readFile(postsFile, "utf8");
    const file = PostsFileSchema.parse(JSON.parse(raw));
    return { posts: file.posts, version: hash(raw) };
  }

  commit(input: CommitInput): Promise<{ version: string }> {
    const run = queue.then(() => this.write(input));
    queue = run.catch(() => undefined);
    return run;
  }

  private async write({ posts, expectedVersion, uploads = [], deletions = [] }: CommitInput) {
    const current = await readFile(postsFile, "utf8");
    if (hash(current) !== expectedVersion) {
      throw new ContentConflictError();
    }

    const next = serializePosts(PostsFileSchema.parse({ posts }).posts);

    await mkdir(imagesDir, { recursive: true });
    for (const upload of uploads) {
      await writeFile(resolveImagePath(upload.publicPath), upload.data, { flag: "wx" });
    }

    const tmp = `${postsFile}.${randomUUID()}.tmp`;
    await writeFile(tmp, next, "utf8");
    await rename(tmp, postsFile);

    for (const publicPath of deletions) {
      await unlink(resolveImagePath(publicPath)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
    }

    return { version: hash(next) };
  }
}
