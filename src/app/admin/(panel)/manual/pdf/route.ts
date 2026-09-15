import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { ADMIN_MANUAL } from "@/lib/admin/manual";
import { requireAdmin } from "@/lib/auth/session";

// Caminho literal para o rastreamento do build incluir só este arquivo (ver `outputFileTracingIncludes`).
const MANUAL_PATH = path.join(process.cwd(), "docs/manual/Manual_Administrador_Marco_Mayor.pdf");

export async function GET(request: NextRequest) {
  await requireAdmin();

  let file: Buffer;
  try {
    file = await readFile(MANUAL_PATH);
  } catch {
    return new Response("Manual indisponível.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const disposition = request.nextUrl.searchParams.has("download") ? "attachment" : "inline";
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(file.byteLength),
      "Content-Disposition": `${disposition}; filename="${ADMIN_MANUAL.fileName}"`,
    },
  });
}
