/**
 * Rysunek techniczny wózka czołowego (styl „linia” z okładki): grafitowe kontury, pomarańczowy ładunek
 * i wyróżnienie, linie wymiarowe. Generowany jako SVG z parametrami (podnoszenie, pochylenie, typ masztu,
 * osprzęt, wyróżniona część), żeby te same części działały w eksploracji, symulacji masztu i osprzęcie.
 */

export const INK = "#2b3440", INK2 = "#8a94a3", PAPER = "#fbfbfa", ORANGE = "#f97706", ORANGE_BG = "#fff4e6", GREEN = "#16a34a", RED = "#dc2626";
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const G = 380;                 // linia podłogi
const X0 = 100, VW = 528;      // kadr poziomy (bez pustych marginesów)
const MM = 0.1;                // px na mm
const PIV: [number, number] = [418, 360];   // oś pochylenia masztu (przy osi przedniej)

export type MastKind = "simplex" | "duplex" | "triplex";
export type Attachment = "none" | "sideshift" | "extension" | "clamp" | "bin";
export type PartId = "mast" | "carriage" | "forks" | "chain" | "tilt" | "guard" | "restraint" | "cw" | "steer" | "front" | "lsg" | "plate";
export const PART_IDS: PartId[] = ["mast", "carriage", "forks", "chain", "tilt", "lsg", "guard", "restraint", "cw", "steer", "front", "plate"];

/** Przykładowe maszty (wartości poglądowe, opisane w lekcji jako przykład). */
export const MASTS: Record<MastKind, { stages: number; free: number; max: number; built: number }> = {
    simplex: { stages: 1, free: 1600, max: 1600, built: 2300 },
    duplex: { stages: 2, free: 150, max: 3000, built: 2300 },
    triplex: { stages: 3, free: 1600, max: 4700, built: 2300 },
};

/** Rozkład podnoszenia: ile wysunęły się stopnie masztu, gdzie jest wózek widłowy (karetka). */
export function mastState(kind: MastKind, lift: number) {
    const m = MASTS[kind], h = Math.max(0, Math.min(lift, m.max));
    const ext: number[] = [0, 0, 0];             // wysunięcie stopnia 2 i 3 względem podłogi
    if (h > m.free) {
        const rest = h - m.free;
        if (m.stages === 2) ext[1] = rest / 2;   // łańcuch 2:1, karetka jedzie dwa razy szybciej niż maszt
        if (m.stages === 3) { ext[1] = rest / 2; ext[2] = rest; }
    }
    const top = m.built + Math.max(ext[1], ext[2]);
    return { h, ext, top, free: h <= m.free, mast: m };
}

const rot = ([x, y]: [number, number], deg: number): [number, number] => {
    const a = deg * Math.PI / 180, dx = x - PIV[0], dy = y - PIV[1];
    return [PIV[0] + dx * Math.cos(a) - dy * Math.sin(a), PIV[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};

export interface ForkliftOpts {
    lift?: number;              // mm wysokości wideł
    tilt?: number;              // stopnie, + do przodu, - do tyłu
    mast?: MastKind;
    attach?: Attachment;
    load?: "pallet" | "long" | "bale" | "none";
    hi?: PartId | null;         // wyróżniona część (reszta przygaszona)
    dim?: boolean;              // linia wymiarowa wysokości
    ceiling?: number | null;    // mm: przeszkoda nad masztem (np. strop kontenera)
    draw?: boolean;             // animacja rysowania linii (okładka)
    /** Opisy wymiarów na rysunku (zamiast osobnych kafelków): gotowe teksty w języku kursanta. */
    annot?: { lift: [string, string]; top: [string, string]; tilt: string; ceil?: string; note?: string };
}

export interface ForkliftOut { svg: string; anchors: Record<PartId, [number, number]>; viewTop: number; hit: boolean; topMm: number; }

/** Główny rysunek. Zwraca kod SVG (bez znacznika <svg>) i punkty zaczepienia części do hotspotów. */
export function forklift(o: ForkliftOpts = {}): ForkliftOut {
    const kind = o.mast ?? "duplex", tilt = o.tilt ?? 0, att = o.attach ?? "none";
    const ms = mastState(kind, o.lift ?? 0);
    const cls = (id: PartId) => `class="pt${o.hi ? (o.hi === id ? " hi" : " dim") : ""}" data-p="${id}"`;
    const anchors = {} as Record<PartId, [number, number]>;
    const s: string[] = [];

    // ── podłoga
    s.push(`<path d="M${X0 - 44} ${G}H${X0 + VW - 6}" stroke="${INK2}" stroke-width="1.5"/>`);

    // ── przeciwwaga
    s.push(`<g ${cls("cw")}><path d="M124 344V266Q124 240 150 238L212 234V344Z"/><path d="M132 262H204M132 276H204M132 290H204" class="thin"/></g>`);
    anchors.cw = [160, 300];
    // ── korpus, maska, tabliczka
    s.push(`<g class="pt${o.hi ? " dim" : ""}"><path d="M212 344V268L226 262H392L408 300V344Z"/><path d="M226 262L244 236H330L350 262" class="thin"/></g>`);
    s.push(`<g ${cls("plate")}><rect x="226" y="296" width="26" height="17" rx="1.5"/><path d="M230 301H248M230 305H244M230 309H246" class="thin"/></g>`);
    anchors.plate = [239, 304];

    // ── siedzenie, kolumna kierownicy
    s.push(`<g class="pt${o.hi ? " dim" : ""}"><path d="M258 262V220Q258 210 268 210H276Q282 210 282 218V250H316V262"/><path d="M342 262L326 210M314 206L338 200" /></g>`);
    // ── system przytrzymania kierowcy: bügel drzwiowy + pas
    s.push(`<g ${cls("restraint")}><path d="M250 214Q296 196 334 228"/><path d="M262 250L300 240" class="thin"/><circle cx="250" cy="214" r="3"/></g>`);
    anchors.restraint = [296, 205];
    // ── dach ochronny
    s.push(`<g ${cls("guard")}><path d="M244 262L252 134M356 134L398 262"/><path d="M240 126H366V136H240Z"/><path d="M262 126V136M284 126V136M306 126V136M328 126V136M350 126V136" class="thin"/></g>`);
    anchors.guard = [303, 131];

    // ── koła: maska tła, opona, felga
    const wheel = (id: PartId, cx: number, cy: number, r: number) => {
        anchors[id] = [cx, cy];
        return `<g ${cls(id)}><circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="${PAPER}" stroke="none"/><circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="${r * .55}" class="thin"/><circle cx="${cx}" cy="${cy}" r="${r * .16}"/></g>`;
    };
    s.push(wheel("steer", 176, G - 30, 30), wheel("front", 370, G - 34, 34));

    // ── maszt (obracany wokół osi pochylenia)
    const mast: string[] = [];
    const baseY = G - 8, stH = 222 - 0;   // wysokość jednego stopnia w px
    const stageX = [404, 412, 420];
    const stTop: number[] = [];
    for (let i = 0; i < ms.mast.stages; i++) {
        const e = (i === 0 ? 0 : ms.ext[i]) * MM;
        const top = baseY - stH - e, bottom = baseY - 6 * i - e;
        stTop.push(top);
        mast.push(`<rect x="${stageX[i]}" y="${top}" width="10" height="${bottom - top}" rx="1"/><path d="M${stageX[i]} ${top + 10}H${stageX[i] + 10}M${stageX[i]} ${bottom - 10}H${stageX[i] + 10}" class="thin"/>`);
    }
    const lastX = stageX[ms.mast.stages - 1], innerTop = stTop[stTop.length - 1];
    // cylinder podnoszenia (za masztem)
    mast.push(`<path d="M398 ${baseY}V${baseY - 150 - (ms.mast.stages > 1 ? ms.ext[1] * MM : 0)}" class="thin" stroke-width="5" stroke-linecap="butt" opacity=".35"/>`);
    // karetka (Gabelträger) i widły
    const carH = 62, forkY = baseY + 6 - ms.h * MM, carTop = forkY - carH;
    const cx0 = lastX + 12;
    // łańcuch: od karetki przez rolkę na szczycie najwyższego stopnia w dół
    const roll: [number, number] = [lastX + 5, innerTop + 4];
    const chain = `<g ${cls("chain")}><circle cx="${roll[0]}" cy="${roll[1]}" r="5"/><path d="M${cx0 + 3} ${carTop + 8}V${roll[1]}" class="chain"/><path d="M${roll[0] - 4} ${roll[1]}V${Math.min(baseY - 30, roll[1] + 120)}" class="chain"/></g>`;
    const outerTop = stTop[0];
    const mastGroup = `<g ${cls("mast")}>${mast.join("")}</g>`;
    anchors.mast = [stageX[0] + 5, Math.max(outerTop + 60, (outerTop + baseY) / 2 - 10)];
    anchors.chain = [roll[0], roll[1] + 22];

    // osprzęt i widły
    let tool = "", toolAnchor: [number, number] = [cx0 + 70, forkY - 4], loadX = cx0 + 22, loadW = 104, ext = 0;
    const forkLen = 112;
    const forks = (len: number) => `<g ${cls("forks")}><path d="M${cx0 + 8} ${carTop + 6}V${forkY}H${cx0 + 8 + len}L${cx0 + 8 + len - 2} ${forkY - 5}H${cx0 + 14}V${carTop + 6}Z"/></g>`;
    if (att === "clamp") {
        tool = `<g class="att"><rect x="${cx0 + 6}" y="${carTop - 2}" width="18" height="${carH + 4}" rx="2"/><path d="M${cx0 + 24} ${carTop + 10}H${cx0 + 40}M${cx0 + 24} ${forkY - 14}H${cx0 + 40}"/><rect x="${cx0 + 40}" y="${carTop - 30}" width="8" height="${carH + 26}" rx="2"/></g>`;
        loadX = cx0 + 50; loadW = 96; toolAnchor = [cx0 + 30, carTop + 20];
    } else {
        let len = forkLen, extra = "";
        if (att === "sideshift") { extra = `<g class="att"><rect x="${cx0 + 6}" y="${carTop + 2}" width="10" height="${carH - 4}" rx="1.5"/><path d="M${cx0 + 11} ${carTop + 12}v${carH - 24}" class="thin"/></g>`; ext = 10; toolAnchor = [cx0 + 11, carTop + 30]; }
        if (att === "extension") { extra = `<g class="att"><path d="M${cx0 + 60} ${forkY + 2}H${cx0 + 8 + forkLen + 70}L${cx0 + 6 + forkLen + 70} ${forkY - 7}H${cx0 + 60}Z"/></g>`; len = forkLen; toolAnchor = [cx0 + 150, forkY - 3]; loadX = cx0 + 60; loadW = 150; }
        if (att === "bin") { extra = `<g class="att"><path d="M${cx0 + 24} ${forkY - 6}L${cx0 + 20} ${forkY - 60}H${cx0 + 128}L${cx0 + 112} ${forkY - 6}Z"/><path d="M${cx0 + 26} ${forkY - 48}H${cx0 + 122}" class="thin"/></g>`; toolAnchor = [cx0 + 76, forkY - 32]; }
        tool = (ext ? `<g transform="translate(${ext} 0)">` : "<g>") + forks(len) + "</g>" + extra;
    }
    anchors.forks = [cx0 + 8 + ext + 80, forkY - 3];
    anchors.carriage = [cx0 + 4, carTop + carH / 2];
    // ładunek
    let loadSvg = "";
    const ld = o.load ?? "none";
    if (ld === "pallet" && att !== "clamp" && att !== "bin") {
        const ly = forkY - 6;
        loadSvg = `<g class="load"><path d="M${loadX} ${ly}h${loadW}v-12h-${loadW}z"/><path d="M${loadX + 8} ${ly - 6}h14M${loadX + loadW / 2 - 7} ${ly - 6}h14M${loadX + loadW - 22} ${ly - 6}h14" class="thin"/><rect x="${loadX + 4}" y="${ly - 72}" width="${loadW - 8}" height="60" rx="1"/><path d="M${loadX + 4} ${ly - 42}H${loadX + loadW - 4}M${loadX + loadW / 2} ${ly - 72}V${ly - 12}" class="thin"/></g>`;
    }
    if (ld === "long" && att === "extension") {
        const ly = forkY - 7;
        loadSvg = `<g class="load"><rect x="${loadX - 50}" y="${ly - 36}" width="${loadW + 40}" height="36" rx="1"/><path d="M${loadX - 50} ${ly - 18}H${loadX + loadW - 10}" class="thin"/></g>`;
    }
    if (att === "clamp") loadSvg = `<g class="load"><rect x="${loadX - 2}" y="${carTop - 22}" width="${loadW}" height="${carH + 22}" rx="10"/><path d="M${loadX + 10} ${carTop - 6}H${loadX + loadW - 14}M${loadX + 10} ${carTop + 20}H${loadX + loadW - 14}M${loadX + 10} ${carTop + 46}H${loadX + loadW - 14}" class="thin"/></g>`;
    // krata ochronna ładunku
    const lsgH = 48;
    const lsg = att === "clamp" ? "" : `<g ${cls("lsg")}><path d="M${cx0} ${carTop}V${carTop - lsgH}H${cx0 + 22}V${carTop}"/><path d="M${cx0 + 7} ${carTop}V${carTop - lsgH}M${cx0 + 15} ${carTop}V${carTop - lsgH}M${cx0} ${carTop - 25}H${cx0 + 22}M${cx0} ${carTop - 50}H${cx0 + 22}" class="thin"/></g>`;
    anchors.lsg = [cx0 + 11, carTop - lsgH + 16];
    const carriage = `<g ${cls("carriage")}><rect x="${cx0 - 4}" y="${carTop}" width="12" height="${carH}" rx="1.5"/><path d="M${cx0 - 4} ${carTop + 14}h12M${cx0 - 4} ${carTop + carH - 14}h12" class="thin"/></g>`;

    const mastAll = `<g transform="rotate(${tilt} ${PIV[0]} ${PIV[1]})">${mastGroup}${chain}${lsg}${carriage}${tool}${loadSvg}</g>`;
    // cylinder pochylenia: od korpusu do masztu
    const A: [number, number] = [364, 286], B = rot([404, 296], tilt);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, mid: [number, number] = [A[0] + ux * 26, A[1] + uy * 26];
    const tiltSvg = `<g ${cls("tilt")}><path d="M${A[0]} ${A[1]}L${mid[0]} ${mid[1]}" stroke-width="9" stroke-linecap="round" class="barrel"/><path d="M${mid[0]} ${mid[1]}L${B[0]} ${B[1]}" stroke-width="3"/><circle cx="${A[0]}" cy="${A[1]}" r="3"/><circle cx="${B[0]}" cy="${B[1]}" r="3"/></g>`;
    anchors.tilt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 1];
    // obrót punktów zaczepienia elementów masztu
    for (const id of ["mast", "chain", "lsg", "carriage", "forks"] as PartId[]) anchors[id] = rot(anchors[id], tilt);
    const toolPt = rot(toolAnchor, tilt);
    s.push(mastAll, tiltSvg);

    // ── strop / przeszkoda nad masztem
    let hit = false;
    const topY = Math.min(...stTop.map((t, i) => rot([stageX[i] + 5, t], tilt)[1]));
    // najwyższy punkt całości: maszt, krata ochronna, ładunek (to one uderzają w strop)
    const loadTop = ld === "pallet" && att !== "clamp" && att !== "bin" ? forkY - 78 : att === "clamp" ? carTop - 22 : forkY;
    const highest = Math.min(topY, rot([cx0 + 11, carTop - (att === "clamp" ? 0 : lsgH)], tilt)[1], rot([loadX + loadW, loadTop], tilt)[1], rot([loadX, loadTop], tilt)[1]);
    if (o.ceiling) {
        const cy = G - o.ceiling * MM;
        hit = highest < cy + 1;
        s.push(`<g class="ceil${hit ? " hit" : ""}"><rect x="330" y="${cy - 14}" width="${X0 + VW - 330}" height="14" class="band"/>${o.annot?.ceil ? `<text x="${X0 + VW - 8}" y="${cy - 3.5}" class="ceiltx" text-anchor="end">${esc(o.annot.ceil)}</text>` : ""}<path d="M330 ${cy}H${X0 + VW}"/><path d="M340 ${cy}l-10 -10M360 ${cy}l-10 -10M380 ${cy}l-10 -10M400 ${cy}l-10 -10M420 ${cy}l-10 -10M440 ${cy}l-10 -10M460 ${cy}l-10 -10M480 ${cy}l-10 -10M500 ${cy}l-10 -10M520 ${cy}l-10 -10M540 ${cy}l-10 -10M560 ${cy}l-10 -10M580 ${cy}l-10 -10M600 ${cy}l-10 -10M620 ${cy}l-10 -10" class="thin"/></g>`);
    }
    // ── linie wymiarowe z opisem na rysunku (jak na rysunku technicznym)
    const arrow = (x: number, y1: number, y2: number) => `<path d="M${x} ${y1}V${y2}"/><path d="M${x - 4} ${y1 - 7}L${x} ${y1}L${x + 4} ${y1 - 7}M${x - 4} ${y2 + 7}L${x} ${y2}L${x + 4} ${y2 + 7}"/>`;
    if (o.dim) {
        const fy = rot([cx0 + 60, forkY], tilt)[1], x = X0 + VW - 14;
        s.push(`<g class="dimline">${G - fy > 14 ? arrow(x, G, fy) : ""}<path d="M${cx0 + 130} ${fy}H${x + 6}" stroke-dasharray="3 4" class="thin"/></g>`);
        if (o.annot) s.push(`<text x="${X0 + VW - 6}" y="${G + 30}" class="dimtx" text-anchor="end"><tspan class="k">${esc(o.annot.lift[0])}</tspan> ${esc(o.annot.lift[1])}</text>`);
    }
    if (o.annot) {
        // wysokość konstrukcyjna po lewej
        const tx = stageX[0] + 5, xl = X0 - 22;
        s.push(`<g class="dimline dim2">${arrow(xl, G, topY)}<path d="M${xl - 6} ${topY}H${tx}" stroke-dasharray="3 4" class="thin"/></g>`);
        s.push(`<text x="${X0 - 42}" y="${G + 30}" class="dimtx" text-anchor="start"><tspan class="k">${esc(o.annot.top[0])}</tspan> ${esc(o.annot.top[1])}</text>`);
        if (o.annot.note) s.push(`<text x="${X0 - 42}" y="__NOTE_Y__" class="notetx">${esc(o.annot.note)}</text>`);
        // kąt pochylenia: pionowa linia odniesienia, łuk i wartość przy szczycie masztu
        const r = PIV[1] - outerTop, a0 = -Math.PI / 2, a1 = a0 + tilt * Math.PI / 180;
        const p0: [number, number] = [PIV[0] + r * Math.cos(a0), PIV[1] + r * Math.sin(a0)], p1: [number, number] = [PIV[0] + r * Math.cos(a1), PIV[1] + r * Math.sin(a1)];
        s.push(`<g class="dimline ang"><path d="M${PIV[0]} ${PIV[1] - r + 70}V${PIV[1] - r - 16}" stroke-dasharray="3 4" class="thin"/>${Math.abs(tilt) > .4 ? `<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}A${r} ${r} 0 0 ${tilt > 0 ? 1 : 0} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}"/>` : ""}</g>`);
        const lx = Math.min(p0[0], p1[0]) - 10;
        s.push(`<text x="${lx.toFixed(1)}" y="${(Math.min(p0[1], p1[1]) - 8).toFixed(1)}" class="dimtx" text-anchor="end">${esc(o.annot.tilt)}</text>`);
    }
    const viewTop = Math.min(100, (o.ceiling ? G - o.ceiling * MM : 999) - 40, topY - 40, rot([cx0, carTop - lsgH], tilt)[1] - 30);
    (anchors as Record<string, [number, number]>).tool = toolPt;
    return { svg: s.join(""), anchors, viewTop, hit, topMm: (G - topY) / MM };
}

/** Pełny znacznik SVG z ramką widoku dopasowaną do wysokości masztu. */
export function forkliftSVG(o: ForkliftOpts, extra = "", label = "", fixedTop?: number) {
    const f = forklift(o);
    const top = fixedTop ?? f.viewTop;
    const h = G + (o.annot ? 44 : 14) - top, x0 = o.annot ? X0 - 48 : X0, w = o.annot ? VW + 48 : VW;
    return { ...f, html: `<svg class="fl${o.draw ? " fl-draw" : ""}" viewBox="${x0} ${top} ${w} ${h}" role="img" aria-label="${esc(label)}">${f.svg.replace("__NOTE_Y__", String(top + 22))}${extra}</svg>` };
}

/* ───────── hotspoty na rysunku ───────── */
export function hotspots(anchors: Partial<Record<string, [number, number]>>, ids: string[], state: { seen?: Record<string, boolean>; cur?: string | null; right?: Record<string, boolean>; wrong?: string | null; numbered?: boolean }) {
    return ids.map((id, i) => {
        const p = anchors[id];
        if (!p) return "";
        const seen = state.seen?.[id], cur = state.cur === id, ok = state.right?.[id], bad = state.wrong === id;
        const c = bad ? "bad" : ok ? "ok" : cur ? "cur" : seen ? "seen" : "";
        return `<g class="hs ${c}" data-k="${id}" transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})" tabindex="-1">
            <circle r="26" class="hs-hit"/>${cur ? '<circle r="13" class="hs-ring"/>' : ""}<circle r="10" class="hs-dot"/>
            ${seen || ok ? '<path d="M-4 .5l2.6 2.6L4.2-3" class="hs-ck"/>' : bad ? '<path d="M-3.5-3.5l7 7M3.5-3.5l-7 7" class="hs-ck"/>' : state.numbered ? `<text y="4" class="hs-n">${i + 1}</text>` : '<circle r="3" class="hs-c"/>'}</g>`;
    }).join("");
}

/** Etykieta z linią odniesienia dla aktualnej części (styl karty katalogowej). */
export function callout(p: [number, number] | undefined, text: string, viewTop: number) {
    if (!p) return "";
    const right = p[0] < 330, w = Math.max(70, text.length * 7.4 + 22);
    const ly = Math.max(viewTop + 26, p[1] - 46), lx = Math.min(X0 + VW - w - 6, Math.max(X0 + 6, right ? p[0] + 34 : p[0] - 34 - w));
    const ex = right ? lx : lx + w;
    return `<g class="callout"><path d="M${p[0]} ${p[1]}L${right ? p[0] + 22 : p[0] - 22} ${ly + 13}H${ex}"/><rect x="${lx}" y="${ly}" width="${w}" height="26" rx="13"/><text x="${lx + w / 2}" y="${ly + 17.5}">${esc(text)}</text></g>`;
}

/* ───────── sylwetki innych typów wózków (ten sam styl) ───────── */
export type TruckType = "front" | "reach" | "highlift" | "lowlift" | "vna" | "tele" | "picker";
const W = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="${PAPER}" stroke="none"/><circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="${r * .4}" class="thin"/>`;
const PAL = (x: number, y: number, w = 70) => `<g class="load"><path d="M${x} ${y}h${w}v-8h-${w}z"/><rect x="${x + 3}" y="${y - 48}" width="${w - 6}" height="40" rx="1"/><path d="M${x + 3} ${y - 28}H${x + w - 3}" class="thin"/></g>`;
export function truckSVG(t: TruckType, label = "") {
    const g = 190;
    const parts: Record<TruckType, string> = {
        front: `<path d="M34 ${g - 14}V${g - 62}Q34 ${g - 76} 48 ${g - 77}L84 ${g - 80}V${g - 14}Z"/><path d="M84 ${g - 14}V${g - 66}H170L178 ${g - 46}V${g - 14}Z"/><path d="M104 ${g - 66}L108 ${g - 128}M160 ${g - 128}L176 ${g - 66}M100 ${g - 132}H164V${g - 126}H100Z"/>${W(64, g - 16, 16)}${W(160, g - 18, 18)}<rect x="186" y="${g - 150}" width="7" height="146"/><rect x="194" y="${g - 30}" width="7" height="26"/><path d="M196 ${g - 6}H262L260 ${g - 10}H200"/>${PAL(204, g - 10)}`,
        reach: `<path d="M30 ${g - 14}V${g - 92}Q30 ${g - 100} 38 ${g - 100}H104V${g - 14}Z"/><path d="M40 ${g - 100}L44 ${g - 146}M100 ${g - 146}V${g - 100}M36 ${g - 150}H106V${g - 144}H36Z"/><path d="M104 ${g - 12}H246"/>${W(56, g - 14, 13)}<circle cx="240" cy="${g - 8}" r="7"/><g class="move"><rect x="150" y="${g - 168}" width="7" height="150"/><path d="M146 ${g - 40}l-14 0M140 ${g - 46}l-8 6 8 6" class="arrow"/><path d="M160 ${g - 24}H220L218 ${g - 28}H162"/>${PAL(164, g - 28, 58)}</g>`,
        highlift: `<path d="M52 ${g - 14}V${g - 78}H112V${g - 14}Z"/><path d="M52 ${g - 70}L20 ${g - 110}M14 ${g - 114}L26 ${g - 106}" stroke-width="3"/>${W(70, g - 12, 10)}<rect x="116" y="${g - 156}" width="7" height="150"/><path d="M112 ${g - 6}H232"/><circle cx="226" cy="${g - 5}" r="5"/><path d="M126 ${g - 20}H214L212 ${g - 24}H128"/>${PAL(132, g - 24, 66)}`,
        lowlift: `<path d="M70 ${g - 12}V${g - 64}H118V${g - 12}Z"/><path d="M78 ${g - 60}L44 ${g - 100}M38 ${g - 104}L50 ${g - 96}" stroke-width="3"/>${W(88, g - 10, 9)}<path d="M118 ${g - 10}H250L248 ${g - 18}H118Z"/><circle cx="240" cy="${g - 5}" r="5"/>${PAL(150, g - 18, 80)}`,
        vna: `<path d="M24 ${g - 14}V${g - 70}H150V${g - 14}Z"/><g class="move"><rect x="60" y="${g - 128}" width="58" height="56" rx="3"/><path d="M68 ${g - 118}H110V${g - 92}H68Z" class="thin"/></g><rect x="154" y="${g - 178}" width="8" height="172"/><rect x="166" y="${g - 104}" width="28" height="40" rx="2"/><path d="M180 ${g - 64}V${g - 56}M174 ${g - 56}H200M174 ${g - 68}H200" class="thin"/>${W(46, g - 14, 12)}${W(128, g - 14, 12)}<path d="M8 ${g + 4}H260M8 ${g + 9}H260" class="rail"/>`,
        tele: `<path d="M44 ${g - 30}H222L230 ${g - 54}H38Z"/><path d="M70 ${g - 54}V${g - 112}H112L118 ${g - 54}"/><path d="M76 ${g - 104}H108V${g - 72}H76Z" class="thin"/><path d="M120 ${g - 62}L214 ${g - 132}L222 ${g - 122}L128 ${g - 52}Z"/><path d="M160 ${g - 92}L168 ${g - 82}" class="thin"/><path d="M216 ${g - 136}L238 ${g - 140}V${g - 104}M238 ${g - 104}H274L272 ${g - 108}H242"/>${W(78, g - 26, 24)}${W(194, g - 26, 24)}`,
        picker: `<path d="M30 ${g - 14}V${g - 70}H110V${g - 14}Z"/><rect x="114" y="${g - 176}" width="8" height="170"/><g class="move"><path d="M124 ${g - 112}H176V${g - 104}H124Z"/><path d="M130 ${g - 112}V${g - 150}M170 ${g - 112}V${g - 150}M130 ${g - 150}H170" class="thin"/><circle cx="150" cy="${g - 138}" r="6"/><path d="M150 ${g - 132}V${g - 114}" class="thin"/></g><path d="M122 ${g - 8}H230L228 ${g - 12}H124"/>${W(50, g - 14, 12)}<circle cx="222" cy="${g - 6}" r="5"/>`,
    };
    return `<svg class="tk" viewBox="0 0 280 210" role="img" aria-label="${esc(label)}"><path d="M4 ${g}H276" stroke="${INK2}" stroke-width="1.2"/><g class="tk-ln">${parts[t]}</g></svg>`;
}

/** Najwyższy punkt wózka 3D (mm): maszt (2340 mm złożony) albo krata oporowa nad widłami (+1070 mm). */
export const top3D = (kind: MastKind, liftMm: number) => Math.max(mastState(kind, liftMm).top + 40, liftMm + 1070);
