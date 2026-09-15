"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, FileText, LayoutDashboard, LogOut, Plus } from "lucide-react";
import { logout } from "@/app/admin/actions";
import { Monogram } from "@/components/site/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, match: (p: string) => p === "/admin" },
  {
    href: "/admin/posts",
    label: "Publicações",
    icon: FileText,
    match: (p: string) => p.startsWith("/admin/posts") && p !== "/admin/posts/new",
  },
  { href: "/admin/posts/new", label: "Nova publicação", icon: Plus, match: (p: string) => p === "/admin/posts/new" },
];

export function AdminSidebar({ username, driver }: { username: string; driver: string }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <SidebarHeader className="px-4 pt-5 pb-4">
        <Link href="/admin" className="flex items-center gap-2.5 rounded-md text-white" onClick={() => setOpenMobile(false)}>
          <Monogram className="size-8" />
          <span className="leading-tight">
            <span className="block text-[0.9375rem] font-bold tracking-[-0.01em]">Marco Mayor</span>
            <span className="block text-xs text-sidebar-foreground/65">Administração</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = item.match(pathname);
                return (
                  <SidebarMenuButton
                    key={item.href}
                    asChild
                    isActive={active}
                    className="h-10 gap-3 px-3 text-[0.9375rem] data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-white data-[active=true]:shadow-[inset_2px_0_0_var(--color-sun)]"
                  >
                    <Link href={item.href} onClick={() => setOpenMobile(false)} aria-current={active ? "page" : undefined}>
                      <item.icon aria-hidden="true" />
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                );
              })}
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-10 gap-3 px-3 text-[0.9375rem]">
                  <a href="/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden="true" />
                    Ver site
                    <span className="sr-only">(abre em nova aba)</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 border-t border-sidebar-border px-4 py-4">
        <div className="text-xs text-sidebar-foreground/70">
          <p>
            Conectado como <span className="font-medium text-white">{username}</span>
          </p>
          <p className="mt-1">
            Armazenamento: <span className="font-medium text-white">{driver === "github" ? "GitHub" : "arquivo local"}</span>
          </p>
        </div>
        <form action={logout}>
          <SidebarMenuButton type="submit" className="h-10 gap-3 px-3 text-[0.9375rem]">
            <LogOut aria-hidden="true" />
            Sair
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
