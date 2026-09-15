import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: { default: "Administração", template: "%s — Admin Marco Mayor" },
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <TooltipProvider delayDuration={300}>
      {children}
      <Toaster position="top-right" richColors closeButton containerAriaLabel="Notificações" />
    </TooltipProvider>
  );
}
