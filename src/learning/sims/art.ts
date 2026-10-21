// Rysunki SVG symulacji, przeniesione 1:1 z zaakceptowanego public/demo/kurs-demo.html.
// Funkcje zwracają kod SVG jako tekst (treść wyłącznie nasza, bez danych od użytkownika poza przetłumaczonymi etykietami).
export type Tx = (key: string, vars?: Record<string, string | number>) => string;
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/* ───────── skręt z góry ───────── */
export const OX = 60, OY = 190;
export const ICR = { stapler: [95, -60], auto: [20, -60] } as const;
export type Mode = keyof typeof ICR;
export const OUTLINE = (() => { const p: number[][] = []; for (let x = 0; x <= 120; x += 10) p.push([x, 35], [x, -35]); for (let y = -35; y <= 35; y += 10) p.push([0, y]); return p; })();
export const rot = ([px, py]: number[], [cx, cy]: readonly number[], th: number) => {
    const f = -th * Math.PI / 180, c = Math.cos(f), s = Math.sin(f);
    return [cx + (px - cx) * c - (py - cy) * s, cy + (px - cx) * s + (py - cy) * c];
};
function vehicleSVG(mode: Mode) {
    if (mode === "stapler") return `
      <rect x="0" y="-35" width="120" height="70" rx="6" fill="#f97706"/>
      <rect x="0" y="-35" width="28" height="70" rx="6" fill="#c25c00"/>
      <rect x="44" y="-24" width="50" height="48" rx="4" fill="none" stroke="#212121" stroke-width="3"/>
      <rect x="56" y="-11" width="18" height="22" rx="3" fill="#212121"/>
      <rect x="118" y="-30" width="8" height="60" fill="#363636"/>
      <rect x="126" y="-21" width="46" height="6" rx="1" fill="#363636"/><rect x="126" y="15" width="46" height="6" rx="1" fill="#363636"/>
      <g fill="#111827"><rect x="12" y="-43" width="18" height="8" rx="2" transform="rotate(28 21 -39)"/><rect x="12" y="35" width="18" height="8" rx="2" transform="rotate(28 21 39)"/>
      <rect x="84" y="-44" width="22" height="9" rx="2"/><rect x="84" y="35" width="22" height="9" rx="2"/></g>`;
    return `
      <rect x="0" y="-35" width="120" height="70" rx="16" fill="#9ca3af"/>
      <rect x="34" y="-27" width="52" height="54" rx="8" fill="#6b7280"/>
      <g fill="#111827"><rect x="12" y="-43" width="18" height="8" rx="2"/><rect x="12" y="35" width="18" height="8" rx="2"/>
      <rect x="86" y="-43" width="18" height="8" rx="2" transform="rotate(-28 95 -39)"/><rect x="86" y="35" width="18" height="8" rx="2" transform="rotate(-28 95 39)"/></g>`;
}
export const PEDS: Record<string, [number, number]> = { A: [45, 68], B: [150, 78], C: [215, -4] };
export function pedSVG(id: string, [x, y]: [number, number], state: "" | "hit" | "safe") {
    const col = state === "hit" ? "#dc2626" : state === "safe" ? "#16a34a" : "#111827";
    return `<g transform="translate(${OX + x} ${OY + y})"><ellipse rx="12" ry="7" fill="#fff" stroke="${col}" stroke-width="2"/><circle r="4.5" fill="${col}"/>
      <text x="0" y="${y > 0 ? 24 : -14}" text-anchor="middle" font-family="Inter" font-size="13" font-weight="700" fill="${col}">${id}</text></g>`;
}
export type Trace = number[][] & { front?: number[][] };
export function turnFrame(T: Tx, mode: Mode, th: number, trace: Trace, peds = "") {
    const [cx, cy] = ICR[mode];
    const tr = trace.map(p => `${OX + p[0]},${OY + p[1]}`).join(" ");
    const tf = (trace.front || []).map(p => `${OX + p[0]},${OY + p[1]}`).join(" ");
    return `<svg viewBox="0 64 360 236" role="img" aria-label="${esc(T(mode === "stapler" ? "Draufsicht: Gabelstapler biegt links ab" : "Draufsicht: Auto biegt links ab"))}">
      <rect y="64" width="360" height="236" fill="#f9fafb"/>
      <g transform="translate(${OX} ${OY})"><circle cx="${cx}" cy="${cy}" r="4" fill="#9ca3af"/><text x="${cx + 8}" y="${cy + 4}" font-family="Inter" font-size="11" fill="#9ca3af">${esc(T("Drehpunkt"))}</text></g>
      ${tf ? `<polyline points="${tf}" fill="none" stroke="#9ca3af" stroke-width="2" stroke-dasharray="4 4"/>` : ""}
      ${tr ? `<polyline points="${tr}" fill="none" stroke="#dc2626" stroke-width="2.5"/>` : ""}
      ${peds}
      <g transform="translate(${OX} ${OY}) rotate(${-th} ${cx} ${cy})">${vehicleSVG(mode)}</g>
    </svg>`;
}
const reduce = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Animacja skrętu w elemencie; zwraca literę potrąconej osoby albo null. */
export function animateTurn(el: HTMLElement, T: Tx, mode: Mode, withPeds = false): Promise<string | null> {
    const [cx, cy] = ICR[mode], max = 70, dur = 2200;
    const trace: Trace = []; trace.front = [];
    let hit: string | null = null, t0: number | null = null;
    return new Promise(res => {
        const frame = (ts: number) => {
            if (!el.isConnected) return res(hit);
            if (t0 === null) t0 = ts;
            const k = reduce() ? 1 : Math.min(1, (ts - t0) / dur);
            const th = max * (1 - Math.pow(1 - k, 2));
            trace.push(rot([0, 35], [cx, cy], th));
            trace.front!.push(rot([120, 35], [cx, cy], th));
            if (withPeds && hit === null) {
                for (const id of Object.keys(PEDS)) {
                    const p = PEDS[id];
                    if (OUTLINE.some(o => { const q = rot(o, [cx, cy], th); return Math.hypot(q[0] - p[0], q[1] - p[1]) < 13; })) { hit = id; break; }
                }
            }
            const peds = withPeds ? Object.keys(PEDS).map(id => pedSVG(id, PEDS[id], hit ? (hit === id ? "hit" : "safe") : "")).join("") : "";
            el.innerHTML = turnFrame(T, mode, th, trace, peds);
            if (hit) return res(hit);
            if (k < 1) requestAnimationFrame(frame); else res(hit);
        };
        requestAnimationFrame(frame);
    });
}

/* ───────── huśtawka i diagram udźwigu (przykładowy wózek 2500 kg przy 500 mm, 450 mm oś–widły) ───────── */
export const A_MM = 450, QN = 2500, MN = QN * (A_MM + 500), MS = MN * 1.3;
export const qzul = (c: number) => Math.min(QN, MN / (A_MM + c));
export type LeverState = "ok" | "warn" | "tip";
export const leverState = (kg: number, c: number): LeverState => { const M = kg * (A_MM + c); return M > MS ? "tip" : M > MN ? "warn" : "ok"; };
export function leverSVG(T: Tx, num: (n: number) => string, kg: number, c: number, state: LeverState, prev: LeverState) {
    const S = 1 / 15, gx = 170, gy = 200;
    const fork = gx + A_MM * S, lc = fork + c * S, bw = 2 * c * S, bh = 30 + kg / 3000 * 55;
    const col = state === "tip" ? "#dc2626" : state === "warn" ? "#d97706" : "#16a34a";
    const cls = state === "tip" ? (prev === "tip" ? "tipped" : "tipping") : "";
    const style = `transform-origin:${gx}px ${gy}px;transform-box:view-box;${state === "warn" ? "transform:rotate(2.5deg)" : ""}`;
    return `<svg viewBox="0 14 420 222" role="img" aria-label="${esc(T("Seitenansicht Stapler mit Last"))}">
      <rect y="14" width="420" height="222" fill="#f9fafb"/>
      <path d="M0 ${gy + 1}H420" stroke="#d1d5db" stroke-width="2"/>
      <g class="${cls}" style="${style}">
        <path d="M24 180V140Q24 128 36 126L70 120V90H150V180Z" fill="#f97706"/>
        <rect x="24" y="126" width="34" height="54" rx="4" fill="#c25c00"/>
        <path d="M92 90V40H146V90M86 40H150" stroke="#212121" stroke-width="4" fill="none"/>
        <rect x="${fork - 12}" y="24" width="9" height="${gy - 30}" fill="#363636"/>
        <rect x="${fork - 4}" y="${gy - 14}" width="${Math.max(bw, 60) + 6}" height="6" fill="#363636"/>
        <rect x="${fork}" y="${gy - 14 - bh}" width="${bw}" height="${bh}" rx="3" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
        <text x="${fork + bw / 2}" y="${gy - 14 - bh / 2 - 4}" text-anchor="middle" font-family="Inter" font-size="12" font-weight="700" fill="#78350f">${num(kg)} kg</text>
        <circle cx="${lc}" cy="${gy - 14 - bh / 2 + 10}" r="4.5" fill="${col}"/>
        <circle cx="62" cy="${gy - 16}" r="16" fill="#111827"/><circle cx="62" cy="${gy - 16}" r="6" fill="#6b7280"/>
        <circle cx="${gx}" cy="${gy - 20}" r="20" fill="#111827"/><circle cx="${gx}" cy="${gy - 20}" r="7" fill="#6b7280"/>
      </g>
      <g font-family="Inter" font-size="11" fill="#6b7280">
        <path d="M${gx} ${gy + 8}V${gy + 22}M${lc} ${gy + 8}V${gy + 22}M${gx} ${gy + 15}H${lc}" stroke="#6b7280" stroke-width="1"/>
        <text x="${lc + 6}" y="${gy + 19}">${esc(T("Hebelarm {n} mm", { n: num(A_MM + c) }))}</text>
        <path d="M${gx} ${gy}l-7 10h14z" fill="${col}"/>
        <text x="${gx}" y="${gy + 33}" text-anchor="middle" fill="${col}" font-weight="600">${esc(T("Kippkante"))}</text>
      </g>
    </svg>`;
}
export function capacityChart(T: Tx, num: (n: number) => string, point: [number, number] | null) {
    const W = 330, H = 200, x0 = 46, y0 = 18, w = W - x0 - 22, h = H - y0 - 34;
    const X = (c: number) => x0 + (c - 400) / 800 * w, Y = (q: number) => y0 + h - q / 3000 * h;
    const pts: string[] = []; for (let c = 400; c <= 1200; c += 20) pts.push(`${X(c)},${Y(qzul(c))}`);
    let s = `<rect width="${W}" height="${H}" fill="#fff"/>`;
    [0, 1000, 2000, 3000].forEach(q => s += `<line x1="${x0}" x2="${x0 + w}" y1="${Y(q)}" y2="${Y(q)}" stroke="#f3f4f6"/><text x="${x0 - 6}" y="${Y(q) + 4}" text-anchor="end" font-size="10.5" fill="#9ca3af" font-family="Inter">${num(q)}</text>`);
    [400, 600, 800, 1000, 1200].forEach(c => s += `<text x="${X(c)}" y="${y0 + h + 16}" text-anchor="middle" font-size="10.5" fill="#9ca3af" font-family="Inter">${c}</text>`);
    s += `<text x="${x0 + w}" y="${H - 2}" text-anchor="end" font-size="10.5" fill="#6b7280" font-family="Inter">${esc(T("Lastschwerpunkt c in mm"))}</text>`;
    s += `<text x="${x0}" y="${y0 - 4}" font-size="10.5" fill="#6b7280" font-family="Inter">${esc(T("kg zulässig"))}</text>`;
    s += `<polygon points="${X(400)},${Y(0)} ${pts.join(" ")} ${X(1200)},${Y(0)}" fill="#f0fdf4"/>`;
    s += `<polyline points="${pts.join(" ")}" fill="none" stroke="#16a34a" stroke-width="2.5"/>`;
    s += `<circle cx="${X(500)}" cy="${Y(2500)}" r="3.5" fill="#16a34a"/><text x="${X(500) + 6}" y="${Y(2500) - 7}" font-size="10.5" fill="#16a34a" font-family="Inter">${esc(T("{q} kg bei 500 mm", { q: num(2500) }))}</text>`;
    if (point) {
        const ok = point[1] <= qzul(point[0]);
        s += `<line x1="${X(point[0])}" x2="${X(point[0])}" y1="${Y(0)}" y2="${Y(point[1])}" stroke="#9ca3af" stroke-dasharray="3 3"/>`;
        s += `<circle cx="${X(point[0])}" cy="${Y(qzul(point[0]))}" r="4" fill="#16a34a"/>`;
        s += `<circle cx="${X(point[0])}" cy="${Y(point[1])}" r="6" fill="${ok ? "#16a34a" : "#dc2626"}"/>`;
        s += `<text x="${X(point[0]) + 10}" y="${Y(point[1]) - 6}" font-size="11" font-weight="600" fill="${ok ? "#16a34a" : "#dc2626"}" font-family="Inter">${esc(T("deine Palette"))}</text>`;
    }
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T("Lastschwerpunktdiagramm des Beispielstaplers"))}">${s}</svg>`;
}
/* ───────── pozycja jazdy ───────── */
export function posSVG(T: Tx, hcm: number, tilt: "fwd" | "up" | "back") {
    const gy = 200, mx = 214, h = Math.min(hcm, 200) * .62;
    const deg = tilt === "fwd" ? 4 : tilt === "back" ? -5 : 0;
    return `<svg viewBox="0 10 400 220" role="img" aria-label="${esc(T("Seitenansicht: Hubhöhe und Neigung"))}">
      <rect y="10" width="400" height="220" fill="#f9fafb"/>
      <path d="M0 ${gy + 1}H400" stroke="#d1d5db" stroke-width="2"/>
      <path d="M40 180V140Q40 128 52 126L86 120V90H166V180Z" fill="#f97706"/>
      <rect x="40" y="126" width="34" height="54" rx="4" fill="#c25c00"/>
      <path d="M108 90V40H162V90M102 40H166" stroke="#212121" stroke-width="4" fill="none"/>
      <circle cx="78" cy="${gy - 16}" r="16" fill="#111827"/><circle cx="78" cy="${gy - 16}" r="6" fill="#6b7280"/>
      <circle cx="186" cy="${gy - 20}" r="20" fill="#111827"/><circle cx="186" cy="${gy - 20}" r="7" fill="#6b7280"/>
      <g transform="rotate(${deg} ${mx} ${gy - 6})">
        <rect x="${mx - 4}" y="20" width="9" height="${gy - 26}" fill="#363636"/>
        <g transform="translate(0 ${-h})">
          <rect x="${mx + 4}" y="${gy - 60}" width="7" height="56" fill="#212121"/>
          <rect x="${mx + 4}" y="${gy - 9}" width="96" height="6" fill="#212121"/>
          <rect x="${mx + 14}" y="${gy - 19}" width="80" height="10" fill="#a07a4c"/>
          <rect x="${mx + 18}" y="${gy - 69}" width="72" height="50" rx="3" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
        </g>
      </g>
    </svg>`;
}

/* ───────── 1.2: kontrola, rampa, odstawianie ───────── */
const truckSide = (load = true) => `
    <path d="M0 -20V-60Q0 -72 12 -74L46 -80V-110H126V-20Z" fill="#f97706"/>
    <rect x="0" y="-74" width="34" height="54" rx="4" fill="#c25c00"/>
    <path d="M68 -110V-160H122V-110M62 -160H126" stroke="#212121" stroke-width="4" fill="none"/>
    <circle cx="38" cy="-16" r="16" fill="#111827"/><circle cx="38" cy="-16" r="6" fill="#6b7280"/>
    <circle cx="146" cy="-20" r="20" fill="#111827"/><circle cx="146" cy="-20" r="7" fill="#6b7280"/>
    <rect x="170" y="-180" width="9" height="174" fill="#363636"/>
    <rect x="178" y="-12" width="80" height="6" fill="#212121"/>
    ${load ? '<rect x="184" y="-62" width="70" height="50" rx="3" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>' : ""}`;

/** Pozycje punktów kontroli na rysunku (kolejność jak w danych kroku). */
export const CHECK_POS: Record<string, { p: [number, number]; lx: number; ly: number; anchor?: string }> = {
    gabel: { p: [300, 192], lx: 300, ly: 172 },
    kette: { p: [226, 80], lx: 242, ly: 84, anchor: "start" },
    hydr: { p: [199, 128], lx: 236, ly: 132, anchor: "start" },
    reifen: { p: [78, 184], lx: 78, ly: 222 },
    bremse: { p: [140, 150], lx: 120, ly: 154, anchor: "end" },
    licht: { p: [134, 40], lx: 134, ly: 26 },
};
export function checkSVG(T: Tx, points: { id: string; label: string; bad?: boolean }[], seen: Record<string, boolean>, cur: string | null) {
    const gy = 200;
    const marks = points.filter(c => CHECK_POS[c.id]).map(c => {
        const pos = CHECK_POS[c.id], st = seen[c.id], on = cur === c.id;
        const fill = st ? (c.bad ? "#f59e0b" : "#111827") : "#fff";
        const inner = st ? (c.bad ? `<text y="4.5" text-anchor="middle" font-family="Inter" font-size="13" font-weight="700" fill="#fff">!</text>` : `<path d="M-4 0l3 3 5-6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`) : "";
        return `<g data-k="${c.id}" style="cursor:pointer">
        ${on ? `<circle cx="${pos.p[0]}" cy="${pos.p[1]}" r="16" fill="none" stroke="#f97706" stroke-width="2"/>` : ""}
        <g transform="translate(${pos.p[0]} ${pos.p[1]})"><circle r="10" fill="${fill}" stroke="#111827" stroke-width="1.8"/>${inner}</g>
        <text x="${pos.lx}" y="${pos.ly}" text-anchor="${pos.anchor || "middle"}" font-family="Inter" font-size="11.5" font-weight="600" fill="#374151">${esc(c.label)}</text></g>`;
    }).join("");
    return `<svg viewBox="0 10 400 222" role="img" aria-label="${esc(T("Stapler mit Prüfpunkten"))}">
      <rect y="10" width="400" height="222" fill="#f9fafb"/>
      <path d="M0 ${gy + 1}H400" stroke="#d1d5db" stroke-width="2"/>
      <path d="M40 180V140Q40 128 52 126L86 120V90H166V180Z" fill="#f97706"/>
      <rect x="40" y="126" width="34" height="54" rx="4" fill="#c25c00"/>
      <path d="M108 90V40H162V90M102 40H166" stroke="#212121" stroke-width="4" fill="none"/>
      <circle cx="78" cy="${gy - 16}" r="16" fill="#111827"/><circle cx="78" cy="${gy - 16}" r="6" fill="#6b7280"/>
      <circle cx="186" cy="${gy - 20}" r="20" fill="#111827"/><circle cx="186" cy="${gy - 20}" r="7" fill="#6b7280"/>
      <rect x="210" y="20" width="9" height="${gy - 26}" fill="#363636"/>
      <path d="M223 30V150" stroke="#6b7280" stroke-width="2.5" stroke-dasharray="3 2"/>
      <path d="M168 168q20-6 30-40t12-40" stroke="#111827" stroke-width="2.5" fill="none"/>
      <rect x="218" y="134" width="7" height="60" fill="#212121"/>
      <rect x="218" y="${gy - 9}" width="96" height="6" fill="#212121"/>
      ${marks}
    </svg>`;
}
export const rampFacesRight = (cs: "up" | "down", d: "vor" | "rueck") => (cs === "up") === (d === "vor");
export function rampSVG(T: Tx, cs: "up" | "down", d: "vor" | "rueck" | null, checked: boolean) {
    const ang = Math.atan(100 / 400) * 180 / Math.PI;
    const f = d ? (rampFacesRight(cs, d) ? 1 : -1) : 1;
    const ok = d && rampFacesRight(cs, d);
    const arrow = cs === "up" ? "M-60 0H60m-10 -7l10 7-10 7" : "M60 0H-60m10 -7l-10 7 10 7";
    return `<svg viewBox="0 10 400 220" role="img" aria-label="${esc(T(cs === "up" ? "Stapler auf einer Rampe, Fahrt hinauf" : "Stapler auf einer Rampe, Fahrt hinunter"))}">
      <rect y="10" width="400" height="220" fill="#f9fafb"/>
      <polygon points="0,215 400,115 400,230 0,230" fill="#e5e7eb"/>
      <path d="M0 215L400 115" stroke="#9ca3af" stroke-width="2"/>
      <text x="392" y="104" text-anchor="end" font-family="Inter" font-size="12" font-weight="600" fill="#6b7280">${esc(T("oben"))}</text>
      <text x="8" y="204" font-family="Inter" font-size="12" font-weight="600" fill="#6b7280">${esc(T("unten"))}</text>
      <g transform="translate(200 165) rotate(${-ang})">
        <g transform="translate(0 -118)"><path d="${arrow}" stroke="#111827" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text y="-12" text-anchor="middle" font-family="Inter" font-size="11.5" fill="#374151">${esc(T("Fahrtrichtung"))}</text></g>
        ${d ? `<g transform="scale(${f * .55} .55) translate(-129 0)">${truckSide()}</g>` : `<text y="-40" text-anchor="middle" font-family="Inter" font-size="13" fill="#9ca3af">${esc(T("Wähle die Richtung"))}</text>`}
      </g>
      ${checked && d ? `<text x="16" y="32" font-family="Inter" font-size="13" font-weight="700" fill="${ok ? "#16a34a" : "#dc2626"}">${esc(T(ok ? "Last bergseitig" : "Last talseitig"))}</text>` : ""}
    </svg>`;
}
export interface ParkState { loc: "exit" | "area"; brake: "off" | "on"; fork: "up" | "down"; tilt: "flat" | "down"; motor: "on" | "off"; key: "in" | "out" }
export function parkSVG(T: Tx, p: ParkState) {
    const gy = 200, mx = 214, h = p.fork === "up" ? 46 : 0, deg = p.tilt === "down" ? 3 : 0;
    const bg = p.loc === "exit"
        ? `<rect x="292" y="58" width="76" height="142" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/><rect x="300" y="32" width="60" height="20" rx="2" fill="#16a34a"/>
         <text x="330" y="46" text-anchor="middle" font-family="Inter" font-size="10" font-weight="700" fill="#fff">${esc(T("Notausgang"))}</text>`
        : `<path d="M28 ${gy + 1}H392" stroke="#facc15" stroke-width="5" stroke-dasharray="14 10"/>
         <text x="392" y="${gy + 22}" text-anchor="end" font-family="Inter" font-size="11.5" font-weight="600" fill="#6b7280">${esc(T("Abstellfläche"))}</text>`;
    return `<svg viewBox="0 20 400 210" role="img" aria-label="${esc(T("Stapler beim Abstellen"))}">
      <rect y="20" width="400" height="210" fill="#f9fafb"/>${bg}
      <path d="M0 ${gy + 1}H400" stroke="#d1d5db" stroke-width="2"/>
      <path d="M40 180V140Q40 128 52 126L86 120V90H166V180Z" fill="#f97706"/>
      <rect x="40" y="126" width="34" height="54" rx="4" fill="#c25c00"/>
      <path d="M108 90V40H162V90M102 40H166" stroke="#212121" stroke-width="4" fill="none"/>
      <circle cx="78" cy="${gy - 16}" r="16" fill="#111827"/><circle cx="78" cy="${gy - 16}" r="6" fill="#6b7280"/>
      <circle cx="186" cy="${gy - 20}" r="20" fill="#111827"/><circle cx="186" cy="${gy - 20}" r="7" fill="#6b7280"/>
      ${p.motor === "on" ? '<path d="M30 132q-8-6 0-12t0-12M20 136q-8-6 0-12t0-12" stroke="#9ca3af" stroke-width="2" fill="none" stroke-linecap="round"/>' : ""}
      <g transform="rotate(${deg} ${mx} ${gy - 6})">
        <rect x="${mx - 4}" y="40" width="9" height="${gy - 46}" fill="#363636"/>
        <g transform="translate(0 ${-h})"><rect x="${mx + 4}" y="${gy - 60}" width="7" height="56" fill="#212121"/><rect x="${mx + 4}" y="${gy - 8}" width="74" height="6" fill="#212121"/></g>
      </g>
    </svg>`;
}

/* ───────── 1.5: Staplerschein z polami do dotknięcia ───────── */
export const LICENCE_POS: Record<string, [number, number]> = {
    photo: [96, 72], person: [296, 84], issuer: [296, 128], truck: [296, 162], levels: [288, 209], code: [306, 156],
};
export function licenceSVG(T: Tx, points: { id: string; label: string }[], seen: Record<string, boolean>, cur: string | null, photo: string) {
    const marks = points.filter(p => LICENCE_POS[p.id]).map(p => {
        const [x, y] = LICENCE_POS[p.id], st = seen[p.id], on = cur === p.id;
        return `<g data-k="${p.id}" style="cursor:pointer">${on ? `<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#f97706" stroke-width="2"/>` : ""}
          <circle cx="${x}" cy="${y}" r="9" fill="${st ? "#111827" : "#fff"}" stroke="#111827" stroke-width="1.8"/>
          ${st ? `<path d="M${x - 4} ${y}l3 3 5-6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ""}</g>`;
    }).join("");
    const line = (x: number, y: number, w: number, label: string, val: string) =>
        `<text x="${x}" y="${y}" font-family="Inter" font-size="8.5" fill="#9ca3af" letter-spacing=".6">${esc(label)}</text><text x="${x}" y="${y + 13}" font-family="Inter" font-size="11.5" font-weight="600" fill="#111827">${esc(val)}</text><path d="M${x} ${y + 18}h${w}" stroke="#f3f4f6"/>`;
    return `<svg viewBox="0 0 400 250" role="img" aria-label="${esc(T("Staplerschein mit Feldern"))}">
      <rect width="400" height="250" fill="#f9fafb"/>
      <rect x="14" y="14" width="372" height="222" rx="14" fill="#fff" stroke="#e5e7eb" stroke-width="1.5"/>
      <rect x="14" y="14" width="372" height="40" rx="14" fill="#fffbeb"/><rect x="14" y="40" width="372" height="14" fill="#fffbeb"/>
      <text x="30" y="39" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-size="19" font-weight="600" fill="#111827">STAPLERO</text>
      <text x="370" y="38" text-anchor="end" font-family="Inter" font-size="9.5" font-weight="600" fill="#b45309">Fahrausweis für Flurförderzeuge</text>
      <g transform="translate(30 70)"><rect width="64" height="82" rx="6" fill="#eef2f7"/><g transform="translate(0 9) scale(1)">${photo}</g></g>
      ${line(112, 76, 190, "NAME · GEBURTSDATUM", "Jonas Krämer · 12.04.1998")}
      ${line(112, 120, 190, "AUSBILDUNGSSTELLE · AUSBILDER", "Staplero Berlin · M. Weber")}
      ${line(112, 154, 190, "AUSBILDUNGSGERÄT · TRAGFÄHIGKEIT", "Gegengewichtsstapler · 2,5 t")}
      <g font-family="Inter" font-size="10" font-weight="600">
        <rect x="30" y="196" width="78" height="26" rx="6" fill="#dcfce7"/><text x="69" y="213" text-anchor="middle" fill="#15803d">Stufe 1 ✓</text>
        <rect x="114" y="196" width="78" height="26" rx="6" fill="#f3f4f6" stroke="#d1d5db" stroke-dasharray="3 2"/><text x="153" y="213" text-anchor="middle" fill="#6b7280">Stufe 2</text>
        <rect x="198" y="196" width="78" height="26" rx="6" fill="#f3f4f6" stroke="#d1d5db" stroke-dasharray="3 2"/><text x="237" y="213" text-anchor="middle" fill="#6b7280">Stufe 3</text>
      </g>
      <g transform="translate(310 158)"><rect width="58" height="58" rx="4" fill="#fff" stroke="#111827" stroke-width="1.5"/>
        ${[[6, 6], [36, 6], [6, 36]].map(([a, b]) => `<rect x="${a}" y="${b}" width="16" height="16" fill="#111827"/><rect x="${a + 4}" y="${b + 4}" width="8" height="8" fill="#fff"/><rect x="${a + 6}" y="${b + 6}" width="4" height="4" fill="#111827"/>`).join("")}
        <path d="M30 30h6v6h-6zM42 36h6v6h-6zM36 46h6v6h-6zM28 44h4v4h-4z" fill="#111827"/></g>
      <text x="339" y="230" text-anchor="middle" font-family="ui-monospace, monospace" font-size="8.5" fill="#6b7280">ST-9F3K-21</text>
      ${marks}
    </svg>`;
}
