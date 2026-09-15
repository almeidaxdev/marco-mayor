import type { Category } from "@/lib/content/schema";

type GlyphProps = {
  category: Category;
  className?: string;
  strokeWidth?: number;
  /** Reduced drawing that stays legible at icon size. */
  simple?: boolean;
};

/**
 * Line drawings that encode each category:
 * Saúde — a cross with an offset echo; Inclusão — interlocking circles; Bairros — a street grid.
 */
export function CategoryGlyph({ category, className, strokeWidth, simple = false }: GlyphProps) {
  const svg = {
    viewBox: "0 0 120 120",
    fill: "none",
    stroke: "currentColor",
    // Icon-size glyphs scale their stroke with the viewBox; large decorative ones keep hairlines.
    strokeWidth: strokeWidth ?? (simple ? 11 : 1.25),
    "aria-hidden": true,
    focusable: false,
    className,
  } as const;
  const line = simple ? {} : ({ vectorEffect: "non-scaling-stroke" } as const);

  switch (category) {
    case "Saúde":
      return (
        <svg {...svg}>
          <path {...line} d="M42 10h36v32h32v36H78v32H42V78H10V42h32z" />
          {simple ? null : (
            <>
              <path {...line} d="M52 24h16v28h28v16H68v28H52V68H24V52h28z" />
              <path {...line} d="M60 36v48M36 60h48" />
            </>
          )}
        </svg>
      );
    case "Inclusão":
      return (
        <svg {...svg}>
          <circle {...line} cx="42" cy="60" r="32" />
          <circle {...line} cx="78" cy="60" r="32" />
          {simple ? null : <circle {...line} cx="60" cy="60" r="12" />}
        </svg>
      );
    case "Bairros":
      return simple ? (
        <svg {...svg}>
          <path {...line} d="M14 14h34v34H14zM72 14h34v34H72zM14 72h34v34H14zM72 72h34v34H72z" />
        </svg>
      ) : (
        <svg {...svg}>
          <path
            {...line}
            d="M12 12h30v30H12zM52 12h56v30H52zM12 52h30v56H12zM52 52h24v24H52zM86 52h22v56H86zM52 86h24v22H52z"
          />
          <path {...line} d="M4 116 116 4" />
        </svg>
      );
  }
}

export function CategoryMark({
  category,
  className,
  withIcon = true,
}: {
  category: Category;
  className?: string;
  withIcon?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 text-label font-medium ${className ?? ""}`}>
      {withIcon ? <CategoryGlyph category={category} simple className="size-3.5 shrink-0" /> : null}
      {category}
    </span>
  );
}
