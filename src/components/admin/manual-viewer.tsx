"use client";

import { useSyncExternalStore } from "react";
import { BookOpen } from "lucide-react";

const WIDE = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(WIDE);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

// Celulares (e navegadores sem leitor de PDF embutido, como o Chrome no Android) não exibem o PDF
// de forma utilizável dentro da página: nesses casos a leitura é pelo botão de abrir.
function canEmbed() {
  return window.matchMedia(WIDE).matches && navigator.pdfViewerEnabled !== false;
}

export function ManualViewer({ src, title }: { src: string; title: string }) {
  const embed = useSyncExternalStore(subscribe, canEmbed, () => null);

  if (embed) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card">
        <iframe src={src} title={title} className="block h-[calc(100dvh-7.5rem)] min-h-[32rem] w-full" />
      </div>
    );
  }

  return (
    <>
      {embed === null ? (
        <div aria-hidden="true" className="hidden h-[calc(100dvh-7.5rem)] min-h-[32rem] rounded-lg border bg-card md:block" />
      ) : null}
      <div className={`flex items-center gap-4 rounded-lg border bg-card p-4 ${embed === null ? "md:hidden" : ""}`}>
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-navy">
          <BookOpen aria-hidden="true" className="size-5" />
        </span>
        <p className="text-sm text-foreground/80">Para uma leitura mais confortável, abra o manual em tela cheia.</p>
      </div>
    </>
  );
}
