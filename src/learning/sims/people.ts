import { PersonLook } from "../types";

// Ilustracje z demo: popiersie osoby, szkic wózka na start rozdziału, porównanie auto/wózek.

export function personSVG(l: PersonLook) {
    const hair = l.long
        ? `<path d="M19 30q-1-17 13-18 14 1 13 18v14h-5V27q-8 2-16-4v21h-5z" fill="${l.hair}"/>`
        : `<path d="M20 27q-1-14 12-15 13 1 12 15-3-7-12-7t-12 7z" fill="${l.hair}"/>`;
    const beard = l.beard ? `<path d="M23 31q1 9 9 10 8-1 9-10-4 4-9 4t-9-4z" fill="${l.hair}" opacity=".85"/>` : "";
    const vest = l.vest ? `<path d="M15 52h34M13 58h38" stroke="#e5e7eb" stroke-width="2.5"/>` : `<path d="M32 44v20" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`;
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#eef2f7"/>
      <path d="M8 64q2-20 24-21 22 1 24 21z" fill="${l.top}"/>${vest}
      <rect x="28" y="36" width="8" height="8" fill="${l.skin}"/>
      <circle cx="32" cy="28" r="11" fill="${l.skin}"/>${hair}${beard}</svg>`;
}

/** Szkic wózka rysowany kreską (jasne tło, zgodnie z zasadą: bez ciemnych kafelków w panelu). */
export const BLUEPRINT = `<svg viewBox="0 0 520 280" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect width="520" height="280" fill="#fffbeb"/>
    <path class="bp-draw" pathLength="1" stroke="#374151" stroke-width="2.5" d="M70 236V180Q70 162 88 158L120 152V116H262V236Z"/>
    <path class="bp-draw" pathLength="1" stroke="#374151" stroke-width="2.5" d="M150 116V40H252V116M138 40H262"/>
    <path class="bp-draw bp-d2" pathLength="1" stroke="#374151" stroke-width="2.5" d="M276 20V246M290 20V246M276 20H290"/>
    <path class="bp-draw bp-d2" pathLength="1" stroke="#f97706" stroke-width="3" d="M296 172V238H412"/>
    <path class="bp-draw bp-d3" pathLength="1" stroke="#f97706" stroke-width="2.5" d="M304 228H400V162H304Z"/>
    <circle class="bp-draw" pathLength="1" cx="118" cy="238" r="26" stroke="#374151" stroke-width="2.5"/>
    <circle class="bp-draw" pathLength="1" cx="226" cy="236" r="30" stroke="#374151" stroke-width="2.5"/>
    <g class="bp-fade"><circle cx="352" cy="195" r="6" fill="#f97706"/></g>
    <path class="bp-fade" stroke="#9ca3af" stroke-width="2" d="M20 266H500"/></svg>`;

export const CAR_SVG = `<svg viewBox="0 0 170 110" aria-hidden="true">
    <path d="M8 84V68q0-8 8-9l22-4 18-20q4-4 10-4h40q6 0 10 5l16 19 20 3q8 1 8 9v17z" fill="#6b7280"/>
    <path d="M62 37h28v20H45zM96 37h14q4 0 7 4l13 16H96z" fill="#dbeafe"/>
    <circle cx="40" cy="86" r="15" fill="#111827"/><circle cx="40" cy="86" r="6" fill="#9ca3af"/>
    <circle cx="132" cy="86" r="15" fill="#111827"/><circle cx="132" cy="86" r="6" fill="#9ca3af"/>
    <path d="M0 102H170" stroke="#d1d5db" stroke-width="2"/></svg>`;
export const FORKLIFT_SVG = `<svg viewBox="0 0 170 110" aria-hidden="true">
    <path d="M10 88V66q0-6 6-7l18-3V44h50v44z" fill="#f97706"/>
    <rect x="10" y="58" width="20" height="30" rx="3" fill="#c25c00"/>
    <path d="M44 44V14h36v30M40 14h44" stroke="#212121" stroke-width="3.5" fill="none"/>
    <rect x="92" y="6" width="6" height="94" fill="#363636"/>
    <rect x="98" y="92" width="58" height="4" fill="#363636"/>
    <rect x="104" y="62" width="46" height="30" rx="2" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
    <circle cx="30" cy="90" r="11" fill="#111827"/><circle cx="30" cy="90" r="4" fill="#9ca3af"/>
    <circle cx="80" cy="88" r="13" fill="#111827"/><circle cx="80" cy="88" r="5" fill="#9ca3af"/>
    <path d="M0 102H170" stroke="#d1d5db" stroke-width="2"/></svg>`;
export const CHEF: PersonLook = { skin: "#e8b48e", hair: "#4b3a2a", top: "#374151" };
export const DRIVER: PersonLook = { skin: "#d9a07a", hair: "#1f1a17", top: "#facc15", vest: true, beard: true };
