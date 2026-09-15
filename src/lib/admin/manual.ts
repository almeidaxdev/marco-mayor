/**
 * Manual do Administrador. O PDF fica em docs/manual (fora de public/) e só é entregue a sessões
 * válidas pela rota /admin/manual/pdf.
 */
export const ADMIN_MANUAL = {
  title: "Manual do Administrador",
  version: "1.0",
  pages: 20,
  fileName: "Manual_Administrador_Marco_Mayor.pdf",
  href: "/admin/manual/pdf",
  downloadHref: "/admin/manual/pdf?download=1",
} as const;
