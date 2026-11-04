/**
 * Jazda po łuku: widok z góry (wózek jedzie po zakręcie) i widok od tyłu (przechył, siła odśrodkowa, wywrotka).
 * Fizyka z modelu triModel (stability.ts): przesunięcie rzutu środka ciężkości = v²/r · h / g, wywrotka gdy > odstęp do krawędzi.
 */
import { esc } from "./forklift";

export type Radius = "tight" | "wide";
export const R_M: Record<Radius, number> = { tight: 3, wide: 7 };
const R_PX: Record<Radius, number> = { tight: 70, wide: 150 };

/** Tor: prosto w górę, łuk w prawo o 90°, prosto w prawo. Zwraca punkt i kierunek dla postępu 0..1. */
const geo = (rad: Radius) => { const R = R_PX[rad], x0 = 70, s1 = 190 - R, ys = 290 - s1; return { R, x0, s1, ys, cx: x0 + R }; };
export function trackPoint(rad: Radius, p: number) {
    const { R, x0, s1, ys, cx } = geo(rad), A = Math.PI / 2 * R, L2 = 470 - cx;
    const d = p * (s1 + A + L2);
    if (d <= s1) return { x: x0, y: 290 - d, ang: -90, inArc: 0 };
    if (d <= s1 + A) { const t = (d - s1) / R; return { x: cx - R * Math.cos(t), y: ys - R * Math.sin(t), ang: -90 + t * 180 / Math.PI, inArc: (d - s1) / A }; }
    return { x: cx + (d - s1 - A), y: ys - R, ang: 0, inArc: 1 };
}

export function trackSVG(rad: Radius, pos: { x: number; y: number; ang: number }, tipped: boolean, labels: { tight: string; wide: string }, label: string) {
    const s: string[] = [];
    const draw = (r: Radius, active: boolean) => {
        const { R, x0, ys, cx } = geo(r);
        const d = `M${x0} 300V${ys}A${R} ${R} 0 0 1 ${cx} ${ys - R}H520`;
        const mx = cx - R * Math.SQRT1_2, my = ys - R * Math.SQRT1_2;
        return `<path d="${d}" class="trk-road${active ? " on" : ""}"/><path d="${d}" class="trk-mid${active ? " on" : ""}"/>${active ? `<text x="${(mx + 40).toFixed(1)}" y="${(my + 44).toFixed(1)}" class="trk-tx on">${esc(r === "tight" ? labels.tight : labels.wide)}</text>` : ""}`;
    };
    s.push(draw(rad === "tight" ? "wide" : "tight", false), draw(rad, true));
    // wózek z góry, przód (widły) w kierunku jazdy
    const truck = `<g class="trk-truck${tipped ? " down" : ""}" transform="translate(${(pos.x - (tipped ? 14 : 0)).toFixed(1)} ${pos.y.toFixed(1)}) rotate(${(pos.ang + 90 + (tipped ? -28 : 0)).toFixed(1)})">
        <rect x="-15" y="-18" width="30" height="40" rx="5" class="tt-body"/><rect x="-13" y="12" width="26" height="9" rx="3" class="tt-cw"/>
        <path d="M-15 -19h30" class="tt-mast"/><path d="M-9 -20v-20M9 -20v-20" class="tt-fork"/>
        <rect x="-19" y="-18" width="6" height="11" rx="2" class="tt-wh"/><rect x="13" y="-18" width="6" height="11" rx="2" class="tt-wh"/>
        <rect x="-17" y="10" width="5" height="9" rx="2" class="tt-wh"/><rect x="12" y="10" width="5" height="9" rx="2" class="tt-wh"/></g>`;
    s.push(truck);
    return `<svg class="trk" viewBox="30 40 470 260" role="img" aria-label="${esc(label)}">${s.join("")}</svg>`;
}

/** Widok od tyłu: przechył proporcjonalny do stosunku momentów, wywrotka powyżej 1. Strzałki zostają poziome. */
export function rearSVG(ratio: number, loaded: boolean, raised: boolean, roll: number, labels: { cf: string; edge: string; cog: string; title: string }) {
    const G = 160, CX = 230, base = 62, pivX = CX - base;           // krawędź wywrotu: zewnętrzne (lewe) koło
    const hPx = loaded ? (raised ? 96 : 46) : 54;
    const a = -roll * Math.PI / 180;
    const rp = (x: number, y: number): [number, number] => [pivX + (x - pivX) * Math.cos(a) - (y - G) * Math.sin(a), G + (x - pivX) * Math.sin(a) + (y - G) * Math.cos(a)];
    const s: string[] = [`<path d="M0 ${G}H400" class="rv-ground"/>`];
    s.push(`<g transform="rotate(${(-roll).toFixed(2)} ${pivX} ${G})">`);
    s.push(`<rect x="${CX - 52}" y="${G - 74}" width="104" height="56" rx="10" class="rv-body"/><path d="M${CX - 46} ${G - 74}l6 -46h80l6 46M${CX - 48} ${G - 124}h96" class="rv-guard"/>`);
    s.push(`<rect x="${pivX - 12}" y="${G - 34}" width="24" height="34" rx="6" class="rv-wh"/><rect x="${CX + base - 12}" y="${G - 34}" width="24" height="34" rx="6" class="rv-wh"/>`);
    if (loaded) s.push(`<rect x="${CX - 46}" y="${G - 40 - hPx - 34}" width="92" height="34" rx="2" class="rv-load"/>`);
    s.push(`</g>`);
    const [cgX, cgY] = rp(CX, G - 30 - hPx * 0.7);
    const k = Math.min(1.5, ratio), arrow = k * 70;
    if (arrow > 4) s.push(`<path d="M${(cgX - 12).toFixed(1)} ${cgY.toFixed(1)}h${(-arrow).toFixed(1)}" class="rv-cf"/><path d="M${(cgX - 12 - arrow).toFixed(1)} ${cgY.toFixed(1)}l9 -6v12z" class="rv-cfh"/><text x="${(cgX - 16 - arrow / 2).toFixed(1)}" y="${(cgY - 12).toFixed(1)}" class="rv-tx" text-anchor="middle">${esc(labels.cf)}</text>`);
    if (roll < 30) s.push(`<path d="M${cgX.toFixed(1)} ${cgY.toFixed(1)}L${(cgX - k * (cgX - pivX)).toFixed(1)} ${G}" class="rv-res${ratio >= 1 ? " no" : ""}"/>`);
    s.push(`<circle cx="${cgX.toFixed(1)}" cy="${cgY.toFixed(1)}" r="8" class="rv-cg"/>`);
    s.push(`<path d="M${pivX} ${G + 4}v12" class="rv-edge"/><text x="${pivX}" y="${G + 32}" class="rv-tx k" text-anchor="middle">${esc(labels.edge)}</text>`);
    s.push(`<text x="392" y="24" class="rv-tx k" text-anchor="end">${esc(labels.title)}</text>`);
    return `<svg class="rv" viewBox="0 0 400 200" role="img" aria-label="${esc(labels.title)}">${s.join("")}</svg>`;
}
