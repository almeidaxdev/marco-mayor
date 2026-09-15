"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { deletePost } from "@/app/admin/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Post } from "@/lib/content/schema";
import { useContentAction } from "./use-content-action";

type Props = {
  post: Pick<Post, "id" | "title" | "image">;
  version: string;
  imageShared: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeletePostDialog({ post, version, imageShared, open, onOpenChange, onDeleted }: Props) {
  const [removeImage, setRemoveImage] = useState(true);
  const { pending, run } = useContentAction();
  const checkboxId = useId();
  const canRemoveImage = Boolean(post.image) && !imageShared;

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir esta publicação?</AlertDialogTitle>
          <AlertDialogDescription>
            “{post.title}” será removida do site e do painel. Esta ação não pode ser desfeita por aqui.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {post.image ? (
          canRemoveImage ? (
            <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-3">
              <Checkbox
                id={checkboxId}
                checked={removeImage}
                onCheckedChange={(value) => setRemoveImage(value === true)}
                className="mt-0.5"
              />
              <Label htmlFor={checkboxId} className="block leading-snug font-normal">
                Remover também a imagem associada
                <span className="mt-0.5 block text-xs text-muted-foreground">{post.image}</span>
              </Label>
            </div>
          ) : (
            <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              A imagem desta publicação também é usada por outra publicação e será mantida.
            </p>
          )
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={pending}
            onClick={() =>
              run(() => deletePost(post.id, version, canRemoveImage && removeImage), {
                loading: "Excluindo…",
                onSuccess: () => {
                  onOpenChange(false);
                  onDeleted?.();
                },
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {pending ? "Excluindo…" : "Excluir publicação"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
