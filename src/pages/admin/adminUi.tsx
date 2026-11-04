/** Wspólne drobne elementy nowego panelu: awatar z inicjałami i ikona-kafelek (jak w pasku bocznym). */
import type { ReactNode } from "react";

const hue = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).map(x => x[0]).join("").slice(0, 2).toUpperCase() || "?";

export function Avatar({ name, src, size = 32 }: { name: string; src?: string; size?: number }) {
    return <span className="adm-av" style={{ width: size, height: size, fontSize: Math.round(size * .38), ["--h" as any]: hue(name || "?") }}>
        {src ? <img src={src} alt="" /> : initials(name || "?")}
    </span>;
}

export type TileColor = "orange" | "blue" | "green" | "amber" | "red" | "indigo" | "teal" | "graphite" | "brown";
export function Tile({ color, size = 28, children }: { color: TileColor; size?: number; children: ReactNode }) {
    return <span className={`adm-tile t-${color} adm-tile-x`} style={{ width: size, height: size }}>{children}</span>;
}
