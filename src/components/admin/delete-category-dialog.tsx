"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { deleteCategory } from "@/app/admin/actions";
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
import type { Category } from "@/lib/content/schema";
import { useContentAction } from "./use-content-action";

type Props = {
  category: Pick<Category, "id" | "name">;
  /** Posts (published or not) that reference this category. */
  postCount: number;
  version: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteCategoryDialog({ category, postCount, version, open, onOpenChange, onDeleted }: Props) {
  const { pending, run } = useContentAction();
  const blocked = postCount > 0;
  const countLabel = `${postCount} ${postCount === 1 ? "publicação" : "publicações"}`;

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{blocked ? "Não é possível excluir esta categoria" : "Excluir esta categoria?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {blocked
              ? `“${category.name}” possui ${countLabel}. Mova ou altere essas publicações antes de excluí-la.`
              : `“${category.name}” não possui publicações e será removida do painel. Esta ação não pode ser desfeita por aqui.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{blocked ? "Fechar" : "Cancelar"}</AlertDialogCancel>
          {blocked ? (
            <Button asChild>
              <Link href={`/admin/posts?categoria=${encodeURIComponent(category.id)}`}>Ver publicações</Link>
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={pending}
              onClick={() =>
                run(() => deleteCategory(category.id, version), {
                  loading: "Excluindo…",
                  onSuccess: () => {
                    onOpenChange(false);
                    onDeleted?.();
                  },
                })
              }
            >
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {pending ? "Excluindo…" : "Excluir categoria"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
