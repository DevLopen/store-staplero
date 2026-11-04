/**
 * Moduł 4 (stateczność): wykres udźwigu z widokiem wideł z góry, środek ciężkości w widoku z boku
 * i trójkąt stateczności w widoku z góry. Liczby to model poglądowy, opisany w lekcji jako przykład.
 */
import { esc, forklift } from "./forklift";

/* ───────── wykres udźwigu (przykład wg DGUV I 208-004, rozdz. 6.3.3) ───────── */
export const QN = 1500, A_AX = 400;                    // 1500 kg przy 500 mm, odstęp osi do grzbietu wideł (model)
export const qAllowed = (c: number) => Math.min(QN, QN * (A_AX + 500) / (A_AX + c));

export function diagramSVG(c: number, kg: number, labels: { load: string; dist: string; safe: string; over: string }, num: (n: number) => string) {
    const W = 520, H = 250, x0 = 64, y0 = 20, w = W - x0 - 20, h = H - y0 - 46;
    const X = (v: number) => x0 + (v - 300) / 1000 * w, Y = (v: number) => y0 + h - (v - 500) / 1200 * h;
    const s: string[] = [];
    // obszar bezpieczny pod krzywą
    let path = `M${X(300)} ${Y(500)}`;
    for (let v = 300; v <= 1300; v += 20) path += `L${X(v).toFixed(1)} ${Y(qAllowed(v)).toFixed(1)}`;
    s.push(`<path d="${path}L${X(1300)} ${Y(500)}Z" class="dg-safe"/>`);
    let line = "";
    for (let v = 300; v <= 1300; v += 20) line += `${line ? "L" : "M"}${X(v).toFixed(1)} ${Y(qAllowed(v)).toFixed(1)}`;
    s.push(`<path d="${line}" class="dg-curve"/>`);
    for (const v of [500, 700, 900, 1100]) s.push(`<path d="M${X(300)} ${Y(v + 200)}H${X(1300)}" class="dg-grid"/><text x="${x0 - 8}" y="${Y(v + 200) + 4}" class="dg-tx" text-anchor="end">${num(v + 200)}</text>`);
    for (const v of [400, 600, 800, 1000, 1200]) s.push(`<path d="M${X(v)} ${y0}V${y0 + h}" class="dg-grid"/><text x="${X(v)}" y="${y0 + h + 18}" class="dg-tx" text-anchor="middle">${num(v)}</text>`);
    s.push(`<path d="M${x0} ${y0}V${y0 + h}H${x0 + w}" class="dg-axis"/>`);
    s.push(`<text x="${x0 + w}" y="${H - 6}" class="dg-tx k" text-anchor="end">${esc(labels.dist)}</text><text x="${x0}" y="${y0 - 6}" class="dg-tx k">${esc(labels.load)}</text>`);
    s.push(`<text x="${X(420)}" y="${Y(650)}" class="dg-tx zone">${esc(labels.safe)}</text><text x="${X(1050)}" y="${Y(1550)}" class="dg-tx zone over">${esc(labels.over)}</text>`);
    const ok = kg <= qAllowed(c);
    s.push(`<path d="M${X(c)} ${y0 + h}V${Y(kg)}H${x0}" class="dg-guide"/><circle cx="${X(c)}" cy="${Y(kg)}" r="8" class="dg-pt ${ok ? "ok" : "no"}"/>`);
    return `<svg class="dg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(labels.load)} ${kg} kg, ${esc(labels.dist)} ${c} mm">${s.join("")}</svg>`;
}

/** Widok z góry: dwie widły i skrzynia ustawiona głębokością `depth` (mm) wzdłuż wideł. */
export function forksTopSVG(depth: number, across: number, label: string, cLabel: string) {
    const W = 520, H = 180, k = 0.085, fx = 70, cy = 90;
    const d = depth * k, a = across * k;
    const s: string[] = [];
    s.push(`<rect x="${fx - 18}" y="${cy - 70}" width="18" height="140" rx="2" class="tl"/>`); // gabelrücken
    s.push(`<path d="M${fx} ${cy - 30}h${1150 * k}M${fx} ${cy - 22}h${1150 * k}M${fx} ${cy + 22}h${1150 * k}M${fx} ${cy + 30}h${1150 * k}" class="tl fk"/>`);
    s.push(`<rect x="${fx}" y="${cy - a / 2}" width="${d}" height="${a}" rx="2" class="tbox"/>`);
    s.push(`<circle cx="${fx + d / 2}" cy="${cy}" r="5" class="tcog"/><path d="M${fx + d / 2 - 6} ${cy}h12M${fx + d / 2} ${cy - 6}v12" class="tcog-x"/>`);
    const yy = cy + Math.max(a / 2, 34) + 18;
    s.push(`<path d="M${fx} ${yy}H${fx + d / 2}" class="tdim"/><path d="M${fx} ${yy - 5}v10M${fx + d / 2} ${yy - 5}v10" class="tdim"/><text x="${fx + d / 4}" y="${yy - 7}" class="dg-tx" text-anchor="middle">${esc(cLabel)}</text>`);
    return `<svg class="ftop" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${s.join("")}</svg>`;
}

/* ───────── środek ciężkości w widoku z boku ───────── */
const M_TRUCK = 3200, M_LOAD = 1000, TRUCK_COG: [number, number] = [262, 318], KIPP_X = 370, G = 380;
export function cogState(lift: number, tilt: number, braking: boolean) {
    const f = forklift({ lift, tilt, mast: "duplex", load: "pallet" });
    const fk = f.anchors.forks;
    const load: [number, number] = [fk[0] - 16, fk[1] - 40];
    const cx = (M_TRUCK * TRUCK_COG[0] + M_LOAD * load[0]) / (M_TRUCK + M_LOAD), cy = (M_TRUCK * TRUCK_COG[1] + M_LOAD * load[1]) / (M_TRUCK + M_LOAD);
    const shift = braking ? 0.5 * (G - cy) : 0;
    const px = cx + shift;
    return { f, load, cog: [cx, cy] as [number, number], px, tips: px > KIPP_X, margin: (KIPP_X - px) * 10, height: (G - cy) * 10 };
}
export function cogOverlay(st: ReturnType<typeof cogState>, braking: boolean, labels: { truck: string; load: string; total: string; edge: string }) {
    const [cx, cy] = st.cog, s: string[] = [];
    const dot = (p: [number, number], cls: string) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="6" class="cg ${cls}"/><path d="M${p[0] - 6} ${p[1]}h12M${p[0]} ${p[1] - 6}v12" class="cg-x"/>`;
    s.push(dot(TRUCK_COG, "t"), dot(st.load, "l"));
    s.push(`<path d="M${TRUCK_COG[0]} ${TRUCK_COG[1]}L${st.load[0]} ${st.load[1]}" class="cg-link"/>`);
    s.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="9" class="cg total${st.tips ? " no" : ""}"/>`);
    s.push(`<path d="M${st.px.toFixed(1)} ${cy.toFixed(1)}V${G}" class="cg-drop${st.tips ? " no" : ""}"/>`);
    if (braking) s.push(`<path d="M${cx + 14} ${cy}h${Math.max(20, st.px - cx)}" class="cg-arrow"/><path d="M${cx + 14 + Math.max(20, st.px - cx)} ${cy}l-8 -5v10z" class="cg-head"/>`);
    s.push(`<path d="M${KIPP_X} ${G + 2}v14" class="cg-edge"/><text x="${KIPP_X}" y="${G + 30}" class="dimtx" text-anchor="middle"><tspan class="k">${esc(labels.edge)}</tspan></text>`);
    s.push(`<text x="${(cx).toFixed(1)}" y="${(cy - 16).toFixed(1)}" class="cg-tx" text-anchor="middle">${esc(labels.total)}</text>`);
    return s.join("");
}
export const COG_TIP_PIVOT: [number, number] = [KIPP_X, G];

/* ───────── trójkąt stateczności (widok z góry) ───────── */
export const TRI = { fl: [352, 92] as [number, number], fr: [352, 208] as [number, number], p: [150, 150] as [number, number] };
export const PX_M = 100;                                   // 100 px = 1 m w modelu
const halfWidth = (x: number) => (TRI.fr[1] - TRI.fl[1]) / 2 * (x - TRI.p[0]) / (TRI.fl[0] - TRI.p[0]);
export function triModel(loaded: boolean, raised: boolean, kmh: number, r: number) {
    const cogX = loaded ? 272 : 205, h = loaded ? (raised ? 1.6 : 0.7) : 0.8;
    const d = halfWidth(cogX) / PX_M;                      // m do krawędzi bocznej
    const v = kmh / 3.6, a = v * v / r;
    const lateral = a * h / 9.81;                          // przesunięcie rzutu środka ciężkości (m)
    return { cogX, d, lateral, ratio: lateral / d, tips: lateral > d, h };
}
export function triangleSVG(m: ReturnType<typeof triModel>, shown: number, labels: { pivot: string; edge: string; cf: string }, tipped: boolean, label: string) {
    const s: string[] = [], { fl, fr, p } = TRI, cy = 150;
    s.push(`<g class="tv${tipped ? " down" : ""}">`);
    // obrys wózka z góry
    s.push(`<path d="M118 112H360V188H118Q100 188 100 170V130Q100 112 118 112Z" class="tv-body"/><rect x="120" y="120" width="52" height="60" rx="6" class="tv-cw"/><rect x="226" y="124" width="64" height="52" rx="8" class="tv-seat"/>`);
    s.push(`<path d="M362 108v84" class="tv-mast"/><path d="M366 118h120M366 182h120" class="tv-fork"/>`);
    s.push(`<rect x="${fl[0] - 26}" y="${fl[1] - 12}" width="52" height="22" rx="5" class="tv-wh"/><rect x="${fr[0] - 26}" y="${fr[1] - 10}" width="52" height="22" rx="5" class="tv-wh"/>`);
    s.push(`<path d="M150 108V192" class="tv-axle"/><rect x="134" y="100" width="32" height="16" rx="4" class="tv-wh"/><rect x="134" y="184" width="32" height="16" rx="4" class="tv-wh"/><circle cx="${p[0]}" cy="${p[1]}" r="5" class="tv-piv"/>`);
    s.push(`</g>`);
    // trójkąt
    s.push(`<path d="M${fl[0]} ${fl[1]}L${fr[0]} ${fr[1]}L${p[0]} ${p[1]}Z" class="tri${m.tips && shown >= m.d - 1e-6 ? " no" : ""}"/>`);
    // środek ciężkości i jego przesunięcie
    const off = Math.min(shown, m.d * 1.6) * PX_M;
    if (off > 1) s.push(`<path d="M${m.cogX} ${cy}V${cy - off}" class="cf"/><path d="M${m.cogX} ${cy - off - 2}l-5 8h10z" class="cf-head"/><text x="${m.cogX + 10}" y="${cy - off / 2}" class="tv-tx">${esc(labels.cf)}</text>`);
    s.push(`<circle cx="${m.cogX}" cy="${cy - off}" r="8" class="cg total${m.tips && shown >= m.d - 1e-6 ? " no" : ""}"/>`);
    s.push(`<text x="${p[0]}" y="${p[1] + 66}" class="tv-tx k" text-anchor="middle">${esc(labels.pivot)}</text><path d="M${p[0]} ${p[1] + 8}V${p[1] + 50}" class="tv-lead"/>`);
    s.push(`<text x="${(fl[0] + p[0]) / 2 - 6}" y="${(fl[1] + p[1]) / 2 - 10}" class="tv-tx k" text-anchor="middle">${esc(labels.edge)}</text>`);
    return `<svg class="tvs" viewBox="70 40 440 236" role="img" aria-label="${esc(label)}">${s.join("")}</svg>`;
}

/* ───────── środek ciężkości dla modelu 3D (metry, przód = +z, krawędź wywrotu = oś przednia) ───────── */
export const COG3 = { mTruck: 3200, mLoad: 1000, truck: { y: 0.6, z: -0.35 }, edgeZ: 0.55, pivY: 0.28, pivZ: 0.86 };
/** lift w mm, tilt w stopniach (+ do przodu). Zwraca pozycje środków ciężkości i czy wózek przewróci się przy ostrym hamowaniu. */
export function cog3(liftMm: number, tilt: number, braking: boolean) {
    const a = tilt * Math.PI / 180, y0 = liftMm / 1000 - COG3.pivY + 0.53, z0 = 0.84;
    const load = { y: COG3.pivY + y0 * Math.cos(a) - z0 * Math.sin(a), z: COG3.pivZ + y0 * Math.sin(a) + z0 * Math.cos(a) };
    const M = COG3.mTruck + COG3.mLoad;
    const cog = { y: (COG3.mTruck * COG3.truck.y + COG3.mLoad * load.y) / M, z: (COG3.mTruck * COG3.truck.z + COG3.mLoad * load.z) / M };
    const shift = braking ? 0.5 * cog.y : 0;
    const pz = cog.z + shift;
    return { load, cog, shift, pz, tips: pz > COG3.edgeZ, margin: (COG3.edgeZ - pz) * 1000, height: cog.y * 1000 };
}
