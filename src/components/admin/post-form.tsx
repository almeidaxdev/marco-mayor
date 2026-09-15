"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, RotateCcw, Trash2, Upload } from "lucide-react";
import { savePost } from "@/app/admin/actions";
import { PostCard } from "@/components/site/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, type Category, type Post } from "@/lib/content/schema";
import type { ActionResult } from "@/lib/validations/post-form";
import { DeletePostDialog } from "./delete-post-dialog";
import { isDiscardRequested, notify } from "./use-content-action";

type Props = {
  post?: Post;
  version: string;
  nextOrder: number;
  imageShared?: boolean;
};

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

async function downscale(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  if (!blob) return file;
  const base = file.name.replace(/\.[^.]+$/, "") || "imagem";
  return new File([blob], `${base}.webp`, { type: "image/webp" });
}

export function PostForm({ post, version, nextOrder, imageShared = false }: Props) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const [category, setCategory] = useState<Category>(post?.category ?? "Saúde");
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [externalUrl, setExternalUrl] = useState(post?.externalUrl ?? "");
  const [published, setPublishedState] = useState(post?.published ?? false);
  const [featured, setFeaturedState] = useState(post?.featured ?? false);
  const [order, setOrder] = useState(String(post?.order ?? nextOrder));
  const [imageMode, setImageMode] = useState<"keep" | "upload" | "remove">("keep");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ids = { title: useId(), excerpt: useId(), url: useId(), order: useId(), image: useId(), category: useId() };

  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    async (previous, formData) => {
      const result = await savePost(previous, formData);
      notify(result);
      if (result.status === "error" && result.fieldErrors) {
        requestAnimationFrame(() => {
          formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
        });
      }
      if (result.status === "success") {
        setDirty(false);
        if (!isEdit && result.postId) {
          router.replace(`/admin/posts/${result.postId}`);
        } else {
          setImageMode("keep");
          setLocalPreview(null);
          if (fileRef.current) fileRef.current.value = "";
          router.refresh();
        }
      }
      return result;
    },
    { status: "idle" },
  );

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDiscardRequested()) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setImageError(null);
    if (!file) return;

    if (!ACCEPTED.includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setImageError("Envie uma imagem .jpg, .jpeg, .png ou .webp.");
      input.value = "";
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setImageError("Arquivo muito grande. Use uma imagem com até 20 MB.");
      input.value = "";
      return;
    }

    setPreparing(true);
    try {
      const prepared = await downscale(file);
      if (prepared.size > 3.5 * 1024 * 1024) {
        setImageError("Mesmo reduzida, a imagem passou de 3,5 MB. Tente outra foto.");
        input.value = "";
        return;
      }
      const transfer = new DataTransfer();
      transfer.items.add(prepared);
      input.files = transfer.files;
      setLocalPreview(URL.createObjectURL(prepared));
      setImageMode("upload");
      setDirty(true);
    } catch {
      setImageError("Não foi possível ler esta imagem. Tente outro arquivo.");
      input.value = "";
    } finally {
      setPreparing(false);
    }
  }

  function clearSelection() {
    if (fileRef.current) fileRef.current.value = "";
    setLocalPreview(null);
    setImageMode("keep");
    setImageError(null);
  }

  const previewImage = imageMode === "upload" ? localPreview : imageMode === "remove" ? null : (post?.image ?? null);
  const imageErrorMessage = imageError ?? fieldErrors.image;

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onChange={() => setDirty(true)}
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:gap-12"
      >
        {post ? <input type="hidden" name="id" value={post.id} /> : null}
        <input type="hidden" name="version" value={version} />
        <input type="hidden" name="imageMode" value={imageMode} />

        <div className="space-y-8">
          <fieldset className="space-y-5 rounded-lg border bg-card p-5 sm:p-6" disabled={pending}>
            <legend className="sr-only">Conteúdo</legend>

            <div className="space-y-2">
              <Label htmlFor={ids.category}>Categoria</Label>
              <Select
                name="category"
                value={category}
                onValueChange={(value) => {
                  setCategory(value as Category);
                  setDirty(true);
                }}
              >
                <SelectTrigger id={ids.category} className="w-full data-[size=default]:h-10 sm:w-64" aria-invalid={Boolean(fieldErrors.category)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError id={`${ids.category}-error`} message={fieldErrors.category} />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={ids.title}>Título</Label>
                <span className="tabular text-xs text-muted-foreground">{title.length}/120</span>
              </div>
              <Input
                id={ids.title}
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                required
                autoComplete="off"
                className="h-10 text-base"
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={fieldErrors.title ? `${ids.title}-error` : undefined}
              />
              <FieldError id={`${ids.title}-error`} message={fieldErrors.title} />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={ids.excerpt}>Resumo</Label>
                <span className="tabular text-xs text-muted-foreground">{excerpt.length}/280</span>
              </div>
              <Textarea
                id={ids.excerpt}
                name="excerpt"
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                maxLength={280}
                rows={4}
                autoComplete="off"
                className="min-h-24 text-base"
                aria-invalid={Boolean(fieldErrors.excerpt)}
                aria-describedby={`${ids.excerpt}-hint${fieldErrors.excerpt ? ` ${ids.excerpt}-error` : ""}`}
              />
              <p id={`${ids.excerpt}-hint`} className="text-xs text-muted-foreground">
                Descreva apenas o que a publicação original apresenta.
              </p>
              <FieldError id={`${ids.excerpt}-error`} message={fieldErrors.excerpt} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={ids.url}>Link da publicação</Label>
              <Input
                id={ids.url}
                name="externalUrl"
                type="url"
                inputMode="url"
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
                placeholder="https://www.instagram.com/p/…"
                autoComplete="off"
                spellCheck={false}
                className="h-10 text-base"
                aria-invalid={Boolean(fieldErrors.externalUrl)}
                aria-describedby={`${ids.url}-hint${fieldErrors.externalUrl ? ` ${ids.url}-error` : ""}`}
              />
              <p id={`${ids.url}-hint`} className="text-xs text-muted-foreground">
                Opcional. Sem link, o card leva o visitante para a seção de contato e redes.
              </p>
              <FieldError id={`${ids.url}-error`} message={fieldErrors.externalUrl} />
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-lg border bg-card p-5 sm:p-6" disabled={pending}>
            <legend className="float-left mb-1 text-sm font-semibold text-ink">Imagem</legend>
            <p className="clear-left text-sm text-muted-foreground">
              Opcional. Sem imagem, o card usa a versão tipográfica com o símbolo da categoria. JPG, PNG ou WebP; a
              imagem é convertida para WebP.
            </p>

            <input
              ref={fileRef}
              id={ids.image}
              type="file"
              name="image"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="hidden"
              tabIndex={-1}
              onChange={onFileChange}
              aria-describedby={imageErrorMessage ? `${ids.image}-error` : undefined}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="h-10 px-3.5" onClick={() => fileRef.current?.click()} disabled={preparing}>
                {preparing ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : previewImage ? (
                  <Upload aria-hidden="true" />
                ) : (
                  <ImagePlus aria-hidden="true" />
                )}
                {preparing ? "Preparando…" : previewImage ? "Substituir imagem" : "Escolher imagem"}
              </Button>

              {imageMode === "upload" ? (
                <Button type="button" variant="ghost" className="h-10 px-3" onClick={clearSelection}>
                  <RotateCcw aria-hidden="true" />
                  Desfazer seleção
                </Button>
              ) : null}

              {post?.image && imageMode === "keep" ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 px-3 text-destructive hover:text-destructive"
                  onClick={() => {
                    setImageMode("remove");
                    setDirty(true);
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  Remover imagem
                </Button>
              ) : null}

              {imageMode === "remove" ? (
                <Button type="button" variant="ghost" className="h-10 px-3" onClick={() => setImageMode("keep")}>
                  <RotateCcw aria-hidden="true" />
                  Manter imagem atual
                </Button>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground" aria-live="polite">
              {imageMode === "upload"
                ? "Nova imagem selecionada. Ela será enviada ao salvar."
                : imageMode === "remove"
                  ? imageShared
                    ? "A imagem sairá deste card, mas o arquivo continua em uso por outra publicação."
                    : "A imagem será removida ao salvar."
                  : post?.image
                    ? `Imagem atual: ${post.image}`
                    : "Nenhuma imagem."}
            </p>
            <FieldError id={`${ids.image}-error`} message={imageErrorMessage} />
          </fieldset>

          <fieldset className="grid gap-5 rounded-lg border bg-card p-5 sm:grid-cols-2 sm:p-6" disabled={pending}>
            <legend className="sr-only">Exibição</legend>
            <ToggleRow
              name="published"
              label="Publicada"
              description="Visível no site público."
              checked={published}
              onChange={(value) => {
                setPublishedState(value);
                setDirty(true);
              }}
            />
            <ToggleRow
              name="featured"
              label="Destaque"
              description="Aparece primeiro, com card em azul."
              checked={featured}
              onChange={(value) => {
                setFeaturedState(value);
                setDirty(true);
              }}
            />
            <div className="space-y-2 sm:col-span-2">
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
                onChange={(event) => setOrder(event.target.value)}
                className="tabular h-10 w-32 text-base"
                aria-invalid={Boolean(fieldErrors.order)}
                aria-describedby={`${ids.order}-hint${fieldErrors.order ? ` ${ids.order}-error` : ""}`}
              />
              <p id={`${ids.order}-hint`} className="text-xs text-muted-foreground">
                Números menores aparecem antes no carrossel.
              </p>
              <FieldError id={`${ids.order}-error`} message={fieldErrors.order} />
            </div>
          </fieldset>

          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="ghost" className="h-10 px-3">
                <Link href="/admin/posts">
                  <ArrowLeft aria-hidden="true" />
                  Voltar
                </Link>
              </Button>
              {post ? (
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
            <Button type="submit" size="lg" className="h-11 px-5 text-[0.9375rem]" disabled={pending || preparing}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {pending ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar publicação"}
            </Button>
          </div>
        </div>

        <aside aria-labelledby="preview-title" className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="preview-title" className="text-sm font-semibold text-ink">
              Pré-visualização
            </h2>
            <span className="text-xs text-muted-foreground">{previewImage ? "Card com imagem" : "Card sem imagem"}</span>
          </div>
          <div className="mt-3 rounded-lg bg-paper-2 p-5 sm:p-6">
            <div className="mx-auto max-w-[22rem]">
              <PostCard
                preview
                imageSrc={previewImage}
                headingLevel="h3"
                post={{ category, title, excerpt, image: previewImage, externalUrl: externalUrl || null, featured }}
              />
            </div>
          </div>
          {!published ? (
            <p className="mt-3 text-xs text-muted-foreground">Rascunho: este card não aparece no site até ser publicado.</p>
          ) : null}
        </aside>
      </form>

      {post ? (
        <DeletePostDialog
          post={post}
          version={version}
          imageShared={imageShared}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={() => {
            setDirty(false);
            router.push("/admin/posts");
          }}
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

function ToggleRow({
  name,
  label,
  description,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border p-4">
      <div>
        <Label htmlFor={id} className="text-[0.9375rem]">
          {label}
        </Label>
        <p id={`${id}-desc`} className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch id={id} name={name} value="on" checked={checked} onCheckedChange={onChange} aria-describedby={`${id}-desc`} />
    </div>
  );
}
