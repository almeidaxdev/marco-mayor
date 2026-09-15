import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { ContentError, PageHeader } from "@/components/admin/page-header";
import { loadAdminContent } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Editar categoria" };

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const content = await loadAdminContent();

  if (!content.ok) {
    return (
      <>
        <PageHeader title="Editar categoria" />
        <ContentError message={content.message} />
      </>
    );
  }

  const category = content.snapshot.categories.find((item) => item.id === id);
  if (!category) notFound();

  const posts = content.snapshot.posts.filter((post) => post.categoryId === category.id);
  const published = posts.filter((post) => post.published).length;

  return (
    <>
      <PageHeader
        title="Editar categoria"
        description={`${posts.length} ${posts.length === 1 ? "publicação" : "publicações"} nesta categoria (${published} ${
          published === 1 ? "publicada" : "publicadas"
        }).`}
      />
      <CategoryForm
        key={`${category.id}-${content.snapshot.version}`}
        category={category}
        version={content.snapshot.version}
        nextOrder={category.order}
        postCount={posts.length}
      />
    </>
  );
}
