"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/validations/post-form";

export function useContentAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, options?: { loading?: string; onSuccess?: () => void }) {
    startTransition(async () => {
      const toastId = toast.loading(options?.loading ?? "Salvando…");
      try {
        const result = await action();
        notify(result, toastId);
        if (result.status === "success") {
          options?.onSuccess?.();
          router.refresh();
        }
      } catch {
        toast.error("Falha de conexão. Verifique a internet e tente novamente.", { id: toastId });
      }
    });
  }

  return { pending, run };
}

let discardRequested = false;

/** True after the user explicitly chose to reload and drop unsaved edits. */
export function isDiscardRequested() {
  return discardRequested;
}

export function notify(result: ActionResult, toastId?: string | number) {
  if (result.status === "success") {
    toast.success(result.message, { id: toastId });
  } else if (result.status === "conflict") {
    toast.error(result.message, {
      id: toastId,
      duration: Infinity,
      action: {
        label: "Recarregar",
        onClick: () => {
          discardRequested = true;
          window.location.reload();
        },
      },
    });
  } else if (result.status === "error") {
    toast.error(result.message, { id: toastId });
  } else if (toastId !== undefined) {
    toast.dismiss(toastId);
  }
}
