import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { ContentError, PageHeader } from "@/components/admin/page-header";
import { CategoryGlyph } from "@/components/site/category-glyph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, loadAdminContent } from "@/lib/admin/data";
import { CATEGORIES, type Post } from "@/lib/content/schema";

export const metadata: Metadata = { title: "Visão geral" };

export default async function AdminDashboardPage() {
  const content = await loadAdminContent();

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Resumo das publicações cadastradas no site."
        actions={
          <Button asChild size="lg" className="h-10 px-4">
            <Link href="/admin/posts/new">
              <Plus aria-hidden="true" />
              Nova publicação
            </Link>
          </Button>
        }
      />

      {!content.ok ? (
        <ContentError message={content.message} />
      ) : (
        <Dashboard posts={content.snapshot.posts} driver={content.driver} />
      )}
    </>
  );
}

function Dashboard({ posts, driver }: { posts: Post[]; driver: "local" | "github" }) {
  const published = posts.filter((post) => post.published).length;
  const drafts = posts.length - published;
  const recent = [...posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  const totals = [
    { label: "Total de publicações", value: posts.length },
    { label: "Publicadas", value: published },
    { label: "Rascunhos", value: drafts },
  ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="totais" className="space-y-3">
        <h2 id="totais" className="sr-only">
          Totais
        </h2>
        <dl className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-3">
          {totals.map((item, index) => (
            <div key={item.label} className={`p-5 ${index > 0 ? "border-t sm:border-t-0 sm:border-l" : ""}`}>
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="tabular mt-2 text-4xl font-extrabold tracking-[-0.03em] text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="categorias" className="space-y-3">
        <h2 id="categorias" className="text-base font-bold text-ink">
          Por categoria
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {CATEGORIES.map((category) => {
            const inCategory = posts.filter((post) => post.category === category);
            const live = inCategory.filter((post) => post.published).length;
            return (
              <li key={category} className="flex items-center gap-4 rounded-lg border bg-card p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-navy">
                  <CategoryGlyph category={category} simple className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{category}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="tabular">{inCategory.length}</span> no total ·{" "}
                    <span className="tabular">{live}</span> publicadas
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="recentes" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 id="recentes" className="text-base font-bold text-ink">
            Últimas alterações
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/posts">
              Ver todas
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium text-ink">Nenhuma publicação cadastrada.</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie a primeira para ela aparecer no site.</p>
          </div>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {recent.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="flex flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:gap-4"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{post.title}</span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={post.published ? "secondary" : "outline"}>
                      {post.published ? "Publicada" : "Rascunho"}
                    </Badge>
                    <span>{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={post.updatedAt}>{formatDateTime(post.updatedAt)}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        {driver === "github"
          ? "As alterações são gravadas como commits no GitHub. O site público muda após o deploy seguinte."
          : "Modo local: as alterações são gravadas em content/posts.json neste computador."}
      </p>
    </div>
  );
}
