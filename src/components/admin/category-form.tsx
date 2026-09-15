"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useId, useRef, useState } from "react";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { saveCategory } from "@/app/admin/actions";
import { CategoryGlyph } from "@/components/site/category-glyph";
import { PostCard } from "@/components/site/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_ICONS, type CategoryIcon } from "@/lib/content/category-icons";
import { CATEGORY_NAME_MAX, normalizeCategoryName, slugify, type Category } from "@/lib/content/schema";
import type { ActionResult, FieldErrors } from "@/lib/validations/post-form";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { notify } from "./use-content-action";

type Props = {
  category?: Category;
  version: string;
  nextOrder: number;
  /** Posts referencing this category (edit only). */
  postCount?: number;
};

export function CategoryForm({ category, version, nextOrder, postCount = 0 }: Props) {
  const router = useRouter();
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState<CategoryIcon>(category?.icon ?? "general");
  const [order, setOrder] = useState(String(category?.order ?? nextOrder));
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Field errors from the last submit stay until that field is edited.
  const [edited, setEdited] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const ids = { name: useId(), slug: useId(), order: useId(), icon: useId() };

  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (previous, formData) => {
      const result = await saveCategory(previous, formData);
      setEdited({});
      notify(result);
      if (result.status === "error" && result.fieldErrors) {
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      }
      if (result.status === "success") {
        if (isEdit) router.refresh();
        else router.replace("/admin/categories");
      }
      return result;
    },
    { status: "idle" },
  );

  const submittedErrors: FieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const fieldErrors: FieldErrors = Object.fromEntries(
    Object.entries(submittedErrors).filter(([key]) => !edited[key as keyof FieldErrors]),
  );
  // The slug is generated once, at creation; renaming keeps it so references stay stable.
  const slug = category?.slug ?? slugify(normalizeCategoryName(name)).slice(0, 48).replace(/-+$/g, "");
  const displayName = normalizeCategoryName(name) || "Nome da categoria";

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:gap-12"
      >
        {category ? <input type="hidden" name="id" value={category.id} /> : null}
        <input type="hidden" name="version" value={version} />

        <div className="space-y-8">
          <fieldset className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" disabled={pending}>
            <legend className="sr-only">Dados da categoria</legend>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={ids.name}>Nome</Label>
                <span className="tabular text-xs text-muted-foreground">
                  {name.length}/{CATEGORY_NAME_MAX}
                </span>
              </div>
              <Input
                id={ids.name}
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setEdited((current) => ({ ...current, name: true }));
                }}
                maxLength={CATEGORY_NAME_MAX}
                required
                autoComplete="off"
                className="h-10 text-base"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? `${ids.name}-error` : undefined}
              />
              <FieldError id={`${ids.name}-error`} message={fieldErrors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids.slug}>Identificador (slug)</Label>
              <Input
                id={ids.slug}
                value={slug}
                readOnly
                tabIndex={-1}
                aria-describedby={`${ids.slug}-hint`}
                className="h-10 bg-muted/50 font-mono text-sm text-muted-foreground"
                placeholder="gerado a partir do nome"
              />
              <p id={`${ids.slug}-hint`} className="text-xs text-muted-foreground">
                {isEdit
                  ? "Definido na criação. Não muda ao renomear, para manter as referências estáveis."
                  : "Gerado automaticamente a partir do nome."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids.order}>Ordem</Label>
              <Input
                id={ids.order}
                name="order"
                type="number"
                inputMode="numeric"
                min={0}
                max={9999}
                step={1}
                autoComplete="off"
                value={order}
                onChange={(event) => {
                  setOrder(event.target.value);
                  setEdited((current) => ({ ...current, order: true }));
                }}
                className="tabular h-10 w-32 text-base"
                aria-invalid={Boolean(fieldErrors.order)}
                aria-describedby={`${ids.order}-hint${fieldErrors.order ? ` ${ids.order}-error` : ""}`}
              />
              <p id={`${ids.order}-hint`} className="text-xs text-muted-foreground">
                Números menores aparecem antes nos filtros do site e nas listas do painel.
              </p>
              <FieldError id={`${ids.order}-error`} message={fieldErrors.order} />
            </div>
          </fieldset>

          <fieldset
            className="rounded-lg border bg-card p-5 sm:p-6"
            disabled={pending}
            aria-describedby={fieldErrors.icon ? `${ids.icon}-error` : `${ids.icon}-hint`}
          >
            <legend className="float-left text-sm font-semibold text-ink">Ícone</legend>
            <p id={`${ids.icon}-hint`} className="clear-left pt-1 text-sm text-muted-foreground">
              Aparece no card sem imagem e nas listas. Os três primeiros são os símbolos originais do site.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {CATEGORY_ICONS.map((option) => (
                <label
                  key={option.key}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-md border px-2 py-3 text-center text-xs text-muted-foreground transition-colors hover:border-navy/40 has-[input:checked]:border-navy has-[input:checked]:bg-secondary has-[input:checked]:font-medium has-[input:checked]:text-ink has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-2"
                >
                  <input
                    type="radio"
                    name="icon"
                    value={option.key}
                    checked={icon === option.key}
                    onChange={() => {
                      setIcon(option.key);
                      setEdited((current) => ({ ...current, icon: true }));
                    }}
                    className="sr-only"
                  />
                  <CategoryGlyph icon={option.key} className="size-8 text-navy" />
                  {option.label}
                </label>
              ))}
            </div>
            <FieldError id={`${ids.icon}-error`} message={fieldErrors.icon} />
          </fieldset>

          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="ghost" className="h-10 px-3">
                <Link href="/admin/categories">
                  <ArrowLeft aria-hidden="true" />
                  Voltar
                </Link>
              </Button>
              {category ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                  disabled={pending}
                >
                  <Trash2 aria-hidden="true" />
                  Excluir
                </Button>
              ) : null}
            </div>
            <Button type="submit" size="lg" className="h-11 px-5 text-[0.9375rem]" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {pending ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar categoria"}
            </Button>
          </div>
        </div>

        <aside aria-labelledby="category-preview-title" className="lg:sticky lg:top-20 lg:self-start">
          <h2 id="category-preview-title" className="text-sm font-semibold text-ink">
            Prévia
          </h2>
          <div className="mt-3 space-y-5 rounded-lg bg-paper-2 p-5 sm:p-6">
            <div>
              <p className="text-xs text-muted-foreground">Filtro no site</p>
              <span className="mt-2 inline-flex h-11 items-center gap-2.5 rounded-full border border-line bg-paper px-4 text-[0.9375rem] font-medium whitespace-nowrap text-ink">
                {displayName}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Card sem imagem</p>
              <div className="mx-auto mt-2 max-w-[22rem]">
                <PostCard
                  preview
                  imageSrc={null}
                  headingLevel="h3"
                  post={{ category: { name: displayName, icon }, title: "", excerpt: "", image: null, externalUrl: null, featured: false }}
                />
              </div>
            </div>
          </div>
        </aside>
      </form>

      {category ? (
        <DeleteCategoryDialog
          category={category}
          postCount={postCount}
          version={version}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={() => router.push("/admin/categories")}
        />
      ) : null}
    </>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm font-medium text-destructive">
      {message}
    </p>
  );
}
