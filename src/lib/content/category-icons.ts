/**
 * Closed list of category icons. Content stores only the key; the drawing is resolved in code
 * (see components/site/category-glyph.tsx), so no SVG or markup ever comes from the admin.
 * The first three keep the original hand-drawn glyphs of Saúde, Inclusão and Bairros.
 */
export const CATEGORY_ICONS = [
  { key: "health", label: "Saúde" },
  { key: "inclusion", label: "Inclusão" },
  { key: "neighborhoods", label: "Bairros" },
  { key: "education", label: "Educação" },
  { key: "security", label: "Segurança" },
  { key: "transport", label: "Transporte" },
  { key: "environment", label: "Meio ambiente" },
  { key: "sports", label: "Esporte" },
  { key: "culture", label: "Cultura" },
  { key: "social", label: "Social" },
  { key: "work", label: "Trabalho" },
  { key: "infrastructure", label: "Infraestrutura" },
  { key: "general", label: "Geral" },
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number]["key"];

export const CATEGORY_ICON_KEYS = CATEGORY_ICONS.map((icon) => icon.key) as [CategoryIcon, ...CategoryIcon[]];
