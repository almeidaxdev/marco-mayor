import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ContentError, PageHeader } from "@/components/admin/page-header";
import { PostsTable } from "@/components/admin/posts-table";
import { Button } from "@/components/ui/button";
import { formatDateTime, loadAdminContent } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Publicações" };

export default async function AdminPostsPage() {
  const content = await loadAdminContent();

  return (
    <>
      <PageHeader
        title="Publicações"
        description="Os cards exibidos na seção Atuação em destaque, na ordem em que aparecem."
        actions={
          <Button asChild size="lg" className="h-10 px-4">
            <Link href="/admin/posts/new">
              <Plus aria-hidden="true" />
              Nova publicação
            </Link>
          </Button>
        }
      />
      {content.ok ? (
        <PostsTable
          posts={content.snapshot.posts}
          version={content.snapshot.version}
          updatedLabels={Object.fromEntries(content.snapshot.posts.map((post) => [post.id, formatDateTime(post.updatedAt)]))}
        />
      ) : (
        <ContentError message={content.message} />
      )}
    </>
  );
}
