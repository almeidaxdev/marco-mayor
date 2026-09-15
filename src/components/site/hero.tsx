import Image from "next/image";
import { ArrowDownRight } from "lucide-react";
import { SITE } from "@/lib/site";

export function Hero() {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="on-dark relative isolate overflow-hidden bg-ink text-paper lg:min-h-[max(40rem,100svh)]"
    >
      {/* Photograph: stacked on small screens, anchored right and bleeding off-edge on large screens. */}
      <div className="relative h-[min(62svh,33rem)] w-full sm:h-[min(66svh,44rem)] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[58%] xl:w-[56%]">
        <Image
          src={SITE.photo.src}
          alt={SITE.photo.alt}
          fill
          preload
          fetchPriority="high"
          quality={85}
          sizes="(min-width: 1280px) 56vw, (min-width: 1024px) 58vw, 100vw"
          className="anim-photo object-cover object-[50%_20%] sm:object-[50%_26%] lg:object-[46%_center]"
        />
        {/* Cool the white wall slightly so the photo belongs to the blue field. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[#bcd0df] opacity-25 mix-blend-multiply" />
        {/* Header scrim: keeps the navigation legible over the bright wall. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,rgb(13_36_55/0.72)_0%,rgb(13_36_55/0.28)_55%,transparent_100%)]"
        />
        {/* Small screens: fade the lower third into the page. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -bottom-0.5 bg-[linear-gradient(to_top,var(--color-ink)_0%,var(--color-ink)_1%,rgb(13_36_55/0.9)_20%,rgb(13_36_55/0.3)_46%,transparent_64%)] lg:hidden"
        />
        {/* Large screens: directional fade from the text column into the photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-[linear-gradient(to_right,var(--color-ink)_0%,rgb(13_36_55/0.9)_22%,rgb(13_36_55/0.4)_42%,transparent_60%)] lg:block xl:bg-[linear-gradient(to_right,var(--color-ink)_0%,rgb(13_36_55/0.88)_14%,rgb(13_36_55/0.35)_34%,transparent_52%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-[linear-gradient(to_top,var(--color-ink)_0%,rgb(13_36_55/0.6)_16%,transparent_38%)] lg:block"
        />
      </div>

      <div className="shell relative -mt-32 pb-8 sm:-mt-52 sm:pb-10 lg:mt-0 lg:flex lg:min-h-[max(40rem,100svh)] lg:flex-col lg:pt-[calc(var(--header-h)+2rem)] lg:pb-0 short:pt-[calc(var(--header-h)+0.75rem)]">
        <div className="lg:flex lg:flex-1 lg:flex-col lg:justify-end lg:pb-[clamp(2.5rem,8svh,6rem)] short:justify-center short:pb-6">
          <p className="anim-rise flex items-start gap-3.5" style={{ "--i": 0 } as React.CSSProperties}>
            <span aria-hidden="true" className="anim-rule mt-[0.7rem] block h-0.5 w-10 shrink-0 bg-sun" />
            <span className="leading-tight">
              <span className="block text-[1.1875rem] font-bold tracking-[-0.015em]">{SITE.name}</span>
              <span className="block text-[0.9375rem] font-medium text-paper/75">{SITE.role}</span>
            </span>
          </p>

          <h1
            id="hero-title"
            className="anim-rise mt-5 max-w-[11ch] text-display leading-[0.96] font-extrabold tracking-[-0.03em] sm:mt-6 sm:max-w-[12.5ch] sm:leading-[0.92] sm:tracking-[-0.038em]"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Uma conversa aberta com a cidade.
          </h1>

          <p
            className="anim-rise mt-6 max-w-[34ch] text-lead text-paper/80 lg:mt-8 short:mt-5 short:max-w-[42ch]"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            Acompanhe a atuação parlamentar, as pautas dos bairros e as publicações do mandato.
          </p>

          <div
            className="anim-rise mt-8 flex flex-col items-start gap-y-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4 lg:mt-10 short:mt-7"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <a
              href="#atuacao"
              className="group inline-flex h-14 w-full items-center justify-between gap-4 bg-sun px-6 text-base font-bold text-ink transition-[background-color,transform] duration-200 hover:bg-[#f6d964] active:translate-y-px sm:h-13 sm:w-auto sm:justify-start sm:pr-5"
            >
              Conheça a atuação
              <ArrowDownRight
                className="size-5 transition-transform duration-300 ease-[var(--ease-out-quart)] group-hover:translate-x-0.5 group-hover:translate-y-0.5"
                aria-hidden="true"
              />
            </a>
            <a
              href="#contato"
              className="inline-flex h-11 items-center text-base font-medium text-paper underline decoration-paper/35 decoration-1 underline-offset-[6px] transition-[text-decoration-color] duration-200 hover:decoration-sun"
            >
              Contato e redes
            </a>
          </div>
        </div>

        {/* Institutional line: spans the full width so text column and photograph read as one composition. */}
        <div
          className="anim-rise mt-10 flex items-end justify-between gap-6 border-t border-white/15 pt-4 sm:mt-12 lg:mt-0 lg:mb-7 lg:pt-5 short:mb-5 short:pt-4"
          style={{ "--i": 4 } as React.CSSProperties}
        >
          <p className="max-w-[17ch] text-[0.9375rem] leading-snug font-medium text-paper/85 sm:max-w-none">
            {SITE.presidency}
          </p>
          <p className="flex shrink-0 items-baseline gap-2.5 text-right">
            <span className="text-label text-paper/60">Biênio</span>
            <span className="tabular text-[1.25rem] leading-none font-bold tracking-[-0.02em] sm:text-[1.5rem]">
              {SITE.term}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
