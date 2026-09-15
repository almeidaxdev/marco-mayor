import { ArrowUpRight } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/site";
import { SocialIcon } from "./brand";

export function Contato() {
  return (
    <section
      id="contato"
      aria-labelledby="contato-title"
      className="on-dark relative bg-ink py-[var(--section-y)] text-paper"
    >
      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col lg:col-span-5">
          <p className="flex items-center gap-3 text-[0.9375rem] font-medium text-paper/70">
            <span aria-hidden="true" className="block h-0.5 w-10 bg-sun" />
            Contato e redes sociais
          </p>
          <h2
            id="contato-title"
            className="mt-6 text-[clamp(3rem,1.6rem+5vw,6.5rem)] leading-[0.92] font-extrabold tracking-[-0.045em] lg:mt-8"
          >
            Vamos conversar?
          </h2>
          <p className="mt-6 max-w-[34ch] text-lead text-paper/75 lg:mt-8">
            Acesse os canais de Marco Mayor para entrar em contato e acompanhar as novidades.
          </p>
          <Signature className="hidden lg:mt-auto lg:flex lg:pt-16" />
        </div>

        <ul className="border-t border-white/15 lg:col-span-6 lg:col-start-7 lg:self-center">
          {SOCIAL_LINKS.map((social) => (
            <li key={social.network} className="border-b border-white/15">
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative grid min-h-24 grid-cols-[auto_1fr_auto] items-center gap-x-5 py-5 transition-colors duration-300 hover:bg-white/[0.035] focus-visible:bg-white/[0.035] sm:min-h-28 sm:gap-x-7 sm:px-3"
              >
                <span className="grid size-12 place-items-center rounded-full border border-white/20 text-paper transition-[border-color,color,transform] duration-300 ease-[var(--ease-out-quart)] group-hover:border-sun group-hover:text-sun group-focus-visible:border-sun group-focus-visible:text-sun sm:size-14">
                  <SocialIcon network={social.network} className="size-5 sm:size-6" />
                </span>
                <span className="min-w-0 transition-transform duration-300 ease-[var(--ease-out-quart)] group-hover:translate-x-1.5">
                  <span className="block text-[1.625rem] leading-none font-bold tracking-[-0.03em] sm:text-[2.125rem]">
                    {social.label}
                  </span>
                  <span translate="no" className="mt-2 block truncate text-[0.9375rem] text-mist">
                    {social.handle}
                  </span>
                </span>
                <ArrowUpRight
                  className="size-6 text-paper/70 transition-[transform,color] duration-300 ease-[var(--ease-out-quart)] group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-sun sm:size-7"
                  aria-hidden="true"
                />
                <span className="sr-only">(abre em nova aba)</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-px h-0.5 origin-left scale-x-0 bg-sun transition-transform duration-500 ease-[var(--ease-out-quart)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
                />
              </a>
            </li>
          ))}
        </ul>

        <Signature className="flex lg:hidden" />
      </div>
    </section>
  );
}

function Signature({ className }: { className: string }) {
  return (
    <p className={`items-center gap-3 text-[1.25rem] leading-tight font-bold tracking-[-0.015em] text-paper ${className}`}>
      <span aria-hidden="true" className="block size-2 shrink-0 bg-sun" />
      Pindamonhangaba, nossa cidade.
    </p>
  );
}
