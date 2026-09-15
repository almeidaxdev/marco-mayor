"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { movePost, setFeatured, setPublished } from "@/app/admin/actions";
import { CategoryGlyph } from "@/components/site/category-glyph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, sortPosts, type Post } from "@/lib/content/schema";
import { DeletePostDialog } from "./delete-post-dialog";
import { useContentAction } from "./use-content-action";

type Props = { posts: Post[]; version: string; updatedLabels: Record<string, string> };

export function PostsTable({ posts, version, updatedLabels }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [toDelete, setToDelete] = useState<Post | null>(null);
  const { pending, run } = useContentAction();

  const ordered = useMemo(() => sortPosts(posts), [posts]);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return ordered.filter(
      (post) =>
        (category === "all" || post.category === category) &&
        (status === "all" || (status === "published" ? post.published : !post.published)) &&
        (!q || `${post.title} ${post.excerpt}`.toLocaleLowerCase("pt-BR").includes(q)),
    );
  }, [ordered, query, category, status]);

  const isFiltering = query !== "" || category !== "all" || status !== "all";

  function imageShared(post: Post) {
    return Boolean(post.image) && posts.some((other) => other.id !== post.id && other.image === post.image);
  }

  function actionsFor(post: Post, index: number) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9" aria-label={`Ações para ${post.title}`} disabled={pending}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={`/admin/posts/${post.id}`}>
              <Pencil aria-hidden="true" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              run(() => setPublished(post.id, version, !post.published), {
                loading: post.published ? "Movendo para rascunhos…" : "Publicando…",
              })
            }
          >
            {post.published ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {post.published ? "Despublicar" : "Publicar"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              run(() => setFeatured(post.id, version, !post.featured), {
                loading: post.featured ? "Removendo destaque…" : "Destacando…",
              })
            }
          >
            {post.featured ? <StarOff aria-hidden="true" /> : <Star aria-hidden="true" />}
            {post.featured ? "Remover destaque" : "Marcar destaque"}
          </DropdownMenuItem>
          {!isFiltering ? (
            <>
              <DropdownMenuItem
                disabled={index === 0}
                onSelect={() => run(() => movePost(post.id, version, "up"), { loading: "Reordenando…" })}
              >
                <ArrowUp aria-hidden="true" />
                Mover para cima
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={index === ordered.length - 1}
                onSelect={() => run(() => movePost(post.id, version, "down"), { loading: "Reordenando…" })}
              >
                <ArrowDown aria-hidden="true" />
                Mover para baixo
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(post)}>
            <Trash2 aria-hidden="true" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function statusBadges(post: Post) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant={post.published ? "secondary" : "outline"}
          className={post.published ? "bg-emerald-50 text-emerald-800" : "text-muted-foreground"}
        >
          {post.published ? "Publicada" : "Rascunho"}
        </Badge>
        {post.featured ? (
          <Badge className="bg-sun text-ink">
            <Star className="size-3" aria-hidden="true" />
            Destaque
          </Badge>
        ) : null}
        {post.image ? (
          <Badge variant="outline" className="text-muted-foreground">
            <ImageIcon className="size-3" aria-hidden="true" />
            Imagem
          </Badge>
        ) : null}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            name="q"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título ou resumo…"
            aria-label="Buscar publicações"
            className="h-10 pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:flex">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="data-[size=default]:h-10 w-full md:w-44" aria-label="Filtrar por categoria">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="data-[size=default]:h-10 w-full md:w-40" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="published">Publicadas</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} de {posts.length} {posts.length === 1 ? "publicação" : "publicações"}
        {isFiltering ? " · Limpe os filtros para reordenar." : ""}
      </p>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-semibold text-ink">Nenhuma publicação ainda.</p>
          <p className="mt-1 text-sm text-muted-foreground">Crie a primeira para ela aparecer na seção Atuação em destaque.</p>
          <Button asChild className="mt-5 h-10 px-4">
            <Link href="/admin/posts/new">
              <Plus aria-hidden="true" />
              Nova publicação
            </Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-semibold text-ink">Nada encontrado com esses filtros.</p>
          <Button
            variant="outline"
            className="mt-4 h-9"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setStatus("all");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="w-16 px-4 py-3 font-medium">
                    Ordem
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Publicação
                  </th>
                  <th scope="col" className="w-32 px-4 py-3 font-medium">
                    Categoria
                  </th>
                  <th scope="col" className="w-44 px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="w-52 px-4 py-3 font-medium">
                    Atualizada
                  </th>
                  <th scope="col" className="w-14 px-2 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((post) => {
                  const index = ordered.indexOf(post);
                  return (
                    <tr key={post.id} className="group transition-colors hover:bg-muted/40">
                      <td className="tabular px-4 py-3.5 text-muted-foreground">{post.order}</td>
                      <td className="max-w-0 px-4 py-3.5">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="block truncate font-semibold text-ink underline-offset-4 hover:underline"
                        >
                          {post.title}
                        </Link>
                        <p className="mt-0.5 truncate text-muted-foreground">{post.excerpt || "Sem resumo"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-2">
                          <CategoryGlyph category={post.category} simple className="size-3.5 text-navy" />
                          {post.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{statusBadges(post)}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        <time dateTime={post.updatedAt}>{updatedLabels[post.id]}</time>
                      </td>
                      <td className="px-2 py-3.5 text-right">{actionsFor(post, index)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((post) => {
              const index = ordered.indexOf(post);
              return (
                <li key={post.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CategoryGlyph category={post.category} simple className="size-3.5 text-navy" />
                        {post.category}
                        <span aria-hidden="true">·</span>
                        <span className="tabular">Ordem {post.order}</span>
                      </p>
                      <Link href={`/admin/posts/${post.id}`} className="mt-1.5 block font-semibold text-ink">
                        {post.title}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt || "Sem resumo"}</p>
                    </div>
                    <div className="-mt-1 -mr-1">{actionsFor(post, index)}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    {statusBadges(post)}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {toDelete ? (
        <DeletePostDialog
          post={toDelete}
          version={version}
          imageShared={imageShared(toDelete)}
          open={Boolean(toDelete)}
          onOpenChange={(open) => !open && setToDelete(null)}
        />
      ) : null}
    </div>
  );
}
