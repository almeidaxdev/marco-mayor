import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentError, PageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/post-form";
import { formatDateTime, loadAdminContent } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Editar publicação" };

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const content = await loadAdminContent();

  if (!content.ok) {
    return (
      <>
        <PageHeader title="Editar publicação" />
        <ContentError message={content.message} />
      </>
    );
  }

  const post = content.snapshot.posts.find((item) => item.id === id);
  if (!post) notFound();

  const imageShared = Boolean(post.image) && content.snapshot.posts.some((other) => other.id !== post.id && other.image === post.image);

  return (
    <>
      <PageHeader title="Editar publicação" description={`Última alteração em ${formatDateTime(post.updatedAt)}.`} />
      <PostForm
        key={`${post.id}-${content.snapshot.version}`}
        post={post}
        version={content.snapshot.version}
        nextOrder={post.order}
        imageShared={imageShared}
      />
    </>
  );
}
