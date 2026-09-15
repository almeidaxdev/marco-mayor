import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-[1.75rem]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-prose text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function ContentError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 p-5 text-sm">
      <p className="font-semibold text-destructive">Não foi possível acessar as publicações</p>
      <p className="mt-1 text-foreground/80">{message}</p>
    </div>
  );
}
