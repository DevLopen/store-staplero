import { cn } from "@/lib/utils";

/**
 * Proste flagi w SVG. Emoji-flagi nie wchodzą w grę: Windows renderuje je jako
 * dwie litery ("DE"), więc wyglądałyby inaczej niż na macOS/Androidzie.
 * Wszystkie flagi są kadrowane do proporcji 3:2 (preserveAspectRatio="slice").
 */

export type FlagCode = "DE" | "EN" | "PL" | "UK" | "RU" | "RO";

const Frame = ({ viewBox, children, className }: { viewBox: string; children: React.ReactNode; className?: string }) => (
  <svg
    viewBox={viewBox}
    preserveAspectRatio="xMidYMid slice"
    className={cn("h-4 w-6 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/15", className)}
    aria-hidden
    focusable="false"
  >
    {children}
  </svg>
);

const flags: Record<FlagCode, (className?: string) => JSX.Element> = {
  DE: (c) => (
    <Frame viewBox="0 0 3 2" className={c}>
      <rect width="3" height="2" fill="#FFCE00" />
      <rect width="3" height="1.3334" fill="#DD0000" />
      <rect width="3" height="0.6667" fill="#000" />
    </Frame>
  ),
  // Język angielski → flaga Wielkiej Brytanii
  EN: (c) => (
    <Frame viewBox="0 0 60 30" className={c}>
      <clipPath id="flag-gb-clip">
        <path d="M30 15h30v15zv15h-30zh-30v-15zv-15h30z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0L60 30M60 0L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0L60 30M60 0L0 30" clipPath="url(#flag-gb-clip)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </Frame>
  ),
  PL: (c) => (
    <Frame viewBox="0 0 3 2" className={c}>
      <rect width="3" height="2" fill="#DC143C" />
      <rect width="3" height="1" fill="#fff" />
    </Frame>
  ),
  // Język ukraiński (kod języka: uk) → flaga Ukrainy
  UK: (c) => (
    <Frame viewBox="0 0 3 2" className={c}>
      <rect width="3" height="2" fill="#FFD500" />
      <rect width="3" height="1" fill="#005BBB" />
    </Frame>
  ),
  RU: (c) => (
    <Frame viewBox="0 0 3 2" className={c}>
      <rect width="3" height="2" fill="#D52B1E" />
      <rect width="3" height="1.3334" fill="#0039A6" />
      <rect width="3" height="0.6667" fill="#fff" />
    </Frame>
  ),
  RO: (c) => (
    <Frame viewBox="0 0 3 2" className={c}>
      <rect width="3" height="2" fill="#FCD116" />
      <rect width="1" height="2" fill="#002B7F" />
      <rect x="2" width="1" height="2" fill="#CE1126" />
    </Frame>
  ),
};

export const Flag = ({ code, className }: { code: FlagCode; className?: string }) => flags[code](className);
