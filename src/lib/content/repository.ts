import "server-only";
import type { Category, Post } from "./schema";

/** Single content file: categories and posts live together so references are validated atomically. */
export const POSTS_FILE_PATH = "content/posts.json";
export const POST_IMAGES_DIR = "public/posts";

export type ContentSnapshot = {
  categories: Category[];
  posts: Post[];
  /** Opaque token identifying the posts.json revision the caller saw. */
  version: string;
};

export type ImageUpload = {
  /** Public path, e.g. /posts/farmacia-da-solidariedade-a1b2c3.webp */
  publicPath: string;
  data: Buffer;
};

export type CommitInput = {
  categories: Category[];
  posts: Post[];
  expectedVersion: string;
  message: string;
  uploads?: ImageUpload[];
  /** Public paths (e.g. /posts/x.webp) to delete. */
  deletions?: string[];
};

export interface PostRepository {
  readonly driver: "local" | "github";
  read(): Promise<ContentSnapshot>;
  commit(input: CommitInput): Promise<{ version: string }>;
}

export class ContentConflictError extends Error {
  constructor() {
    super("O conteúdo foi alterado por outra sessão. Recarregue a página para ver a versão atual.");
    this.name = "ContentConflictError";
  }
}

export class ContentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentConfigError";
  }
}
