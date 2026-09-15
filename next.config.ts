import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/posts/**", search: "" },
    ],
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      // Vercel caps function request bodies at 4.5 MB; images are downscaled in the browser first.
      bodySizeLimit: "4mb",
    },
  },
  // O PDF do manual fica fora de public/ e é lido pela rota protegida /admin/manual/pdf.
  outputFileTracingIncludes: {
    "/admin/manual/pdf": ["./docs/manual/Manual_Administrador_Marco_Mayor.pdf"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        // O PDF é exibido em um iframe da própria página /admin/manual; continua proibido em outros sites.
        source: "/admin/manual/pdf",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
