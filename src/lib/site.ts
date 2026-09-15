export const SITE = {
  name: "Marco Mayor",
  title: "Marco Mayor — Atuação em Pindamonhangaba",
  description:
    "Conheça Marco Mayor e acompanhe publicações sobre sua atuação parlamentar em Pindamonhangaba.",
  role: "Vereador de Pindamonhangaba",
  presidency: "Presidente da Câmara Municipal",
  term: "2025–2026",
  photo: {
    src: "/images/marco-mayor.jpg",
    width: 984,
    height: 992,
    alt: "Marco Mayor sorrindo, sentado à mesa com microfone, diante de bandeiras e de um brasão emoldurado.",
  },
} as const;

export type SocialNetwork = "instagram" | "tiktok" | "youtube" | "facebook";

export const SOCIAL_LINKS: ReadonlyArray<{
  network: SocialNetwork;
  label: string;
  handle: string;
  href: string;
}> = [
  { network: "instagram", label: "Instagram", handle: "@marcomayor10", href: "https://www.instagram.com/marcomayor10/" },
  { network: "tiktok", label: "TikTok", handle: "@ver.marcomayor", href: "https://www.tiktok.com/@ver.marcomayor" },
  { network: "youtube", label: "YouTube", handle: "@marcomayor1103", href: "https://www.youtube.com/@marcomayor1103" },
  {
    network: "facebook",
    label: "Facebook",
    handle: "Página de Marco Mayor",
    href: "https://www.facebook.com/share/d2BwP33SdeW6TZWm/?mibextid=sCpJLy",
  },
];

export const NAV_LINKS = [
  { href: "#inicio", label: "Início" },
  { href: "#atuacao", label: "Atuação" },
  { href: "#sobre", label: "Sobre Marco" },
  { href: "#contato", label: "Contato e redes" },
] as const;

export function getSiteUrl(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}
