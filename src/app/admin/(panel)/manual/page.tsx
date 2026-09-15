import type { Metadata } from "next";
import { Download, ExternalLink } from "lucide-react";
import { ManualViewer } from "@/components/admin/manual-viewer";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ADMIN_MANUAL } from "@/lib/admin/manual";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Manual" };

export default async function AdminManualPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title={ADMIN_MANUAL.title}
        description="Consulte o guia completo para gerenciamento de publicações, imagens e categorias do site."
        meta={
          <>
            Versão {ADMIN_MANUAL.version} · <span className="tabular">{ADMIN_MANUAL.pages}</span> páginas
          </>
        }
        stackActionsUntilLg
        actions={
          <>
            <Button asChild size="lg" className="h-10 px-4">
              <a href={ADMIN_MANUAL.href} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" />
                <span className="md:hidden">
                  Abrir manual<span className="sr-only"> (abre em nova guia)</span>
                </span>
                <span className="hidden md:inline">Abrir em nova guia</span>
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-10 px-4">
              <a href={ADMIN_MANUAL.downloadHref} download={ADMIN_MANUAL.fileName}>
                <Download aria-hidden="true" />
                Baixar PDF
              </a>
            </Button>
          </>
        }
      />
      <ManualViewer src={ADMIN_MANUAL.href} title={`${ADMIN_MANUAL.title} (PDF)`} />
    </>
  );
}
