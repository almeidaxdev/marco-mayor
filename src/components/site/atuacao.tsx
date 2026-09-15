import type { PublishedContent } from "@/lib/content/public-posts";
import { PostCard } from "./post-card";
import { PostCarousel } from "./post-carousel";

export function Atuacao({ content }: { content: PublishedContent }) {
  return (
    <section
      id="atuacao"
      aria-labelledby="atuacao-title"
      className="bg-paper-2 pt-[var(--section-y)] pb-[var(--section-y-tight)]"
    >
      <PostCarousel
        heading={
          <>
            <h2 id="atuacao-title" className="text-h2 font-extrabold text-ink">
              Atuação em destaque
            </h2>
            <p className="mt-4 max-w-[44ch] text-lead text-slate sm:mt-5">
              Acompanhe os temas e assuntos compartilhados por Marco Mayor.
            </p>
          </>
        }
        categories={content.categories.map(({ id, name, slug }) => ({ id, name, slug }))}
        items={content.posts.map((post) => ({
          id: post.id,
          categoryId: post.categoryId,
          card: <PostCard post={post} />,
        }))}
      />
    </section>
  );
}
