import type { Post } from "@/lib/content/schema";
import { PostCard } from "./post-card";
import { PostCarousel } from "./post-carousel";

export function Atuacao({ posts }: { posts: Post[] }) {
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
              Saúde, inclusão e presença nos bairros. Os assuntos compartilhados por Marco Mayor.
            </p>
          </>
        }
        items={posts.map((post) => ({
          id: post.id,
          category: post.category,
          card: <PostCard post={post} />,
        }))}
      />
    </section>
  );
}
