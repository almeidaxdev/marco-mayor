import type { Metadata } from "next";
import { Monogram } from "@/components/site/brand";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="on-dark relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <div className="flex items-center gap-3">
          <Monogram className="size-10" />
          <span className="text-lg font-bold tracking-[-0.02em]">Marco Mayor</span>
        </div>
        <div>
          <p className="max-w-[14ch] text-[3.25rem] leading-[0.95] font-extrabold tracking-[-0.04em]">
            Publicações do mandato.
          </p>
          <p className="mt-6 max-w-[36ch] text-base text-paper/70">
            Crie, edite e organize os conteúdos exibidos na seção Atuação em destaque.
          </p>
        </div>
        <p className="text-sm text-mist">Área restrita à administração do site.</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Monogram className="size-9 text-ink" />
            <span className="text-lg font-bold tracking-[-0.02em] text-ink">Marco Mayor</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink">Entrar</h1>
          <p className="mt-2 text-muted-foreground">Use as credenciais de administrador configuradas no servidor.</p>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
