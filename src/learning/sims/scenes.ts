/**
 * Moduł 3 (napędy): rysunki akumulatora i scen w tym samym stylu linii co forklift.ts.
 * Sceny mają strefy (id + punkt), które komponent zamienia w punkty do dotknięcia.
 */
import { esc, INK2, PAPER } from "./forklift";

export type BatteryKind = "lead" | "gel" | "li";

/* ───────── akumulator trakcyjny z ładowarką ───────── */
export function batterySVG(kind: BatteryKind, soc: number, charging: boolean, t: number, labels: { charger: string; soc: string; status: string }) {
    const W = 520, H = 280, G = 250;
    const x0 = 40, y0 = 96, bw = 300, bh = 140, cells = 6, cw = (bw - 24) / cells;
    const s: string[] = [`<path d="M12 ${G}H${W - 12}" stroke="${INK2}" stroke-width="1.5"/>`];
    // koryto
    s.push(`<g class="bt-ln"><rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" rx="4"/><path d="M${x0} ${y0 + 18}H${x0 + bw}" class="thin"/></g>`);
    s.push(`<g class="bt-ln"><path d="M${x0 + 20} ${y0}v-10h22v10M${x0 + bw - 42} ${y0}v-10h22v10"/></g>`);
    // ogniwa / moduły
    const lvl = Math.max(0, Math.min(1, soc / 100));
    for (let i = 0; i < cells; i++) {
        const cx = x0 + 12 + i * cw, cy = y0 + 26, ch = bh - 36;
        const fillH = (ch - 8) * lvl;
        s.push(`<g class="bt-cell"><rect x="${cx + 3}" y="${cy}" width="${cw - 6}" height="${ch}" rx="2"/><rect x="${cx + 7}" y="${cy + ch - 4 - fillH}" width="${cw - 14}" height="${fillH}" rx="1" class="lvl${soc < 20 ? " low" : ""}"/></g>`);
        if (kind === "lead") s.push(`<g class="bt-ln"><rect x="${cx + cw / 2 - 7}" y="${y0 + 6}" width="14" height="8" rx="2"/></g>`);
        if (kind === "gel") s.push(`<g class="bt-ln"><circle cx="${cx + cw / 2}" cy="${y0 + 10}" r="4"/><path d="M${cx + cw / 2 - 2} ${y0 + 10}h4" class="thin"/></g>`);
    }
    if (kind === "li") s.push(`<g class="bt-ln"><rect x="${x0 + bw / 2 - 40}" y="${y0 + 4}" width="80" height="11" rx="2"/><text x="${x0 + bw / 2}" y="${y0 + 13}" class="bt-tx" text-anchor="middle">BMS</text></g>`);
    // bąbelki gazu przy ładowaniu (wodór)
    if (charging) {
        const n = kind === "lead" ? 3 : kind === "gel" ? 1 : 0;
        for (let i = 0; i < cells; i++) for (let k = 0; k < n; k++) {
            const ph = ((t / 1400 + i * .17 + k / n) % 1), bx = x0 + 12 + i * cw + cw / 2 + Math.sin((ph + i) * 6) * 4, by = y0 + 2 - ph * 70;
            s.push(`<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${(2 + ph * 3).toFixed(1)}" class="h2" opacity="${(1 - ph).toFixed(2)}"/>`);
        }
    }
    // ładowarka i kabel
    const gx = 400;
    s.push(`<g class="bt-ln"><rect x="${gx}" y="${G - 170}" width="84" height="120" rx="6"/><rect x="${gx + 12}" y="${G - 156}" width="60" height="34" rx="3" class="thin"/><path d="M${gx + 42} ${G - 50}V${G}" class="thin"/></g>`);
    s.push(`<text x="${gx + 42}" y="${G - 134}" class="bt-big" text-anchor="middle">${Math.round(soc)}%</text>`);
    s.push(`<text x="${gx + 42}" y="${G - 108}" class="bt-tx" text-anchor="middle">${esc(labels.status)}</text>`);
    s.push(`<text x="${gx + 42}" y="${G - 62}" class="bt-tx k" text-anchor="middle">${esc(labels.charger)}</text>`);
    s.push(`<path d="M${x0 + bw - 31} ${y0 - 10}C${x0 + bw - 31} ${y0 - 60} ${gx - 30} ${G - 200} ${gx + 20} ${G - 170}" class="cable${charging ? " on" : ""}"/>`);
    return `<svg class="bt" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(labels.soc)} ${Math.round(soc)}%">${s.join("")}</svg>`;
}

/* ───────── sceny z punktami do dotknięcia ───────── */
export interface SceneZone { id: string; p: [number, number] }

/** Stanowisko ładowania z błędami (dym, narzędzie na akumulatorze, regał z kartonami, dolewanie w trakcie ładowania). */
export function chargingScene(): { body: string; zones: SceneZone[]; vb: string } {
    const G = 300, s: string[] = [];
    s.push(`<path d="M4 ${G}H516" stroke="${INK2}" stroke-width="1.5"/><path d="M402 ${G}V24" stroke="#e5e7eb" stroke-width="1.5"/>`);
    // regał z kartonami (za blisko ładowania)
    s.push(`<g class="sc-ln"><path d="M8 ${G}V118M78 ${G}V118M8 178H78M8 238H78M8 118H78"/><rect x="14" y="140" width="28" height="38" class="box"/><rect x="46" y="150" width="28" height="28" class="box"/><rect x="14" y="204" width="34" height="34" class="box"/><rect x="52" y="214" width="22" height="24" class="box"/></g>`);
    // palacz między regałem a wózkiem (postać kreską, jak reszta rysunku)
    s.push(`<g class="sc-ln"><circle cx="116" cy="${G - 132}" r="11"/><path d="M100 ${G}l6 -62h20l6 62M104 ${G - 62}l-2 -44q14 -8 28 0l-2 44"/><path d="M128 ${G - 104}l10 18 -8 -26" class="thin"/></g>`);
    s.push(`<g class="sc-ln acc"><path d="M124 ${G - 130}h14"/><path d="M140 ${G - 134}q4 -8 0 -14q-4 -6 2 -12" class="smoke"/></g>`);
    // wózek z otwartą pokrywą akumulatora
    s.push(`<g class="sc-ln"><path d="M160 ${G - 14}V${G - 70}Q160 ${G - 84} 174 ${G - 85}L204 ${G - 88}V${G - 14}Z"/><path d="M204 ${G - 14}V${G - 74}H330L338 ${G - 54}V${G - 14}Z"/><path d="M222 ${G - 74}L230 ${G - 160}M308 ${G - 160}L334 ${G - 74}M218 ${G - 166}H318V${G - 158}H218Z"/>
        <circle cx="188" cy="${G - 16}" r="19" fill="${PAPER}"/><circle cx="188" cy="${G - 16}" r="15"/><circle cx="308" cy="${G - 18}" r="21" fill="${PAPER}"/><circle cx="308" cy="${G - 18}" r="17"/>
        <rect x="344" y="${G - 170}" width="8" height="166"/><path d="M352 ${G - 6}H396L394 ${G - 10}H354"/>
        <path d="M230 ${G - 74}L262 ${G - 120}H306L312 ${G - 74}" class="lid"/><rect x="232" y="${G - 98}" width="80" height="24" class="batt"/><path d="M244 ${G - 98}v24M258 ${G - 98}v24M272 ${G - 98}v24M286 ${G - 98}v24M300 ${G - 98}v24" class="thin"/></g>`);
    // klucz na akumulatorze (lewa strona), konewka (prawa strona, nad akumulatorem)
    s.push(`<g class="sc-ln acc"><path d="M238 ${G - 103}l24 -6"/><circle cx="266" cy="${G - 110}" r="5"/></g>`);
    s.push(`<g class="sc-ln acc"><path d="M292 ${G - 140}h18v14h-18zM310 ${G - 136}l12 -8M292 ${G - 136}q-8 2 -6 10"/></g>`);
    // ściana stanowiska: znaki, kratka, ładowarka, płuczka do oczu
    s.push(`<g class="sign"><path d="M424 72l18 -31 18 31z" class="warn"/><path d="M438 62h8M442 50v8" class="thin"/></g><g class="sign"><circle cx="486" cy="57" r="15" class="ban"/><path d="M475 68l22 -22" class="ban"/><path d="M486 49q-5 6 0 12q5 -6 0 -12" class="thin"/></g>`);
    s.push(`<g class="sc-ln"><rect x="428" y="100" width="64" height="26" rx="2"/><path d="M436 106h48M436 113h48M436 120h48" class="thin"/></g>`);
    s.push(`<g class="sc-ln"><rect x="412" y="150" width="58" height="80" rx="5"/><rect x="420" y="160" width="42" height="22" rx="3" class="thin"/><path d="M441 230C441 268 340 250 300 ${G - 98}" class="thin"/></g><text x="441" y="175" class="sc-tx" text-anchor="middle">72%</text>`);
    s.push(`<g class="sc-ln"><rect x="484" y="176" width="22" height="40" rx="5"/><path d="M490 176v-8h10v8M495 168v-6" class="thin"/><path d="M484 194h22" class="thin"/></g>`);
    return {
        body: s.join(""), vb: "0 20 520 292",
        zones: [
            { id: "shelf", p: [43, 160] }, { id: "smoke", p: [146, G - 150] }, { id: "tool", p: [252, G - 112] }, { id: "water", p: [304, G - 150] },
            { id: "sign", p: [462, 40] }, { id: "vent", p: [460, 113] }, { id: "eyewash", p: [495, 238] },
        ],
    };
}

/** Gdzie odstawić wózek na gaz płynny: zjazd do piwnicy, wpust kanalizacyjny, kanał warsztatowy, plac na powierzchni. */
export function gasParkScene(): { body: string; zones: SceneZone[]; vb: string } {
    const G = 220, s: string[] = [];
    // teren: zjazd w dół po lewej
    s.push(`<path d="M8 ${G}H130L190 ${G + 46}H8" class="sc-ground"/><path d="M130 ${G}L190 ${G + 46}H8M190 ${G + 46}V${G + 70}" stroke="${INK2}" stroke-width="1.5" fill="none"/><path d="M190 ${G}H632" stroke="${INK2}" stroke-width="1.5"/>`);
    s.push(`<g class="sc-ln"><path d="M24 ${G + 46}V${G - 30}H120"/><path d="M36 ${G + 34}h70" class="thin"/></g><text x="72" y="${G + 62}" class="sc-tx" text-anchor="middle">−1</text>`);
    // wpust kanalizacyjny
    s.push(`<g class="sc-ln"><rect x="250" y="${G - 3}" width="44" height="6" rx="1"/><path d="M256 ${G}h32M262 ${G - 3}v6M272 ${G - 3}v6M282 ${G - 3}v6" class="thin"/><path d="M262 ${G + 3}v26h20v-26" class="thin"/></g>`);
    // warsztat z kanałem
    s.push(`<g class="sc-ln"><path d="M340 ${G}V${G - 110}L410 ${G - 140}L480 ${G - 110}V${G}"/><path d="M372 ${G}v30h76v-30" class="pit"/><path d="M380 ${G + 10}h60M380 ${G + 20}h60" class="thin"/></g>`);
    // plac na powierzchni, przewiewny, z oznaczeniem odstępu
    s.push(`<g class="sc-ln"><rect x="530" y="${G - 4}" width="90" height="4" class="park"/><path d="M520 ${G - 60}h110" class="thin"/><path d="M528 ${G - 70}q8 -6 16 0t16 0t16 0" class="thin"/></g>`);
    s.push(`<g class="dimsc"><path d="M300 ${G + 20}H520"/><path d="M306 ${G + 15}l-6 5 6 5M514 ${G + 15}l6 5 -6 5"/></g><text x="410" y="${G + 40}" class="sc-tx" text-anchor="middle">≥ 3 m</text>`);
    return {
        body: s.join(""), vb: "0 70 640 210",
        zones: [{ id: "keller", p: [80, G - 4] }, { id: "gully", p: [272, G - 24] }, { id: "grube", p: [410, G - 60] }, { id: "frei", p: [575, G - 30] }],
    };
}

export function sceneSVG(kind: string, label: string, overlay: string, names?: Record<string, string>) {
    const sc = kind === "gaspark" ? gasParkScene() : chargingScene();
    const tags = names ? sc.zones.map(z => names[z.id] ? `<text x="${z.p[0]}" y="${z.p[1] - 20}" class="sc-name" text-anchor="middle">${esc(names[z.id])}</text>` : "").join("") : "";
    return { zones: sc.zones, html: `<svg class="sc" viewBox="${sc.vb}" role="img" aria-label="${esc(label)}">${sc.body}${tags}${overlay}</svg>` };
}

/** Kafelki „gdzie odstawić wózek gazowy”: osobny, większy rysunek każdego miejsca. */
export function gasTileSVG(id: string, label: string) {
    const G = 104, w = (inner: string) => `<svg class="sc tile-svg" viewBox="0 0 200 140" role="img" aria-label="${esc(label)}">${inner}</svg>`;
    const truck = (x: number, y: number) => `<g class="sc-ln"><path d="M${x} ${y - 6}V${y - 30}Q${x} ${y - 36} ${x + 6} ${y - 36}L${x + 18} ${y - 37}V${y - 6}Z"/><path d="M${x + 18} ${y - 6}V${y - 32}H${x + 66}L${x + 70} ${y - 22}V${y - 6}Z"/><path d="M${x + 26} ${y - 32}L${x + 29} ${y - 66}M${x + 58} ${y - 66}L${x + 68} ${y - 32}M${x + 24} ${y - 69}H${x + 62}V${y - 65}H${x + 24}Z"/><rect x="${x + 2}" y="${y - 30}" width="12" height="14" rx="4" class="gas"/><circle cx="${x + 12}" cy="${y - 6}" r="7" fill="${PAPER}"/><circle cx="${x + 12}" cy="${y - 6}" r="6"/><circle cx="${x + 56}" cy="${y - 7}" r="8" fill="${PAPER}"/><circle cx="${x + 56}" cy="${y - 7}" r="7"/><rect x="${x + 74}" y="${y - 72}" width="4" height="70"/><path d="M${x + 78} ${y - 3}h22"/></g>`;
    const gr = `stroke="${INK2}" stroke-width="1.5" fill="none"`;
    if (id === "keller") return w(`<path d="M0 46H40L120 ${G + 26}H200" ${gr}/><path d="M40 46L120 ${G + 26}H0V46Z" class="sc-ground"/><path d="M120 ${G + 26}V140M120 ${G + 26}H200" ${gr}/><g transform="translate(60 26) rotate(26)">${truck(0, 40)}</g><path d="M150 ${G + 22}v-60h44" class="thin" ${gr}/>`);
    if (id === "gully") return w(`<path d="M0 ${G}H200" ${gr}/>${truck(10, G)}<g class="sc-ln"><rect x="140" y="${G - 3}" width="40" height="6" rx="1"/><path d="M146 ${G}h28M152 ${G - 3}v6M160 ${G - 3}v6M168 ${G - 3}v6" class="thin"/><path d="M152 ${G + 3}v28h16v-28" class="thin"/></g><path d="M156 ${G + 10}q4 6 0 12M164 ${G + 10}q4 6 0 12" class="gasw"/>`);
    if (id === "grube") return w(`<path d="M0 ${G}H200" ${gr}/><g class="sc-ln"><path d="M8 ${G}V26L100 6L192 26V${G}"/></g><path d="M100 ${G}v26h76v-26" class="pit"/><path d="M100 ${G}v26h76v-26" ${gr}/>${truck(14, G)}<path d="M120 ${G + 10}q4 6 0 12M136 ${G + 10}q4 6 0 12M152 ${G + 10}q4 6 0 12" class="gasw"/>`);
    return w(`<path d="M0 ${G}H200" ${gr}/><rect x="16" y="${G - 3}" width="110" height="3" class="park"/>${truck(26, G)}<path d="M146 30q8 -6 16 0t16 0M140 46q8 -6 16 0t16 0" class="thin" ${gr}/><path d="M134 ${G + 16}H196" ${gr}/><path d="M140 ${G + 11}l-6 5 6 5M190 ${G + 11}l6 5 -6 5" ${gr}/><text x="165" y="${G + 34}" class="sc-tx" text-anchor="middle">≥ 3 m</text>`);
}
