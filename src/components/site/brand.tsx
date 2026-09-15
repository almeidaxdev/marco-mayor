import type { SVGProps } from "react";
import type { SocialNetwork } from "@/lib/site";

export function Monogram({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" className={className} {...props}>
      <path
        d="M9 30V10h2.4L20 22.4 28.6 10H31v20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="miter"
      />
      <rect x="24.5" y="33" width="6.5" height="2.6" fill="var(--color-sun)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span translate="no" className={`inline-flex items-center gap-2.5 ${className}`}>
      <Monogram className="size-8 shrink-0" />
      <span className="text-[1.0625rem] font-bold tracking-[-0.02em]">Marco Mayor</span>
    </span>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

export function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  switch (network) {
    case "instagram":
      return (
        <svg {...iconProps} className={className}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...iconProps} className={className}>
          <path d="M14 3.5v11a3.75 3.75 0 1 1-3.75-3.75" />
          <path d="M14 3.5c.4 2.6 2.4 4.6 5 4.9" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...iconProps} className={className}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
          <path d="m10 9.2 5 2.8-5 2.8z" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...iconProps} className={className}>
          <path d="M15.5 3.5h-2a4 4 0 0 0-4 4v13" />
          <path d="M6.5 11h8.5" />
        </svg>
      );
  }
}
