/**
 * Zapis wyboru terminów z edytora produktu do miejsc (pole terminu `productIds`).
 * Zmienia tylko to, co dotyczy tego produktu; inne produkty przy tym samym miejscu zachowują swoje terminy:
 * - termin bez przypisania (widoczny przy wszystkich) odznaczony → przypisany do pozostałych produktów tego miejsca;
 * - termin przypisany do innych produktów zaznaczony → ten produkt jest dopisany;
 * - "-" oznacza termin, który nie należy do żadnego produktu (nie pokazuje się w sklepie).
 * Przed zapisem pobierany jest świeży stan miejsca, żeby nie nadpisać wolnych miejsc zmienionych przez rezerwacje.
 */
import type { Product } from "@/types/product.types";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const auth = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });
export const dateKey = (locId: string, dateId: string) => `${locId}|${dateId}`;

export async function applyDateSelection(productId: string, sel: Record<string, boolean>, products: Product[]) {
    const byLoc: Record<string, Record<string, boolean>> = {};
    Object.entries(sel).forEach(([k, v]) => { const [l, d] = k.split("|"); (byLoc[l] = byLoc[l] || {})[d] = v; });
    if (!Object.keys(byLoc).length) return;
    const fresh: any[] = await fetch(`${API}/locations/admin/all`, { headers: auth() }).then(r => r.json());
    for (const [locId, wants] of Object.entries(byLoc)) {
        const loc = fresh.find(l => l._id === locId);
        if (!loc) continue;
        // pozostałe produkty z tym miejscem (bez bieżącego)
        const others = products.filter(p => p.type === "normal" && p._id !== productId && p.locationIds?.includes(locId)).map(p => p._id);
        let changed = false;
        const dates = loc.dates.map((d: any) => {
            if (!(d.id in wants)) return d;
            const ids: string[] = (d.productIds ?? []).filter((x: string) => x !== "__new__");
            const member = !ids.length || ids.includes(productId);
            const want = wants[d.id];
            if (want === member) return d;
            changed = true;
            if (want) return { ...d, productIds: [...ids.filter(x => x !== "-"), productId] };
            const rest = (ids.length ? ids.filter(x => x !== productId) : others).filter(x => x !== "-");
            return { ...d, productIds: rest.length ? rest : ["-"] };
        });
        if (!changed) continue;
        const r = await fetch(`${API}/locations/${locId}`, { method: "PUT", headers: auth(), body: JSON.stringify({ dates }) });
        if (!r.ok) throw new Error(`Termine in ${loc.city} konnten nicht gespeichert werden`);
    }
}
