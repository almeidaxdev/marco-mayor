import type { Metadata } from "next";
import { CategoryForm } from "@/components/admin/category-form";
import { ContentError, PageHeader } from "@/components/admin/page-header";
import { loadAdminContent } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nova categoria" };

export default async function NewCategoryPage() {
  await requireAdmin();
  const content = await loadAdminContent();

  return (
    <>
      <PageHeader title="Nova categoria" description="Escolha o nome e o ícone. A categoria fica disponível no formulário de publicações." />
      {content.ok ? (
        <CategoryForm
          version={content.snapshot.version}
          nextOrder={content.snapshot.categories.reduce((max, category) => Math.max(max, category.order), 0) + 1}
        />
      ) : (
        <ContentError message={content.message} />
      )}
    </>
  );
}
