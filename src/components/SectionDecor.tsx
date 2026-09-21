import { cn } from "@/lib/utils";

/**
 * Miękka, organiczna "plama" tła — asymetryczny promień, niska opacity.
 * Zamiast prostokątnych bloków gradientowych.
 */
interface BlobProps {
  tone?: "primary" | "accent" | "dark";
  className?: string;
}

const blobTones = {
  primary: "bg-primary",
  accent: "bg-accent",
  dark: "bg-industrial",
};

export const Blob = ({ tone = "primary", className }: BlobProps) => (
  <div
    aria-hidden
    className={cn(
      "absolute pointer-events-none blur-3xl opacity-[0.08]",
      blobTones[tone],
      className
    )}
    style={{ borderRadius: "62% 38% 55% 45% / 45% 60% 40% 55%" }}
  />
);

/**
 * Bardzo subtelna tekstura "siatki regałowej" — cienkie linie poziome/pionowe
 * w tle sekcji, nawiązanie do regałów magazynowych.
 */
export const RackTexture = ({ className }: { className?: string }) => (
  <svg
    aria-hidden
    className={cn("absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]", className)}
    preserveAspectRatio="none"
  >
    <defs>
      <pattern id="rack-grid" width="56" height="56" patternUnits="userSpaceOnUse">
        <path d="M0 0H56M0 0V56" stroke="currentColor" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#rack-grid)" />
  </svg>
);
