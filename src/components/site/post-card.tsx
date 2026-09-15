import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Category, Post } from "@/lib/content/schema";
import { CategoryGlyph, CategoryMark } from "./category-glyph";

export type PostCardData = Pick<Post, "title" | "excerpt" | "image" | "externalUrl" | "featured"> & {
  category: Pick<Category, "name" | "icon">;
};

type PostCardProps = {
  post: PostCardData;
  headingLevel?: "h3" | "h4";
  /** Overrides the image source (e.g. a local blob URL in the admin preview). */
  imageSrc?: string | null;
  /** Renders without a link target; used by the admin preview. */
  preview?: boolean;
  loading?: "lazy" | "eager";
};

export function PostCard({ post, headingLevel = "h3", imageSrc, preview = false, loading = "lazy" }: PostCardProps) {
  const Heading = headingLevel;
  const src = imageSrc !== undefined ? imageSrc : post.image;
  const hasImage = Boolean(src);
  const dark = post.featured;
  const isExternal = Boolean(post.externalUrl);
  const href = post.externalUrl ?? "#contato";
  const ctaLabel = isExternal ? "Ver publicação" : "Acompanhar nas redes";

  const surface = dark
    ? "bg-navy text-paper border-navy"
    : "bg-paper text-ink border-line hover:border-navy/30 focus-within:border-navy/30";

  return (
    <article
      className={`group/card relative flex h-full flex-col overflow-hidden border transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out-quart)] hover:-translate-y-1 hover:shadow-lift focus-within:-translate-y-1 focus-within:shadow-lift motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0 ${surface} ${
        hasImage ? "" : "min-h-[20rem] sm:min-h-[21.5rem]"
      }`}
    >
      {/* Accent: a short yellow mark on the top edge that runs the full width on interaction. */}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 z-10 h-[3px] origin-left bg-sun transition-transform duration-500 ease-[var(--ease-out-quart)] group-focus-within/card:scale-x-100 group-hover/card:scale-x-100 ${
          dark ? "scale-x-100" : "scale-x-[0.11]"
        }`}
      />

      {hasImage && src ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-paper-3">
          <Image
            src={src}
            alt=""
            fill
            loading={loading}
            unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
            sizes="(min-width: 1024px) 28vw, (min-width: 640px) 44vw, 84vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-quart)] group-hover/card:scale-[1.03]"
          />
        </div>
      ) : null}

      <div className={`relative flex flex-1 flex-col px-6 pb-5 sm:px-7 sm:pb-6 ${hasImage ? "pt-5" : "pt-6 sm:pt-7"}`}>
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex pt-0.5 ${hasImage ? "flex-wrap items-center gap-x-3 gap-y-2" : "flex-col items-start gap-2.5"}`}
          >
            <CategoryMark
              name={post.category.name}
              icon={post.category.icon}
              withIcon={hasImage}
              className={dark ? "text-paper/85" : "text-slate"}
            />
            {post.featured ? (
              <span className="inline-flex h-6 items-center bg-sun px-2 text-[0.75rem] font-bold text-ink">
                Destaque
              </span>
            ) : null}
          </div>

          {hasImage ? null : (
            <CategoryGlyph
              icon={post.category.icon}
              strokeWidth={1.1}
              className={`size-16 shrink-0 transition-[color,transform] duration-500 ease-[var(--ease-out-quart)] group-hover/card:rotate-[3deg] sm:size-[4.5rem] ${
                dark
                  ? "text-sun/50 group-hover/card:text-sun"
                  : "text-navy/25 group-hover/card:text-sun-deep group-focus-within/card:text-sun-deep"
              }`}
            />
          )}
        </div>

        <div className={hasImage ? "mt-4" : "mt-5 pb-8 sm:mt-6"}>
          <Heading className="text-h3 font-bold">
            {preview ? (
              post.title || "Título da publicação"
            ) : (
              <a
                href={href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="outline-none after:absolute after:inset-0 after:content-['']"
              >
                {post.title}
                {isExternal ? <span className="sr-only"> (abre em nova aba)</span> : null}
              </a>
            )}
          </Heading>

          {post.excerpt ? (
            <p className={`mt-3 max-w-[40ch] text-[0.96875rem] leading-relaxed ${dark ? "text-paper/78" : "text-slate"}`}>
              {post.excerpt}
            </p>
          ) : null}
        </div>

        <p
          aria-hidden="true"
          className={`${hasImage ? "mt-6" : "mt-auto"} flex items-center justify-between border-t pt-4 text-[0.875rem] font-medium transition-colors duration-300 ${
            dark ? "border-white/15 text-paper/85" : "border-line text-slate-2 group-hover/card:text-ink"
          }`}
        >
          {ctaLabel}
          <ArrowUpRight
            className={`size-[1.125rem] transition-transform duration-300 ease-[var(--ease-out-quart)] group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 ${
              dark ? "text-sun" : "text-navy"
            }`}
          />
        </p>
      </div>

      {/* Focus ring for the stretched link. */}
      {!preview ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 hidden outline outline-2 -outline-offset-2 group-has-[a:focus-visible]/card:block ${
            dark ? "outline-sun" : "outline-navy"
          }`}
        />
      ) : null}
    </article>
  );
}
