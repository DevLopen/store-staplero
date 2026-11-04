/**
 * Orte & Termine: miejsce → terminy (szkolenie, języki, wolne miejsca) → uczestnicy.
 * Te same dane i endpointy co dotąd (/locations, /admin/practical-courses, /products/admin).
 * Nowe tylko opcjonalne pola: termin.productIds (przy jakich szkoleniach jest w sklepie) i produkt.durationDays.
 * Termin bez productIds działa jak dawniej: widać go przy każdym produkcie tego miejsca.
 * Edycja w szerokim panelu z boku, nie w wąskich okienkach.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ParticipantsListDialog from "@/components/ParticipantsListDialog";
import { Ico } from "./AdminShell";
import "./admin-places.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const auth = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });
const LANGS: [string, string][] = [["de", "Deutsch"], ["en", "Englisch"], ["pl", "Polnisch"], ["uk", "Ukrainisch"], ["ru", "Russisch"], ["ro", "Rumänisch"]];
const LANG = Object.fromEntries(LANGS);
const P = {
    pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5",
    plus: "M12 5v14M5 12h14",
    cal: "M3.5 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM3.5 10h17M8 3v4M16 3v4",
    chev: "m9 6 6 6-6 6",
    x: "M6 6l12 12M18 6 6 18",
    gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6",
};

interface CDate { id: string; startDate: string; endDate: string; time: string; availableSpots: number; languages?: string[]; productIds?: string[]; _id?: string }
interface Place { _id: string; city: string; address: string; price: number; isActive: boolean; dates: CDate[] }
interface Prod { _id: string; title: { de?: string }; type: string; status: string; locationIds: string[]; durationDays?: number }
type Panel = { kind: "date"; placeId: string; dateId: string | null } | { kind: "place"; placeId: string | null } | null;

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (s: string, n: number) => { const d = new Date(`${s}T12:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmt = (s: string, o: Intl.DateTimeFormatOptions) => new Date(`${s}T12:00`).toLocaleDateString("de-DE", o);
const days = (d: CDate) => Math.round((+new Date(`${d.endDate || d.startDate}T12:00`) - +new Date(`${d.startDate}T12:00`)) / 864e5) + 1;
const short = (t?: string) => (t ?? "").replace(/^Staplerschein\s*/i, "") || "Schulung";

export default function AdminPlaces({ onChanged }: { onChanged?: () => void }) {
    const { toast } = useToast();
    const [places, setPlaces] = useState<Place[]>([]);
    const [prods, setProds] = useState<Prod[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [cur, setCur] = useState<string>(() => sessionStorage.getItem("adm-place") ?? "");
    const [when, setWhen] = useState<"next" | "past">("next");
    const [tf, setTf] = useState("");
    const [lf, setLf] = useState<string[]>([]);
    const [panel, setPanel] = useState<Panel>(null);

    const load = useCallback(async () => {
        try {
            const [pl, pr, wc] = await Promise.all([
                fetch(`${API}/locations/admin/all`, { headers: auth() }).then(r => (r.ok ? r.json() : Promise.reject(new Error("Orte konnten nicht geladen werden")))),
                fetch(`${API}/products/admin`, { headers: auth() }).then(r => r.json()).then(d => d.products ?? []).catch(() => []),
                fetch(`${API}/admin/practical-courses/locations-with-participants`, { headers: auth() }).then(r => r.json()).catch(() => null),
            ]);
            setPlaces(pl);
            setProds(pr.filter((p: Prod) => p.type === "normal"));
            const c: Record<string, number> = {};
            (Array.isArray(wc) ? wc : wc?.locations ?? []).forEach((l: any) => (l.dates ?? []).forEach((d: any) => { c[`${l._id}|${d.id}`] = d.participantsCount ?? 0; }));
            setCounts(c);
            setCur(c0 => (pl.some((p: Place) => p._id === c0) ? c0 : pl.find((p: Place) => p.isActive && !/^test/i.test(p.city))?._id ?? pl[0]?._id ?? ""));
        } catch (e: any) { toast({ title: "Fehler", description: e.message, variant: "destructive" }); }
        finally { setLoading(false); }
    }, [toast]);
    useEffect(() => { load(); }, [load]);
    useEffect(() => { try { sessionStorage.setItem("adm-place", cur); } catch { /* egal */ } }, [cur]);

    const place = places.find(p => p._id === cur);
    const shopProds = (pid: string) => prods.filter(p => p.locationIds?.includes(pid));
    const prodName = (id: string) => (id === "-" ? "Kein Produkt" : short(prods.find(p => p._id === id)?.title.de));
    // stały, delikatny kolor szkolenia (kolejność produktów), żeby od razu było widać, który termin do czego należy
    const TONES = ["blue", "violet", "teal", "green", "pink", "brown"];
    const toneOf = (id: string) => (id === "-" ? "none" : TONES[Math.max(0, prods.findIndex(p => p._id === id)) % TONES.length]);
    const people = (pid: string, d: CDate) => counts[`${pid}|${d.id}`] ?? 0;
    const upcoming = (p: Place) => p.dates.filter(d => (d.endDate || d.startDate) >= today());

    const list = useMemo(() => {
        if (!place) return [];
        return place.dates
            .filter(d => (when === "next" ? (d.endDate || d.startDate) >= today() : (d.endDate || d.startDate) < today()))
            .filter(d => !tf || (tf === "_none" ? !d.productIds?.length : d.productIds?.includes(tf)))
            .filter(d => !lf.length || (d.languages ?? []).some(l => lf.includes(l)))
            .sort((a, b) => (when === "next" ? a.startDate.localeCompare(b.startDate) : b.startDate.localeCompare(a.startDate)));
    }, [place, when, tf, lf]);
    const months = useMemo(() => {
        const m: [string, CDate[]][] = [];
        list.forEach(d => { const k = fmt(d.startDate, { month: "long", year: "numeric" }); const e = m.find(x => x[0] === k); if (e) e[1].push(d); else m.push([k, [d]]); });
        return m;
    }, [list]);

    /** Zapis jednego terminu: świeży stan miejsca z serwera, podmiana tylko tego terminu, PUT (jak dotychczasowy panel). */
    const saveDates = async (placeId: string, fn: (dates: CDate[]) => CDate[]) => {
        const fresh: Place[] = await fetch(`${API}/locations/admin/all`, { headers: auth() }).then(r => r.json());
        const loc = fresh.find(p => p._id === placeId);
        if (!loc) throw new Error("Ort nicht gefunden");
        const res = await fetch(`${API}/locations/${placeId}`, { method: "PUT", headers: auth(), body: JSON.stringify({ dates: fn(loc.dates) }) });
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.errors?.join(" ") || b.message || "Speichern fehlgeschlagen"); }
        await load(); onChanged?.();
    };

    if (loading) return <p className="ap-muted">Lädt …</p>;

    return <div className="ap">
        <div className="ap-places" role="group" aria-label="Ort wählen">
            {places.map(p => <button key={p._id} type="button" className={`ap-place ${p.isActive ? "" : "off"}`} aria-pressed={p._id === cur} onClick={() => { setCur(p._id); setTf(""); setLf([]); }}>
                <span className="adm-tile t-graphite"><Ico d={P.pin} /></span>
                <span><b>{p.city}</b><small>{p.isActive ? `${upcoming(p).length} kommende Termine` : "nicht buchbar"}</small></span>
            </button>)}
            <button type="button" className="ap-place add" onClick={() => setPanel({ kind: "place", placeId: null })}><span className="adm-tile"><Ico d={P.plus} /></span>Neuer Ort</button>
        </div>

        {place && <>
            <section className="ap-card ap-head">
                <span className="adm-tile t-orange ap-big"><Ico d={P.pin} /></span>
                <div>
                    <h2>{place.city}</h2>
                    <div className="ap-facts">
                        <span>{place.address}</span>
                        <span><b>{upcoming(place).length}</b> kommende Termine</span>
                        <span><b>{upcoming(place).reduce((n, d) => n + d.availableSpots, 0)}</b> freie Plätze</span>
                        <span>Im Shop: {shopProds(place._id).length
                            ? <b>{shopProds(place._id).map(p => short(p.title.de)).join(", ")}</b>
                            : <b className="ap-warn">in keinem Produkt</b>}</span>
                    </div>
                </div>
                <div className="ap-acts">
                    <span className={`ap-st ${place.isActive ? "ok" : "none"}`}>{place.isActive ? "Buchbar" : "Nicht buchbar"}</span>
                    <button type="button" className="ap-btn o" onClick={() => setPanel({ kind: "place", placeId: place._id })}><Ico d={P.gear} />Ort bearbeiten</button>
                    <button type="button" className="ap-btn p" onClick={() => setPanel({ kind: "date", placeId: place._id, dateId: null })}><Ico d={P.plus} />Termin</button>
                </div>
            </section>

            <div className="ap-bar">
                <div className="ap-seg">
                    {[["", "Alle Schulungen"], ...shopProds(place._id).map(p => [p._id, short(p.title.de)]), ...(place.dates.some(d => !d.productIds?.length) && shopProds(place._id).length ? [["_none", "Ohne Zuordnung"]] : [])].map(([k, l]) =>
                        <button key={k} type="button" aria-pressed={tf === k} onClick={() => setTf(k)}>{l}</button>)}
                </div>
                <div className="ap-seg">
                    <button type="button" aria-pressed={when === "next"} onClick={() => setWhen("next")}>Kommende</button>
                    <button type="button" aria-pressed={when === "past"} onClick={() => setWhen("past")}>Vergangene</button>
                </div>
                <span className="ap-sp" />
                <div className="ap-langs">{LANGS.filter(([c]) => place.dates.some(d => d.languages?.includes(c))).map(([c, n]) =>
                    <button key={c} type="button" className="ap-lchip" aria-pressed={lf.includes(c)} onClick={() => setLf(x => (x.includes(c) ? x.filter(y => y !== c) : [...x, c]))}><span className="ap-lc">{c.toUpperCase()}</span>{n}</button>)}
                </div>
            </div>

            {!months.length ? <section className="ap-card ap-empty">
                <span className="adm-tile t-graphite ap-big"><Ico d={P.cal} /></span>
                <b>{place.dates.length ? "Keine Termine für diese Auswahl" : `Noch keine Termine in ${place.city}`}</b>
                <span>{place.dates.length ? "Ändern Sie den Filter oder legen Sie einen Termin an." : "Legen Sie den ersten Termin an. Schulung, Sprache und freie Plätze wählen Sie direkt dabei."}</span>
                <button type="button" className="ap-btn p" onClick={() => setPanel({ kind: "date", placeId: place._id, dateId: null })}><Ico d={P.plus} />Termin in {place.city}</button>
            </section> : months.map(([m, arr]) => <div key={m}>
                <p className="ap-month">{m}</p>
                <section className="ap-card">{arr.map(d => {
                    const n = people(place._id, d), multi = (d.endDate || d.startDate) !== d.startDate;
                    const sel = panel?.kind === "date" && panel.dateId === d.id;
                    return <button key={d.id} type="button" className="ap-row" aria-pressed={sel} onClick={() => setPanel({ kind: "date", placeId: place._id, dateId: d.id })}>
                        <span className="ap-dtile"><small>{fmt(d.startDate, { month: "short" }).replace(".", "")}</small><b>{fmt(d.startDate, { day: "2-digit" })}</b><em>{fmt(d.startDate, { weekday: "short" })}</em></span>
                        <span className="ap-t">
                            <b>{multi ? `${fmt(d.startDate, { weekday: "short", day: "numeric", month: "short" })} – ${fmt(d.endDate, { weekday: "short", day: "numeric", month: "short" })}` : fmt(d.startDate, { weekday: "long", day: "numeric", month: "long" })}</b>
                            <span className="ap-meta">{d.productIds?.length ? d.productIds.map(id => <span key={id} className={`ap-trc tone-${toneOf(id)}`}>{prodName(id)}</span>) : <span className="ap-trc tone-all">Alle Schulungen</span>}<span className="ap-dot">·</span>{d.time} · {days(d)} {days(d) === 1 ? "Tag" : "Tage"} · {n} Teilnehmer</span>
                            <span className="ap-langline">{d.languages?.length ? d.languages.map(l => <span key={l} className="ap-lt"><span className="ap-lc">{l.toUpperCase()}</span>{LANG[l]}</span>) : <span className="ap-free warn">Sprache fehlt</span>}</span>
                        </span>
                        <span className={`ap-free ${d.availableSpots === 0 ? "bad" : d.availableSpots <= 3 ? "warn" : ""}`}>{d.availableSpots === 0 ? "Ausgebucht" : <><b>{d.availableSpots}</b> frei</>}</span>
                        <Ico d={P.chev} className="ic ap-chev" />
                    </button>;
                })}</section>
            </div>)}
        </>}

        {panel && <div className="ap-scrim" onClick={() => setPanel(null)} />}
        {panel?.kind === "date" && <DatePanel key={`${panel.placeId}|${panel.dateId}`} places={places} prods={prods} placeId={panel.placeId} dateId={panel.dateId} peopleCount={(pid, d) => people(pid, d)}
            onClose={() => setPanel(null)} saveDates={saveDates} toast={toast} onParticipantsChanged={() => { load(); onChanged?.(); }} />}
        {panel?.kind === "place" && <PlacePanel key={String(panel.placeId)} place={places.find(p => p._id === panel.placeId) ?? null} prods={prods} onClose={() => setPanel(null)} toast={toast}
            onSaved={async id => { await load(); if (id) setCur(id); onChanged?.(); setPanel(null); }} />}
    </div>;
}

function DatePanel({ places, prods, placeId, dateId, peopleCount, onClose, saveDates, toast, onParticipantsChanged }: {
    places: Place[]; prods: Prod[]; placeId: string; dateId: string | null; peopleCount: (pid: string, d: CDate) => number;
    onClose: () => void; saveDates: (placeId: string, fn: (d: CDate[]) => CDate[]) => Promise<void>; toast: any; onParticipantsChanged: () => void;
}) {
    const place = places.find(p => p._id === placeId)!;
    const d0 = dateId ? place.dates.find(d => d.id === dateId) : undefined;
    const shop = prods.filter(p => p.locationIds?.includes(placeId));
    const [f, setF] = useState(() => ({
        startDate: d0?.startDate ?? "", endDate: d0?.endDate ?? "", time: d0?.time ?? "08:00 - 16:00",
        availableSpots: String(d0?.availableSpots ?? 10), languages: d0?.languages ?? ["de"],
        // istniejący termin bez przypisania zostaje bez przypisania (jak dotąd); nowy termin podpowiada jedyne szkolenie miejsca
        productIds: d0 ? (d0.productIds ?? []).filter(x => x !== "-") : (shop.length === 1 ? [shop[0]._id] : []),
    }));
    const [busy, setBusy] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const n = d0 ? peopleCount(placeId, d0) : 0;
    const dur = f.productIds.length === 1 ? prods.find(p => p._id === f.productIds[0])?.durationDays : undefined;
    const setStart = (s: string) => setF(x => ({ ...x, startDate: s, endDate: dur && s ? addDays(s, dur - 1) : x.endDate && x.endDate >= s ? x.endDate : s }));
    const toggleProd = (id: string) => setF(x => {
        const productIds = x.productIds.includes(id) ? x.productIds.filter(y => y !== id) : [...x.productIds, id];
        const dd = productIds.length === 1 ? prods.find(p => p._id === productIds[0])?.durationDays : undefined;
        return { ...x, productIds, endDate: dd && x.startDate ? addDays(x.startDate, dd - 1) : x.endDate };
    });
    const save = async () => {
        if (!f.startDate) return toast({ title: "Bitte ein Startdatum wählen", variant: "destructive" });
        if (f.endDate && f.endDate < f.startDate) return toast({ title: "Das Enddatum liegt vor dem Start", variant: "destructive" });
        if (!f.languages.length) return toast({ title: "Bitte mindestens eine Sprache wählen", variant: "destructive" });
        setBusy(true);
        try {
            const spots = Math.max(0, parseInt(f.availableSpots) || 0);
            const productIds = f.productIds.length ? f.productIds : d0?.productIds?.includes("-") ? ["-"] : [];
            const vals = { startDate: f.startDate, endDate: f.endDate || f.startDate, time: f.time, availableSpots: spots, languages: f.languages, productIds };
            await saveDates(placeId, dates => (d0 ? dates.map(d => (d.id === d0.id ? { ...d, ...vals } : d)) : [...dates, { id: `d${Date.now()}`, ...vals }]));
            toast({ title: d0 ? "Termin gespeichert" : "Termin angelegt" });
            onClose();
        } catch (e: any) { toast({ title: "Fehler", description: e.message, variant: "destructive" }); }
        finally { setBusy(false); }
    };
    const del = async () => {
        setBusy(true);
        try { await saveDates(placeId, dates => dates.filter(d => d.id !== d0!.id)); toast({ title: "Termin gelöscht" }); onClose(); }
        catch (e: any) { toast({ title: "Fehler", description: e.message, variant: "destructive" }); }
        finally { setBusy(false); }
    };

    return <aside className="ap-panel" aria-label={d0 ? "Termin bearbeiten" : "Neuer Termin"}>
        <header className="ap-ph">
            {d0 ? <span className="ap-dtile"><small>{fmt(d0.startDate, { month: "short" }).replace(".", "")}</small><b>{fmt(d0.startDate, { day: "2-digit" })}</b><em>{fmt(d0.startDate, { weekday: "short" })}</em></span>
                : <span className="adm-tile t-graphite ap-big"><Ico d={P.cal} /></span>}
            <div><small>{place.city}{d0 ? ` · ${d0.time}` : ""}</small><h2>{d0 ? fmt(d0.startDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Neuer Termin"}</h2></div>
            <button type="button" className="ap-x" aria-label="Schließen" onClick={onClose}><Ico d={P.x} /></button>
        </header>
        <div className="ap-pb">
            <div className="ap-cols">
                <section className="ap-grp">
                    <h3>Termin</h3>
                    <div className="ap-box ap-form">
                        <div className="ap-fl"><span>Schulung im Shop</span>
                            {shop.length ? <div className="ap-chips">{shop.map(p => <button key={p._id} type="button" className={`tone-${["blue", "violet", "teal", "green", "pink", "brown"][Math.max(0, prods.findIndex(x => x._id === p._id)) % 6]}`} aria-pressed={f.productIds.includes(p._id)} onClick={() => toggleProd(p._id)}>{short(p.title.de)}{p.durationDays ? <em>{p.durationDays} Tage</em> : null}</button>)}</div>
                                : <p className="ap-hint ap-warn">Dieser Ort ist noch in keinem Produkt. Fügen Sie ihn unter „Ort bearbeiten“ einem Produkt hinzu.</p>}
                            <small className="ap-hint">{f.productIds.length ? "Der Termin erscheint nur bei den gewählten Schulungen." : d0?.productIds?.includes("-") ? "Der Termin ist derzeit in keinem Produkt und erscheint nicht im Shop." : "Ohne Auswahl erscheint der Termin bei allen Schulungen dieses Ortes (wie bisher)."}</small>
                        </div>
                        <div className="ap-two">
                            <label className="ap-fl"><span>Von</span><input type="date" value={f.startDate} onChange={e => setStart(e.target.value)} /></label>
                            <label className="ap-fl"><span>Bis</span><input type="date" value={f.endDate} min={f.startDate} onChange={e => setF(x => ({ ...x, endDate: e.target.value }))} />{dur ? <small className="ap-hint">aus der Dauer ({dur} Tage)</small> : null}</label>
                        </div>
                        <div className="ap-two">
                            <label className="ap-fl"><span>Uhrzeit</span><input value={f.time} onChange={e => setF(x => ({ ...x, time: e.target.value }))} placeholder="08:00 - 16:00" /></label>
                            <label className="ap-fl"><span>Freie Plätze</span><input type="number" min={0} value={f.availableSpots} onChange={e => setF(x => ({ ...x, availableSpots: e.target.value }))} /><small className="ap-hint">wird bei jeder Buchung um 1 kleiner</small></label>
                        </div>
                        <div className="ap-fl"><span>Sprache des Termins</span>
                            <div className="ap-langs">{LANGS.map(([c, nm]) => <button key={c} type="button" className="ap-lchip" aria-pressed={f.languages.includes(c)} onClick={() => setF(x => ({ ...x, languages: x.languages.includes(c) ? x.languages.filter(y => y !== c) : [...x.languages, c] }))}><span className="ap-lc">{c.toUpperCase()}</span>{nm}</button>)}</div>
                        </div>
                    </div>
                    {d0 && <div className="ap-danger">{confirmDel
                        ? (n ? <span>Dieser Termin hat {n} Teilnehmer. Bitte zuerst umbuchen oder entfernen.</span>
                            : <><span>Termin wirklich löschen?</span><button type="button" className="ap-btn x" disabled={busy} onClick={del}>Ja, löschen</button><button type="button" className="ap-btn g" onClick={() => setConfirmDel(false)}>Abbrechen</button></>)
                        : <button type="button" className="ap-btn x" onClick={() => setConfirmDel(true)}>Termin löschen</button>}</div>}
                </section>
                {d0 && <section className="ap-grp ap-people">
                    <h3>Teilnehmer</h3>
                    <div className="ap-box ap-pl">
                        <ParticipantsListDialog embedded open locationId={placeId} dateId={d0.id} locationName={place.city}
                            dateInfo={`${fmt(d0.startDate, { day: "numeric", month: "numeric", year: "numeric" })} • ${d0.time}`} onClose={onClose} onChanged={onParticipantsChanged} />
                    </div>
                </section>}
            </div>
        </div>
        <footer className="ap-pf"><button type="button" className="ap-btn o" onClick={onClose}>Abbrechen</button><button type="button" className="ap-btn p" disabled={busy} onClick={save}>{busy ? "Speichert …" : d0 ? "Termin speichern" : "Termin anlegen"}</button></footer>
    </aside>;
}

function PlacePanel({ place, prods, onClose, onSaved, toast }: { place: Place | null; prods: Prod[]; onClose: () => void; onSaved: (id?: string) => void; toast: any }) {
    const [f, setF] = useState(() => ({ city: place?.city ?? "", address: place?.address ?? "", price: String(place?.price ?? 299), isActive: place?.isActive ?? true }));
    const [inShop, setInShop] = useState<string[]>(() => (place ? prods.filter(p => p.locationIds?.includes(place._id)).map(p => p._id) : []));
    const [busy, setBusy] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const save = async () => {
        if (f.city.trim().length < 2 || f.address.trim().length < 5) return toast({ title: "Bitte Stadt und vollständige Adresse angeben", variant: "destructive" });
        setBusy(true);
        try {
            const body = { city: f.city.trim(), address: f.address.trim(), price: Number(f.price) || 0, isActive: f.isActive };
            const res = await fetch(`${API}/locations${place ? `/${place._id}` : ""}`, { method: place ? "PUT" : "POST", headers: auth(), body: JSON.stringify(place ? body : { ...body, dates: [] }) });
            const saved = await res.json();
            if (!res.ok) throw new Error(saved.errors?.join(" ") || saved.message || "Speichern fehlgeschlagen");
            const id = saved._id as string;
            // Zuordnung zu Produkten: nur geänderte Produkte, nur das Feld locationIds
            for (const p of prods) {
                const has = p.locationIds?.includes(id), want = inShop.includes(p._id);
                if (has === want) continue;
                const locationIds = want ? [...(p.locationIds ?? []), id] : (p.locationIds ?? []).filter(x => x !== id);
                const r = await fetch(`${API}/products/admin/${p._id}`, { method: "PUT", headers: auth(), body: JSON.stringify({ locationIds }) });
                if (!r.ok) throw new Error(`Produkt „${short(p.title.de)}“ konnte nicht aktualisiert werden`);
            }
            toast({ title: place ? "Ort gespeichert" : `${body.city} angelegt` });
            onSaved(id);
        } catch (e: any) { toast({ title: "Fehler", description: e.message, variant: "destructive" }); }
        finally { setBusy(false); }
    };
    const del = async () => {
        setBusy(true);
        try {
            const r = await fetch(`${API}/locations/${place!._id}`, { method: "DELETE", headers: auth() });
            if (!r.ok) throw new Error("Löschen fehlgeschlagen");
            toast({ title: "Ort gelöscht" }); onSaved();
        } catch (e: any) { toast({ title: "Fehler", description: e.message, variant: "destructive" }); }
        finally { setBusy(false); }
    };
    return <aside className="ap-panel narrow" aria-label={place ? "Ort bearbeiten" : "Neuer Ort"}>
        <header className="ap-ph"><span className="adm-tile t-orange ap-big"><Ico d={P.pin} /></span><div><small>{place ? "Ort bearbeiten" : "Neuer Ort"}</small><h2>{place ? place.city : "Ort anlegen"}</h2></div>
            <button type="button" className="ap-x" aria-label="Schließen" onClick={onClose}><Ico d={P.x} /></button></header>
        <div className="ap-pb">
            <section className="ap-grp"><h3>Ort</h3><div className="ap-box ap-form">
                <label className="ap-fl"><span>Stadt</span><input value={f.city} onChange={e => setF(x => ({ ...x, city: e.target.value }))} placeholder="z. B. München" /></label>
                <label className="ap-fl"><span>Adresse</span><input value={f.address} onChange={e => setF(x => ({ ...x, address: e.target.value }))} placeholder="Straße Nr., PLZ Stadt" /></label>
                <label className="ap-fl"><span>Preis (€)</span><input type="number" min={0} step="0.01" value={f.price} onChange={e => setF(x => ({ ...x, price: e.target.value }))} /><small className="ap-hint">Gilt nur bei Buchung ohne Produkt. Im Shop zählt der Preis des Produkts.</small></label>
                <label className="ap-toggle"><span>Ort buchbar</span><button type="button" role="switch" aria-checked={f.isActive} className="ap-sw" onClick={() => setF(x => ({ ...x, isActive: !x.isActive }))} /></label>
            </div></section>
            <section className="ap-grp"><h3>In welchen Produkten wird dieser Ort angeboten?</h3><div className="ap-box ap-form">
                {prods.length ? prods.map(p => <label key={p._id} className="ap-toggle"><span>{p.title.de}{p.status !== "active" ? <em className="ap-hint"> · Entwurf</em> : null}</span>
                    <button type="button" role="switch" aria-checked={inShop.includes(p._id)} className="ap-sw" onClick={() => setInShop(x => (x.includes(p._id) ? x.filter(y => y !== p._id) : [...x, p._id]))} /></label>)
                    : <p className="ap-hint">Noch keine Präsenz-Produkte angelegt.</p>}
                <small className="ap-hint">Eingeschaltet = Kunden können diesen Ort bei diesem Produkt im Shop wählen (dasselbe wie „Verfügbare Standorte“ im Produkt). Welche Termine sie dort sehen, legen Sie im Produkt unter „Termine in diesem Produkt“ fest.</small>
            </div></section>
            {place && <div className="ap-danger">{confirmDel
                ? (place.dates.length ? <span>{place.city} hat noch {place.dates.length} Termine. Schalten Sie den Ort lieber auf „nicht buchbar“.</span>
                    : <><span>Ort wirklich löschen?</span><button type="button" className="ap-btn x" disabled={busy} onClick={del}>Ja, löschen</button><button type="button" className="ap-btn g" onClick={() => setConfirmDel(false)}>Abbrechen</button></>)
                : <button type="button" className="ap-btn x" onClick={() => setConfirmDel(true)}>Ort löschen</button>}</div>}
        </div>
        <footer className="ap-pf"><button type="button" className="ap-btn o" onClick={onClose}>Abbrechen</button><button type="button" className="ap-btn p" disabled={busy} onClick={save}>{busy ? "Speichert …" : place ? "Speichern" : "Ort anlegen"}</button></footer>
    </aside>;
}
