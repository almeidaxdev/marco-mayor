import "server-only";
import { GitHubPostRepository } from "./github-repository";
import { LocalPostRepository } from "./local-repository";
import { ContentConfigError, type PostRepository } from "./repository";

export type ContentDriver = "local" | "github";

export function getContentDriver(): ContentDriver {
  const value = (process.env.CONTENT_DRIVER || "local").toLowerCase();
  if (value !== "local" && value !== "github") {
    throw new ContentConfigError('CONTENT_DRIVER deve ser "local" ou "github".');
  }
  return value;
}

export function getPostRepository(): PostRepository {
  const driver = getContentDriver();
  if (driver === "github") return new GitHubPostRepository();
  if (process.env.VERCEL) {
    throw new ContentConfigError(
      'Na Vercel o sistema de arquivos não é persistente. Configure CONTENT_DRIVER="github".',
    );
  }
  return new LocalPostRepository();
}

export { ContentConflictError, ContentConfigError } from "./repository";
