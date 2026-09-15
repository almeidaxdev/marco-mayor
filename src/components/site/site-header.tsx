"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { NAV_LINKS, SOCIAL_LINKS } from "@/lib/site";
import { Wordmark } from "./brand";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("#inicio");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_LINKS.map((link) => document.querySelector<HTMLElement>(link.href)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function openMenu() {
    dialogRef.current?.showModal();
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  return (
    <header
      data-scrolled={scrolled}
      className="on-dark group/header fixed inset-x-0 top-0 z-[var(--z-header)] text-paper transition-[background-color,border-color,box-shadow] duration-300 ease-out data-[scrolled=false]:border-transparent data-[scrolled=true]:border-b data-[scrolled=true]:border-white/10 data-[scrolled=true]:bg-ink/[0.97] data-[scrolled=true]:shadow-[0_8px_24px_-20px_rgb(0_0_0/0.6)] data-[scrolled=true]:backdrop-blur-md"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -bottom-10 bg-gradient-to-b from-ink/70 to-transparent transition-opacity duration-300 group-data-[scrolled=true]/header:opacity-0"
      />
      <div className="shell relative flex h-[var(--header-h)] items-center justify-between gap-6">
        <a href="#inicio" className="-m-2 rounded-sm p-2" aria-label="Marco Mayor, voltar ao início">
          <Wordmark />
        </a>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1 lg:gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  data-active={active === link.href}
                  className="group/link relative inline-flex h-11 items-center rounded-sm px-3 text-[0.9375rem] font-medium text-paper/80 transition-colors duration-200 hover:text-paper data-[active=true]:text-paper"
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-2 h-0.5 origin-left scale-x-0 bg-sun transition-transform duration-300 ease-[var(--ease-out-quart)] group-hover/link:scale-x-100 group-data-[active=true]/link:scale-x-100"
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={openerRef}
          type="button"
          onClick={openMenu}
          aria-haspopup="dialog"
          className="-mr-2 inline-flex h-11 items-center gap-2 rounded-sm px-2 text-[0.9375rem] font-medium md:hidden"
        >
          Menu
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        onClose={() => openerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
        className="on-dark fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-ink p-0 text-paper opacity-0 transition-[opacity,overlay,display] transition-discrete duration-300 backdrop:bg-ink/60 open:opacity-100 starting:open:opacity-0 md:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="shell flex h-[var(--header-h)] items-center justify-between">
            <Wordmark />
            <button
              type="button"
              onClick={closeMenu}
              className="-mr-2 inline-flex h-11 items-center gap-2 rounded-sm px-2 text-[0.9375rem] font-medium"
            >
              Fechar
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Menu principal" className="shell mt-6 flex-1">
            <ul className="border-t border-white/12">
              {NAV_LINKS.map((link, index) => (
                <li key={link.href} className="border-b border-white/12">
                  <a
                    href={link.href}
                    onClick={closeMenu}
                    style={{ "--i": index } as React.CSSProperties}
                    className="flex min-h-[4.5rem] items-center justify-between py-4 text-[2rem] leading-none font-bold tracking-[-0.03em] active:text-sun"
                  >
                    {link.label}
                    {active === link.href ? (
                      <span aria-hidden="true" className="h-0.5 w-8 bg-sun" />
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="shell pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <p className="text-label text-mist">Redes sociais</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.network}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 text-base font-medium"
                  >
                    {social.label}
                    <ArrowUpRight className="size-4 text-sun" aria-hidden="true" />
                    <span className="sr-only">(abre em nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </dialog>
    </header>
  );
}
