import "server-only";
import { ContentConfigError, getContentDriver, getPostRepository } from "@/lib/content";
import type { ContentSnapshot } from "@/lib/content/repository";

export type AdminContent =
  | { ok: true; snapshot: ContentSnapshot; driver: "local" | "github" }
  | { ok: false; message: string };

export async function loadAdminContent(): Promise<AdminContent> {
  try {
    const repository = getPostRepository();
    const snapshot = await repository.read();
    return { ok: true, snapshot, driver: repository.driver };
  } catch (error) {
    if (error instanceof ContentConfigError) return { ok: false, message: error.message };
    console.error("[admin] failed to load content", error);
    return {
      ok: false,
      message: `Não foi possível carregar o conteúdo (armazenamento: ${safeDriver()}). Verifique a configuração e tente novamente.`,
    };
  }
}

function safeDriver() {
  try {
    return getContentDriver();
  } catch {
    return "desconhecido";
  }
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}
