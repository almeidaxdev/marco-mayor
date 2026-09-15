import { ArrowUp } from "lucide-react";
import { SITE } from "@/lib/site";
import { Monogram } from "./brand";

export function SiteFooter() {
  return (
    <footer className="on-dark bg-ink-2 text-paper">
      <div className="shell pt-12 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pt-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <Monogram className="size-10 shrink-0 text-paper" />
            <div className="leading-tight">
              <p translate="no" className="text-[1.25rem] font-bold tracking-[-0.02em]">
                {SITE.name}
              </p>
              <p className="mt-1 text-[0.875rem] text-paper/75">
                {SITE.role}
                <span aria-hidden="true" className="mx-2 text-mist/60">
                  ·
                </span>
                <span className="text-mist">Presidente da Câmara · {SITE.term}</span>
              </p>
            </div>
          </div>

          <a
            href="#inicio"
            className="group inline-flex h-12 items-center gap-3 self-start rounded-full border border-white/20 pr-2 pl-5 text-[0.9375rem] font-medium transition-[border-color,background-color] duration-200 hover:border-sun hover:bg-white/[0.03] sm:self-auto"
          >
            Voltar ao início
            <span className="grid size-8 place-items-center rounded-full bg-sun text-ink">
              <ArrowUp
                className="size-4 transition-transform duration-300 ease-[var(--ease-out-quart)] group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </span>
          </a>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-[0.875rem] text-mist">
          Conteúdo do mandato. Não substitui o portal institucional da Câmara.
        </p>
      </div>
    </footer>
  );
}
