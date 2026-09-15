"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { safeEqualStrings, verifyPassword } from "@/lib/auth/password";
import { checkLoginRate, clearLoginRate, registerFailedLogin } from "@/lib/auth/rate-limit";
import { createSession, destroySession, requireAdmin } from "@/lib/auth/session";
import { isSessionConfigured } from "@/lib/auth/token";
import { ContentConfigError, ContentConflictError, getPostRepository } from "@/lib/content";
import { ImageValidationError, processPostImage } from "@/lib/content/images";
import type { ImageUpload } from "@/lib/content/repository";
import { categoryNameKey, slugify, sortCategories, sortPosts, type Category, type Post } from "@/lib/content/schema";
import { CategoryFormSchema } from "@/lib/validations/category-form";
import { PostFormSchema, type ActionResult, type FieldErrors } from "@/lib/validations/post-form";

/* ----------------------------------------------------------------
   Auth
   ---------------------------------------------------------------- */

export type LoginState = { error?: string; username?: string };

// Used when the username is wrong, so both branches pay the scrypt cost.
const DUMMY_HASH =
  "scrypt:32768:8:1:AAAAAAAAAAAAAAAAAAAAAA:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const expectedUser = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUser || !passwordHash || !isSessionConfigured()) {
    return { error: "O acesso administrativo ainda não foi configurado no servidor." };
  }
  if (!username || !password) {
    return { error: "Informe usuário e senha.", username };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "local";
  const rate = checkLoginRate(ip);
  if (!rate.allowed) {
    const minutes = Math.max(1, Math.ceil(rate.retryAfterSeconds / 60));
    return { error: `Muitas tentativas. Tente novamente em ${minutes} min.`, username };
  }

  const userOk = safeEqualStrings(username, expectedUser);
  const passwordOk = await verifyPassword(password, userOk ? passwordHash : DUMMY_HASH);

  if (!userOk || !passwordOk) {
    registerFailedLogin(ip);
    return { error: "Usuário ou senha incorretos.", username };
  }

  clearLoginRate(ip);
  await createSession(expectedUser);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */

function nowIso() {
  return new Date().toISOString();
}

function successMessage(base: string, driver: "local" | "github") {
  return driver === "github" ? `${base} O site público será atualizado após o próximo deploy.` : base;
}

function revalidateContent() {
  revalidatePath("/", "layout");
}

function toFailure(error: unknown): ActionResult {
  if (error instanceof ContentConflictError) return { status: "conflict", message: error.message };
  if (error instanceof ContentConfigError) return { status: "error", message: error.message };
  if (error instanceof ImageValidationError) {
    return { status: "error", message: error.message, fieldErrors: { image: error.message } };
  }
  console.error("[admin] content action failed", error);
  return { status: "error", message: "Não foi possível salvar. Tente novamente em instantes." };
}

function collectFieldErrors(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path[0] as keyof FieldErrors;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function isReferencedElsewhere(posts: Post[], image: string, exceptId: string) {
  return posts.some((post) => post.id !== exceptId && post.image === image);
}

function uniqueSlug(title: string, posts: Post[], exceptId?: string) {
  const base = slugify(title) || "publicacao";
  const taken = new Set(posts.filter((post) => post.id !== exceptId).map((post) => post.slug));
  let slug = base;
  let counter = 2;
  while (taken.has(slug)) slug = `${base}-${counter++}`;
  return slug;
}

async function loadForMutation(expectedVersion: string) {
  const repository = getPostRepository();
  const snapshot = await repository.read();
  if (snapshot.version !== expectedVersion) throw new ContentConflictError();
  return { repository, snapshot };
}

/* ----------------------------------------------------------------
   Create / update
   ---------------------------------------------------------------- */

export async function savePost(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = PostFormSchema.safeParse({
    id: formData.get("id") || undefined,
    version: formData.get("version"),
    categoryId: formData.get("categoryId"),
    title: formData.get("title") ?? "",
    excerpt: formData.get("excerpt") ?? "",
    externalUrl: formData.get("externalUrl") ?? "",
    published: formData.get("published") ?? "",
    featured: formData.get("featured") ?? "",
    order: formData.get("order"),
    imageMode: formData.get("imageMode") || "keep",
  });

  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const input = parsed.data;
  const imageFile = formData.get("image");

  try {
    const { repository, snapshot } = await loadForMutation(input.version);
    const posts = snapshot.posts;
    const existing = input.id ? posts.find((post) => post.id === input.id) : undefined;
    if (input.id && !existing) {
      return { status: "error", message: "Esta publicação não existe mais. Volte para a lista." };
    }
    if (!snapshot.categories.some((category) => category.id === input.categoryId)) {
      const message = "Esta categoria não existe mais. Recarregue a página e escolha outra.";
      return { status: "error", message, fieldErrors: { categoryId: message } };
    }

    const timestamp = nowIso();
    const id = existing?.id ?? randomUUID();
    const slug = existing?.slug ?? uniqueSlug(input.title, posts);

    const uploads: ImageUpload[] = [];
    const deletions: string[] = [];
    let image = existing?.image ?? null;

    if (input.imageMode === "upload") {
      if (!(imageFile instanceof File) || imageFile.size === 0) {
        return { status: "error", message: "Selecione uma imagem.", fieldErrors: { image: "Selecione uma imagem." } };
      }
      const processed = await processPostImage(imageFile, slug);
      uploads.push(processed);
      if (image && !isReferencedElsewhere(posts, image, id)) deletions.push(image);
      image = processed.publicPath;
    } else if (input.imageMode === "remove") {
      if (image && !isReferencedElsewhere(posts, image, id)) deletions.push(image);
      image = null;
    }

    const next: Post = {
      id,
      slug,
      categoryId: input.categoryId,
      title: input.title,
      excerpt: input.excerpt,
      image,
      externalUrl: input.externalUrl,
      published: input.published,
      featured: input.featured,
      order: input.order,
      publishedAt: input.published ? (existing?.published ? existing.publishedAt : timestamp) : null,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    const nextPosts = existing ? posts.map((post) => (post.id === id ? next : post)) : [...posts, next];

    await repository.commit({
      categories: snapshot.categories,
      posts: nextPosts,
      expectedVersion: snapshot.version,
      message: `content: ${existing ? "atualiza" : "cria"} publicação "${next.title}"`,
      uploads,
      deletions,
    });

    revalidateContent();
    return {
      status: "success",
      message: successMessage(existing ? "Publicação atualizada." : "Publicação criada.", repository.driver),
      postId: id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

/* ----------------------------------------------------------------
   Quick actions
   ---------------------------------------------------------------- */

const QuickSchema = z.object({ id: z.uuid(), version: z.string().min(1) });

export async function setPublished(id: string, version: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  const input = QuickSchema.safeParse({ id, version });
  if (!input.success) return { status: "error", message: "Requisição inválida." };

  try {
    const { repository, snapshot } = await loadForMutation(input.data.version);
    const target = snapshot.posts.find((post) => post.id === input.data.id);
    if (!target) return { status: "error", message: "Publicação não encontrada." };
    const timestamp = nowIso();
    const posts = snapshot.posts.map((post) =>
      post.id === target.id
        ? {
            ...post,
            published,
            publishedAt: published ? (post.publishedAt ?? timestamp) : null,
            updatedAt: timestamp,
          }
        : post,
    );
    await repository.commit({
      categories: snapshot.categories,
      posts,
      expectedVersion: snapshot.version,
      message: `content: ${published ? "publica" : "despublica"} "${target.title}"`,
    });
    revalidateContent();
    return {
      status: "success",
      message: successMessage(published ? "Publicado." : "Movido para rascunhos.", repository.driver),
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function setFeatured(id: string, version: string, featured: boolean): Promise<ActionResult> {
  await requireAdmin();
  const input = QuickSchema.safeParse({ id, version });
  if (!input.success) return { status: "error", message: "Requisição inválida." };

  try {
    const { repository, snapshot } = await loadForMutation(input.data.version);
    const target = snapshot.posts.find((post) => post.id === input.data.id);
    if (!target) return { status: "error", message: "Publicação não encontrada." };
    const posts = snapshot.posts.map((post) =>
      post.id === target.id ? { ...post, featured, updatedAt: nowIso() } : post,
    );
    await repository.commit({
      categories: snapshot.categories,
      posts,
      expectedVersion: snapshot.version,
      message: `content: ${featured ? "destaca" : "remove destaque de"} "${target.title}"`,
    });
    revalidateContent();
    return {
      status: "success",
      message: successMessage(featured ? "Marcado como destaque." : "Destaque removido.", repository.driver),
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function movePost(id: string, version: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();
  const input = QuickSchema.safeParse({ id, version });
  if (!input.success || (direction !== "up" && direction !== "down")) {
    return { status: "error", message: "Requisição inválida." };
  }

  try {
    const { repository, snapshot } = await loadForMutation(input.data.version);
    const ordered = sortPosts(snapshot.posts);
    const index = ordered.findIndex((post) => post.id === input.data.id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0) return { status: "error", message: "Publicação não encontrada." };
    if (swapWith < 0 || swapWith >= ordered.length) {
      return { status: "success", message: "A publicação já está nessa posição." };
    }

    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    const timestamp = nowIso();
    const moved = new Set([ordered[index].id, ordered[swapWith].id]);
    const posts = ordered.map((post, position) => ({
      ...post,
      order: position + 1,
      updatedAt: moved.has(post.id) ? timestamp : post.updatedAt,
    }));

    await repository.commit({
      categories: snapshot.categories,
      posts,
      expectedVersion: snapshot.version,
      message: `content: reordena "${ordered[swapWith].title}"`,
    });
    revalidateContent();
    return { status: "success", message: successMessage("Ordem atualizada.", repository.driver) };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deletePost(id: string, version: string, removeImage: boolean): Promise<ActionResult> {
  await requireAdmin();
  const input = QuickSchema.safeParse({ id, version });
  if (!input.success) return { status: "error", message: "Requisição inválida." };

  try {
    const { repository, snapshot } = await loadForMutation(input.data.version);
    const target = snapshot.posts.find((post) => post.id === input.data.id);
    if (!target) return { status: "error", message: "Esta publicação já foi excluída." };

    const posts = snapshot.posts.filter((post) => post.id !== target.id);
    const deletions =
      removeImage === true && target.image && !isReferencedElsewhere(snapshot.posts, target.image, target.id)
        ? [target.image]
        : [];

    await repository.commit({
      categories: snapshot.categories,
      posts,
      expectedVersion: snapshot.version,
      message: `content: exclui publicação "${target.title}"`,
      deletions,
    });
    revalidateContent();
    return { status: "success", message: successMessage("Publicação excluída.", repository.driver) };
  } catch (error) {
    return toFailure(error);
  }
}

/* ----------------------------------------------------------------
   Categories
   Stored in the same content file as the posts, so every change is one validated commit and
   post → category references can never be left dangling.
   ---------------------------------------------------------------- */

function postCountLabel(count: number) {
  return `${count} ${count === 1 ? "publicação" : "publicações"}`;
}

export async function saveCategory(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = CategoryFormSchema.safeParse({
    id: formData.get("id") || undefined,
    version: formData.get("version"),
    name: formData.get("name") ?? "",
    icon: formData.get("icon"),
    order: formData.get("order"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  const input = parsed.data;

  try {
    const { repository, snapshot } = await loadForMutation(input.version);
    const categories = snapshot.categories;
    const existing = input.id ? categories.find((category) => category.id === input.id) : undefined;
    if (input.id && !existing) {
      return { status: "error", message: "Esta categoria não existe mais. Volte para a lista." };
    }

    const others = categories.filter((category) => category.id !== existing?.id);
    // Same name ignoring case/spaces, or the same name once accents and punctuation are dropped.
    const duplicate =
      others.find((category) => categoryNameKey(category.name) === categoryNameKey(input.name)) ??
      others.find((category) => slugify(category.name) === slugify(input.name));
    if (duplicate) {
      const message = `Já existe a categoria “${duplicate.name}”. Use um nome diferente.`;
      return { status: "error", message, fieldErrors: { name: message } };
    }

    // The slug is fixed at creation, like post slugs, so renaming never changes stable references.
    const slug = existing?.slug ?? slugify(input.name).slice(0, 48).replace(/-+$/g, "");
    const slugOwner = others.find((category) => category.slug === slug);
    if (slugOwner) {
      const message = `Este nome gera o mesmo identificador (${slug}) da categoria “${slugOwner.name}”.`;
      return { status: "error", message, fieldErrors: { name: message } };
    }

    const next: Category = {
      id: existing?.id ?? randomUUID(),
      name: input.name,
      slug,
      icon: input.icon,
      order: input.order,
    };

    if (existing && JSON.stringify(existing) === JSON.stringify(next)) {
      return { status: "success", message: "Nenhuma alteração para salvar.", categoryId: existing.id };
    }

    const nextCategories = existing
      ? categories.map((category) => (category.id === next.id ? next : category))
      : [...categories, next];

    await repository.commit({
      categories: nextCategories,
      posts: snapshot.posts,
      expectedVersion: snapshot.version,
      message: `content: ${existing ? "atualiza" : "cria"} categoria "${next.name}"`,
    });

    revalidateContent();
    return {
      status: "success",
      message: successMessage(existing ? "Categoria atualizada." : "Categoria criada.", repository.driver),
      categoryId: next.id,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export async function moveCategory(id: string, version: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();
  const input = QuickSchema.safeParse({ id, version });
  if (!input.success || (direction !== "up" && direction !== "down")) {
    return { status: "error", message: "Requisição inválida." };
  }

  try {
    const { repository, snapshot } = await loadForMutation(input.data.version);
    const ordered = sortCategories(snapshot.categories);
    const index = ordered.findIndex((category) => category.id === input.data.id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0) return { status: "error", message: "Categoria não encontrada." };
    if (swapWith < 0 || swapWith >= ordered.length) {
      return { status: "success", message: "A categoria já está nessa posição." };
    }

    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
    const categories = ordered.map((category, position) => ({ ...category, order: position + 1 }));

    await repository.commit({
      categories,
      posts: snapshot.posts,
      expectedVersion: snapshot.version,
      message: `content: reordena categoria "${ordered[swapWith].name}"`,
    });
    revalidateContent();
    return { status: "success", message: successMessage("Ordem atualizada.", repository.driver) };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deleteCategory(id: string, version: string): Promise<ActionResult> {
  await requireAdmin();
  const input = QuickSchema.safeParse({ id, version });
  if (!input.success) return { status: "error", message: "Requisição inválida." };

  try {
    const { repository, snapshot } = await loadForMutation(input.data.version);
    const target = snapshot.categories.find((category) => category.id === input.data.id);
    if (!target) return { status: "error", message: "Esta categoria já foi excluída." };

    // Never cascade: posts must be moved to another category first.
    const inUse = snapshot.posts.filter((post) => post.categoryId === target.id).length;
    if (inUse > 0) {
      return {
        status: "error",
        message: `Esta categoria possui ${postCountLabel(inUse)}. Mova ou altere essas publicações antes de excluí-la.`,
      };
    }

    await repository.commit({
      categories: snapshot.categories.filter((category) => category.id !== target.id),
      posts: snapshot.posts,
      expectedVersion: snapshot.version,
      message: `content: exclui categoria "${target.name}"`,
    });
    revalidateContent();
    return { status: "success", message: successMessage("Categoria excluída.", repository.driver) };
  } catch (error) {
    return toFailure(error);
  }
}
