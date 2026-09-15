import { ArrowUpRight } from "lucide-react";
import { SITE, SOCIAL_LINKS } from "@/lib/site";

const instagram = SOCIAL_LINKS.find((social) => social.network === "instagram")!;

export function Sobre() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-title"
      className="bg-paper pt-[var(--section-y-tight)] pb-[var(--section-y)]"
    >
      <div className="shell">
        {/* Masthead rule: opens the section the way a new chapter opens in print. */}
        <div className="border-t-2 border-ink pt-5 sm:pt-6">
          <p className="flex items-center gap-3 text-[0.9375rem] font-medium text-slate">
            <span aria-hidden="true" className="block h-0.5 w-10 bg-sun" />
            Sobre Marco
          </p>
        </div>

        {/* Narrative row */}
        <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-12 lg:gap-10">
          <h2 id="sobre-title" className="max-w-[15ch] text-h2 font-extrabold text-ink lg:col-span-7">
            Conheça quem está à frente do mandato.
          </h2>

          <div className="max-w-[46ch] lg:col-span-5 lg:pt-2">
            <p className="text-lead font-medium text-ink">
              Marco Mayor é vereador de Pindamonhangaba e presidente da Câmara Municipal no biênio 2025–2026.
            </p>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate">
              Em suas redes, compartilha publicações sobre saúde, inclusão e os bairros da cidade.
            </p>
            <a
              href={instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-7 inline-flex min-h-11 items-center gap-2 border-b-2 border-ink pb-1 text-base font-bold text-ink transition-[border-color,color] duration-200 hover:border-sun-deep"
            >
              Conheça sua trajetória no Instagram
              <ArrowUpRight
                className="size-5 transition-transform duration-300 ease-[var(--ease-out-quart)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </div>
        </div>

        {/* Data row */}
        <dl className="mt-14 grid gap-10 border-t border-line pt-8 sm:mt-20 sm:pt-10 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <dt className="text-label text-slate">Biênio na presidência da Câmara</dt>
            <dd className="tabular mt-3 text-[clamp(3.25rem,1.5rem+6vw,7.5rem)] leading-[0.84] font-extrabold tracking-[-0.05em] whitespace-nowrap text-navy">
              {SITE.term}
            </dd>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:col-span-5 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-line">
            <div className="lg:pb-5">
              <dt className="text-label text-slate">Mandato</dt>
              <dd className="mt-2 text-[1.3125rem] leading-tight font-bold tracking-[-0.015em] text-ink">{SITE.role}</dd>
            </div>
            <div className="lg:pt-5">
              <dt className="text-label text-slate">Presidência</dt>
              <dd className="mt-2 text-[1.3125rem] leading-tight font-bold tracking-[-0.015em] text-ink">
                {SITE.presidency}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </section>
  );
}
