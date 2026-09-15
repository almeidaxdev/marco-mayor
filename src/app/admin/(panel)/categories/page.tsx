import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CategoriesList, type CategoryUsage } from "@/components/admin/categories-list";
import { ContentError, PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { loadAdminContent } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Categorias" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const content = await loadAdminContent();

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Organizam as publicações e geram os filtros da seção Atuação em destaque. Só aparecem no site as categorias com publicações publicadas."
        actions={
          <Button asChild size="lg" className="h-10 px-4">
            <Link href="/admin/categories/new">
              <Plus aria-hidden="true" />
              Nova categoria
            </Link>
          </Button>
        }
      />
      {content.ok ? (
        <CategoriesList
          categories={content.snapshot.categories}
          usage={usageByCategory(content.snapshot)}
          version={content.snapshot.version}
        />
      ) : (
        <ContentError message={content.message} />
      )}
    </>
  );
}

function usageByCategory({ categories, posts }: { categories: { id: string }[]; posts: { categoryId: string; published: boolean }[] }) {
  const usage: CategoryUsage = Object.fromEntries(categories.map((category) => [category.id, { total: 0, published: 0 }]));
  for (const post of posts) {
    const entry = usage[post.categoryId];
    if (!entry) continue;
    entry.total += 1;
    if (post.published) entry.published += 1;
  }
  return usage;
}
