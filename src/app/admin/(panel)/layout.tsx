import { cookies } from "next/headers";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireAdmin } from "@/lib/auth/session";
import { getContentDriver } from "@/lib/content";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  let driver = "local";
  try {
    driver = getContentDriver();
  } catch {
    driver = "inválido";
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a
        href="#admin-main"
        className="fixed top-2 left-2 z-50 -translate-y-20 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus-visible:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <AdminSidebar username={session.sub} driver={driver} />
      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
          <SidebarTrigger className="-ml-1 size-9" />
          <span className="text-sm font-medium text-muted-foreground">Administração do site</span>
        </header>
        <div id="admin-main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
