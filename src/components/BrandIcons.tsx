import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SealBadge — plakietka w kształcie pieczęci certyfikacyjnej (karbowana krawędź),
 * zamiast płaskiego kółka. Używana wszędzie tam, gdzie dziś jest zwykła ikona w kole.
 */
interface SealBadgeProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "primary" | "dark" | "light" | "success";
  rotate?: number;
  className?: string;
}

const sealSizes = {
  sm: "w-11 h-11",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

const sealTones = {
  primary: "bg-gradient-to-br from-primary to-accent text-primary-foreground",
  dark: "bg-industrial text-primary-foreground",
  light: "bg-primary/10 text-primary",
  success: "bg-success text-success-foreground",
};

export const SealBadge = ({ children, size = "md", tone = "light", rotate = 0, className }: SealBadgeProps) => (
  <div
    className={cn("relative shrink-0 flex items-center justify-center", sealSizes[size], className)}
    style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}
  >
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-sm">
      <path
        d="M50 2 L61 8 L74 6 L80 18 L92 24 L90 37 L98 48 L90 59 L92 72 L80 78 L74 90 L61 88 L50 98 L39 88 L26 90 L20 78 L8 72 L10 59 L2 48 L10 37 L8 24 L20 18 L26 6 L39 8 Z"
        className={cn(
          tone === "primary" && "fill-primary",
          tone === "dark" && "fill-industrial",
          tone === "light" && "fill-primary/10",
          tone === "success" && "fill-success"
        )}
      />
    </svg>
    <div className="relative z-10" style={{ transform: rotate ? `rotate(${-rotate}deg)` : undefined }}>
      {children}
    </div>
  </div>
);

/**
 * Dwutonowe, tematyczne ikony SVG (granat + pomarańcz) — zamiast generycznych
 * glifów lucide-react w kółku. Grubszy stroke, mniej "korporacyjne".
 */
const iconBase = "w-full h-full";

export const IconForklift = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={cn(iconBase, className)}>
    <path d="M8 8v22h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <rect x="12" y="18" width="12" height="12" rx="1.5" className="fill-current opacity-90" />
    <path d="M24 22h9l4 6v2h-13z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="16" cy="34" r="4" stroke="currentColor" strokeWidth="3" />
    <circle cx="34" cy="34" r="4" stroke="currentColor" strokeWidth="3" />
    <path d="M8 8h3l3 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const IconCertificate = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={cn(iconBase, className)}>
    <rect x="6" y="8" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="3" />
    <path d="M12 16h16M12 22h20M12 27h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <circle cx="18" cy="38" r="6" className="fill-current opacity-90" />
    <path d="M14 38l3 3 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconPallet = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={cn(iconBase, className)}>
    <path d="M6 16h36M6 22h36M6 28h36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M10 16v18M22 16v18M38 16v18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    <rect x="14" y="4" width="20" height="10" rx="1.5" className="fill-current opacity-90" />
  </svg>
);

export const IconShieldClock = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={cn(iconBase, className)}>
    <path d="M24 4l16 6v12c0 10-7 17-16 22-9-5-16-12-16-22V10z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="24" cy="24" r="8" className="fill-current opacity-90" />
    <path d="M24 19v5l3.5 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconRoute = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={cn(iconBase, className)}>
    <circle cx="10" cy="12" r="4" stroke="currentColor" strokeWidth="3" />
    <circle cx="38" cy="36" r="4" className="fill-current" />
    <path d="M10 16c0 10 6 8 6 16s10 6 10-4 12-6 12 8" stroke="currentColor" strokeWidth="3" strokeDasharray="1 6" strokeLinecap="round" />
  </svg>
);

export const IconVest = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={cn(iconBase, className)}>
    <path d="M16 6l8 5 8-5 6 8-4 4v20a2 2 0 01-2 2H16a2 2 0 01-2-2V18l-4-4z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M20 24h8M20 30h8" className="stroke-current opacity-60" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const IconHandshake = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={cn(iconBase, className)}>
    <path d="M4 22l10-8 8 4 4-3 8 2 10 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 22l8 8a3 3 0 004-4l-7-7M26 19l7 7a3 3 0 01-4 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="8" cy="24" r="3" className="fill-current opacity-90" />
    <circle cx="40" cy="24" r="3" className="fill-current opacity-90" />
  </svg>
);

export const IconPin = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={cn(iconBase, className)}>
    <path d="M24 4c-8 0-14 6-14 14 0 10 14 26 14 26s14-16 14-26c0-8-6-14-14-14z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="24" cy="18" r="5" className="fill-current" />
  </svg>
);
