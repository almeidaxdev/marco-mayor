"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CATEGORIES, CATEGORY_SLUGS, type Category } from "@/lib/content/schema";

type Item = { id: string; category: Category; card: ReactNode };

type Filter = "todos" | Category;

export function PostCarousel({ items, heading }: { items: Item[]; heading: ReactNode }) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [edges, setEdges] = useState({ start: true, end: true });
  const trackRef = useRef<HTMLUListElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const trackId = useId();

  const visible = filter === "todos" ? items : items.filter((item) => item.category === filter);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    const start = track.scrollLeft <= 4;
    const end = track.scrollLeft >= max - 4;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    if (progressRef.current) {
      const visibleRatio = max <= 0 ? 1 : track.clientWidth / track.scrollWidth;
      const position = max <= 0 ? 0 : track.scrollLeft / max;
      progressRef.current.style.transform = `translateX(${position * (1 / visibleRatio - 1) * 100}%) scaleX(1)`;
      progressRef.current.style.width = `${visibleRatio * 100}%`;
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    track.addEventListener("scroll", onScroll, { passive: true });
    const resize = new ResizeObserver(onScroll);
    resize.observe(track);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
      resize.disconnect();
    };
  }, [measure]);

  function selectFilter(next: Filter) {
    setFilter(next);
    const track = trackRef.current;
    if (track) {
      track.scrollTo({ left: 0, behavior: "instant" });
      requestAnimationFrame(measure);
    }
  }

  function step(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const first = track.querySelector<HTMLElement>("li");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const distance = first ? first.offsetWidth + gap : track.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: distance * direction, behavior: reduce ? "instant" : "smooth" });
  }

  const counts = Object.fromEntries(
    CATEGORIES.map((category) => [category, items.filter((item) => item.category === category).length]),
  ) as Record<Category, number>;

  const filters: Array<{ value: Filter; label: string; count: number }> = [
    { value: "todos", label: "Todos os assuntos", count: items.length },
    ...CATEGORIES.map((category) => ({ value: category as Filter, label: category, count: counts[category] })),
  ];

  const statusText =
    filter === "todos"
      ? `Mostrando todas as ${visible.length} publicações.`
      : `Mostrando ${visible.length} ${visible.length === 1 ? "publicação" : "publicações"} de ${filter}.`;

  const arrowClass =
    "grid size-11 place-items-center rounded-full border border-navy/25 text-navy transition-[background-color,border-color,color,opacity] duration-200 hover:border-navy hover:bg-navy hover:text-paper disabled:pointer-events-none disabled:opacity-30 sm:size-12";

  return (
    <div>
      {/* From xl the filters column sizes to its content (one line) and the heading takes the rest;
          between 1280 and 1439px the pills tighten slightly so the row still fits beside the heading. */}
      <div className="shell grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:gap-10">
        <div>{heading}</div>
        <div
          role="group"
          aria-label="Filtrar publicações por assunto"
          className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] sm:mx-0 sm:flex-wrap sm:px-0 xl:justify-end xl:pb-1.5 xl:max-[90rem]:gap-1.5"
        >
          {filters.map((option) => {
            const pressed = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={pressed}
                aria-controls={trackId}
                disabled={option.count === 0}
                onClick={() => selectFilter(option.value)}
                data-slug={option.value === "todos" ? "todos" : CATEGORY_SLUGS[option.value]}
                className="inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full border border-line bg-paper px-4 text-[0.9375rem] font-medium whitespace-nowrap text-ink transition-[background-color,border-color,color] duration-200 hover:border-navy/50 xl:max-[90rem]:px-3.5 disabled:cursor-not-allowed disabled:opacity-45 aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-paper"
              >
                {option.label}
                <span
                  className={`tabular text-[0.8125rem] ${pressed ? "text-sun" : "text-slate"}`}
                  aria-label={`${option.count} ${option.count === 1 ? "publicação" : "publicações"}`}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {statusText}
      </p>

      <div
        role="region"
        aria-roledescription="carrossel"
        aria-label="Publicações em destaque"
        className="relative mt-8 sm:mt-12"
      >
        {/* Track geometry: the track's content box always equals the shell content width, so item
            percentages resolve against the same grid as the heading and filters.
            - Below xl the track bleeds to the viewport edge (inset = gutter); the next card peeks through the gutter.
            - From xl the track is clipped to the container (the inset only leaves room for the hover shadow and
              is smaller than the gap), showing exactly 3 cards: (width − 2 gaps) / 3. */}
        {visible.length === 0 ? (
          <div className="shell">
            <p className="border border-dashed border-line px-6 py-16 text-center text-slate">
              Novas publicações aparecerão aqui assim que forem compartilhadas.
            </p>
          </div>
        ) : (
          <ul
            id={trackId}
            ref={trackRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-[var(--track-gap)] overflow-x-auto overscroll-x-contain pt-2 pb-6 [--track-gap:1rem] [--track-inset:var(--gutter)] [padding-inline:var(--track-inset)] [scroll-padding-inline:var(--track-inset)] sm:[--track-gap:1.25rem] lg:[--track-gap:1.5rem] xl:mx-auto xl:w-[calc(min(100%-2*var(--gutter),var(--container))+2*var(--track-inset))] xl:[--track-inset:0.5rem]"
          >
            {visible.map((item, index) => (
              <li
                key={`${filter}-${item.id}`}
                style={{ "--i": index } as React.CSSProperties}
                className="anim-card w-[82vw] max-w-[24rem] shrink-0 snap-start sm:w-[44vw] md:w-[calc((100%-var(--track-gap))/2)] md:max-w-none xl:w-[calc((100%-2*var(--track-gap))/3)]"
              >
                {item.card}
              </li>
            ))}
          </ul>
        )}

        {visible.length > 0 ? (
          <div className="shell mt-1 flex items-center gap-5 sm:gap-8">
            <div className="relative h-0.5 flex-1 overflow-hidden bg-line" aria-hidden="true">
              <span ref={progressRef} className="absolute inset-y-0 left-0 w-full bg-navy transition-[width] duration-300" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={edges.start}
                aria-controls={trackId}
                aria-label="Publicações anteriores"
                className={arrowClass}
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={edges.end}
                aria-controls={trackId}
                aria-label="Próximas publicações"
                className={arrowClass}
              >
                <ArrowRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
