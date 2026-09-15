"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { moveCategory } from "@/app/admin/actions";
import { CategoryGlyph } from "@/components/site/category-glyph";
import { Button } from "@/components/ui/button";
import { sortCategories, type Category } from "@/lib/content/schema";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { useContentAction } from "./use-content-action";

export type CategoryUsage = Record<string, { total: number; published: number }>;

type Props = { categories: Category[]; usage: CategoryUsage; version: string };

function countLabel(count: number) {
  return `${count} ${count === 1 ? "publicação" : "publicações"}`;
}

export function CategoriesList({ categories, usage, version }: Props) {
  const ordered = useMemo(() => sortCategories(categories), [categories]);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const { pending, run } = useContentAction();

  if (ordered.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-semibold text-ink">Nenhuma categoria cadastrada.</p>
        <p className="mt-1 text-sm text-muted-foreground">As publicações precisam de uma categoria para serem criadas.</p>
        <Button asChild className="mt-5 h-10 px-4">
          <Link href="/admin/categories/new">
            <Plus aria-hidden="true" />
            Nova categoria
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y rounded-lg border bg-card">
        {ordered.map((category, index) => {
          const counts = usage[category.id] ?? { total: 0, published: 0 };
          return (
            <li key={category.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:flex-nowrap">
              <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-navy">
                <CategoryGlyph icon={category.icon} simple className="size-5" />
              </span>

              {/* The 12rem basis makes the actions wrap onto their own line on phones instead of squeezing the text. */}
              <div className="min-w-0 flex-1 basis-48 sm:basis-0">
                <Link
                  href={`/admin/categories/${category.id}`}
                  className="block truncate font-semibold text-ink underline-offset-4 hover:underline"
                >
                  {category.name}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  <span className="tabular">{countLabel(counts.total)}</span>
                  {counts.total > 0 ? (
                    <>
                      {" · "}
                      <span className="tabular">{counts.published}</span>{" "}
                      {counts.published === 1 ? "publicada" : "publicadas"}
                    </>
                  ) : null}
                  <span className="hidden sm:inline">
                    {" · "}
                    <span className="font-mono text-xs">{category.slug}</span>
                  </span>
                </p>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  aria-label={`Mover ${category.name} para cima`}
                  disabled={pending || index === 0}
                  onClick={() => run(() => moveCategory(category.id, version, "up"), { loading: "Reordenando…" })}
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  aria-label={`Mover ${category.name} para baixo`}
                  disabled={pending || index === ordered.length - 1}
                  onClick={() => run(() => moveCategory(category.id, version, "down"), { loading: "Reordenando…" })}
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
                <Button asChild variant="outline" size="sm" className="ml-1 h-9 px-3">
                  <Link href={`/admin/categories/${category.id}`} aria-label={`Editar ${category.name}`}>
                    <Pencil aria-hidden="true" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Excluir ${category.name}`}
                  disabled={pending}
                  onClick={() => setToDelete(category)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {toDelete ? (
        <DeleteCategoryDialog
          category={toDelete}
          postCount={usage[toDelete.id]?.total ?? 0}
          version={version}
          open={Boolean(toDelete)}
          onOpenChange={(open) => !open && setToDelete(null)}
        />
      ) : null}
    </>
  );
}
