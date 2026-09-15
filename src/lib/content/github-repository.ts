import "server-only";
import { PostsFileSchema, POST_IMAGE_PATTERN } from "./schema";
import {
  ContentConflictError,
  ContentConfigError,
  POSTS_FILE_PATH,
  POST_IMAGES_DIR,
  serializePosts,
  type CommitInput,
  type ContentSnapshot,
  type PostRepository,
} from "./repository";

type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

const API = "https://api.github.com";
const NAME_PATTERN = /^[A-Za-z0-9_.-]{1,100}$/;
const BRANCH_PATTERN = /^[A-Za-z0-9._/-]{1,200}$/;

export function readGitHubConfig(): GitHubConfig {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !owner || !repo) {
    throw new ContentConfigError("GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO precisam estar configurados no servidor.");
  }
  if (!NAME_PATTERN.test(owner) || !NAME_PATTERN.test(repo) || !BRANCH_PATTERN.test(branch)) {
    throw new ContentConfigError("GITHUB_OWNER, GITHUB_REPO ou GITHUB_BRANCH contém caracteres inválidos.");
  }
  return { token, owner, repo, branch };
}

class GitHubRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GitHubRequestError";
  }
}

export class GitHubPostRepository implements PostRepository {
  readonly driver = "github" as const;
  private readonly config: GitHubConfig;

  constructor(config = readGitHubConfig()) {
    this.config = config;
  }

  private async request<T>(method: string, route: string, body?: unknown): Promise<T> {
    const { owner, repo, token } = this.config;
    const response = await fetch(`${API}/repos/${owner}/${repo}${route}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}) as { message?: string });
      const message = typeof detail?.message === "string" ? detail.message : response.statusText;
      if (response.status === 401 || response.status === 403) {
        throw new ContentConfigError(`GitHub recusou o acesso (${response.status}). Verifique o token e suas permissões.`);
      }
      throw new GitHubRequestError(response.status, `GitHub ${response.status}: ${message}`);
    }
    return (await response.json()) as T;
  }

  private encodePath(filePath: string) {
    return filePath.split("/").map(encodeURIComponent).join("/");
  }

  private async headCommitSha(): Promise<string> {
    const ref = await this.request<{ object: { sha: string } }>(
      "GET",
      `/git/ref/heads/${this.encodePath(this.config.branch)}`,
    );
    return ref.object.sha;
  }

  private async readAt(commitSha: string) {
    const file = await this.request<{ sha: string; content: string; encoding: string }>(
      "GET",
      `/contents/${this.encodePath(POSTS_FILE_PATH)}?ref=${commitSha}`,
    );
    const raw = Buffer.from(file.content, file.encoding === "base64" ? "base64" : "utf8").toString("utf8");
    return { blobSha: file.sha, raw };
  }

  async read(): Promise<ContentSnapshot> {
    const head = await this.headCommitSha();
    const { blobSha, raw } = await this.readAt(head);
    const parsed = PostsFileSchema.parse(JSON.parse(raw));
    return { posts: parsed.posts, version: blobSha };
  }

  /**
   * Writes posts.json plus any image uploads/deletions as ONE commit via the Git Data API,
   * so a single save triggers a single deploy. The ref update is not forced: if the branch
   * moved since we read it, GitHub rejects the update and we surface a conflict.
   */
  async commit({ posts, expectedVersion, message, uploads = [], deletions = [] }: CommitInput) {
    const head = await this.headCommitSha();
    const current = await this.readAt(head);
    if (current.blobSha !== expectedVersion) {
      throw new ContentConflictError();
    }

    const content = serializePosts(PostsFileSchema.parse({ posts }).posts);
    const headCommit = await this.request<{ tree: { sha: string } }>("GET", `/git/commits/${head}`);

    const postsBlob = await this.request<{ sha: string }>("POST", "/git/blobs", {
      content,
      encoding: "utf-8",
    });

    const tree: Array<{ path: string; mode: "100644"; type: "blob"; sha: string | null }> = [
      { path: POSTS_FILE_PATH, mode: "100644", type: "blob", sha: postsBlob.sha },
    ];

    for (const upload of uploads) {
      if (!POST_IMAGE_PATTERN.test(upload.publicPath)) throw new Error("Caminho de imagem inválido.");
      const blob = await this.request<{ sha: string }>("POST", "/git/blobs", {
        content: upload.data.toString("base64"),
        encoding: "base64",
      });
      tree.push({ path: `${POST_IMAGES_DIR}${upload.publicPath.slice("/posts".length)}`, mode: "100644", type: "blob", sha: blob.sha });
    }

    for (const publicPath of deletions) {
      if (!POST_IMAGE_PATTERN.test(publicPath)) throw new Error("Caminho de imagem inválido.");
      tree.push({ path: `${POST_IMAGES_DIR}${publicPath.slice("/posts".length)}`, mode: "100644", type: "blob", sha: null });
    }

    const newTree = await this.request<{ sha: string }>("POST", "/git/trees", {
      base_tree: headCommit.tree.sha,
      tree,
    });

    const commit = await this.request<{ sha: string }>("POST", "/git/commits", {
      message,
      tree: newTree.sha,
      parents: [head],
    });

    try {
      await this.request("PATCH", `/git/refs/heads/${this.encodePath(this.config.branch)}`, {
        sha: commit.sha,
        force: false,
      });
    } catch (error) {
      if (error instanceof GitHubRequestError && (error.status === 422 || error.status === 409)) {
        throw new ContentConflictError();
      }
      throw error;
    }

    return { version: postsBlob.sha };
  }
}
