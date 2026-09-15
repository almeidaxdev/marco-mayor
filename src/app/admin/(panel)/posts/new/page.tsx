import type { Metadata } from "next";
import { ContentError, PageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/post-form";
import { loadAdminContent } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Nova publicação" };

export default async function NewPostPage() {
  const content = await loadAdminContent();

  return (
    <>
      <PageHeader title="Nova publicação" description="Preencha os campos e confira o card na pré-visualização." />
      {content.ok ? (
        <PostForm
          version={content.snapshot.version}
          nextOrder={content.snapshot.posts.reduce((max, post) => Math.max(max, post.order), 0) + 1}
        />
      ) : (
        <ContentError message={content.message} />
      )}
    </>
  );
}
