import { Atuacao } from "@/components/site/atuacao";
import { Contato } from "@/components/site/contato";
import { Hero } from "@/components/site/hero";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Sobre } from "@/components/site/sobre";
import { getPublishedPosts } from "@/lib/content/public-posts";

export default async function HomePage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <a
        href="#conteudo"
        className="fixed top-3 left-3 z-[var(--z-skip)] -translate-y-24 bg-sun px-4 py-3 font-bold text-ink focus-visible:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Hero />
        <Atuacao posts={posts} />
        <Sobre />
        <Contato />
      </main>
      <SiteFooter />
    </>
  );
}
