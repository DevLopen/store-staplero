/**
 * Otoczka panelu admina w nowym stylu (szklany pasek boczny, pasek górny, tło z poświatą).
 * Sekcje są te same co zakładki dotychczasowego panelu; doszedł tylko Fragenkatalog (dodawanie testów).
 * Klasa `adm-theme` na <body> nadaje nowy wygląd także oknom dialogowym i listom rozwijanym (renderowanym poza panelem).
 */
import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./admin-theme.css";

export type AdminSection = "mails" | "kurse" | "products" | "courses" | "content" | "tests" | "fragen" | "locations" | "orders" | "users" | "certificates" | "participants" | "stats";

const I: Record<string, string> = {
    bag: "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2",
    box: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
    lib: "M4 4h3v16H4zM9.5 4h3v16h-3zM15 5.2l2.8-.9 4 15.2-2.8.8z",
    book: "M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5zM12 6v13.5",
    quiz: "M8 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 3h6v3H9zM8.5 13l2.5 2.5 4.5-5",
    cards: "M4 7h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM7 4h13a2 2 0 0 1 2 2v9M6.5 13.5h8M6.5 16.5h5",
    pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21c.8-4 4-6 8-6s7.2 2 8 6",
    people: "M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.7c2 .6 3.2 2.4 3.5 5.3",
    seal: "M12 15.5a6 6 0 1 0 0-12 6 6 0 0 0 0 12M9.5 9.6l1.8 1.8 3.3-3.4M8.6 14.5 7 22l5-2.6 5 2.6-1.6-7.5",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    menu: "M4 7h16M4 12h16M4 17h16",
    out: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3",
    mail: "M4 6h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1zM3.5 7l8.5 6.5L20.5 7",
    web: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
};
type NavItem = { id: AdminSection; label: string; icon: string; color: string };
const GROUPS: { title?: string; archive?: boolean; items: NavItem[] }[] = [
    { title: "Kommunikation", items: [
        { id: "mails", label: "E-Mails", icon: I.mail, color: "orange" },
    ] },
    { title: "Verkauf", items: [
        { id: "orders", label: "Bestellungen", icon: I.bag, color: "blue" },
        { id: "products", label: "Produkte", icon: I.box, color: "brown" },
    ] },
    { title: "Ausbildung", items: [
        { id: "locations", label: "Standorte & Termine", icon: I.pin, color: "red" },
        { id: "participants", label: "Teilnehmer", icon: I.people, color: "teal" },
        { id: "users", label: "Benutzer", icon: I.user, color: "indigo" },
        { id: "certificates", label: "Zertifikate", icon: I.seal, color: "amber" },
    ] },
    { title: "Inhalte", items: [
        { id: "kurse", label: "Kurse", icon: I.book, color: "indigo" },
        { id: "fragen", label: "Fragenkatalog", icon: I.cards, color: "orange" },
    ] },
    { items: [{ id: "stats", label: "Statistiken", icon: I.chart, color: "graphite" }] },
    // alter Kurs (vor dem Online-Kurs v2): bleibt erreichbar, aber eingeklappt
    { title: "Alter Kurs (Archiv)", archive: true, items: [
        { id: "courses", label: "Kurse (alt)", icon: I.lib, color: "graphite" },
        { id: "content", label: "Inhalte (alt)", icon: I.book, color: "graphite" },
        { id: "tests", label: "Tests (alt)", icon: I.quiz, color: "graphite" },
    ] },
];
export const SECTION_TITLES: Record<AdminSection, string> = Object.fromEntries(GROUPS.flatMap(g => g.items.map(i => [i.id, i.label]))) as Record<AdminSection, string>;
export const sectionHref = (id: AdminSection) => (id === "fragen" ? "/admin/fragen" : id === "kurse" ? "/admin/kurse" : `/admin#${id}`);
const OWN_PAGE: AdminSection[] = ["fragen", "kurse"];

export const Ico = ({ d, className = "ic" }: { d: string; className?: string }) =>
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;

export default function AdminShell({ active, onSelect, onLogout, children, actions }: {
    active: AdminSection; onSelect?: (s: AdminSection) => void; onLogout?: () => void; children: ReactNode; actions?: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [arch, setArch] = useState(() => ["courses", "content", "tests"].includes(active));
    const [unread, setUnread] = useState(0);
    useEffect(() => {
        const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const load = () => fetch(`${api}/inbox/stats`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            .then(r => (r.ok ? r.json() : null)).then(d => d && setUnread(d.unread || 0)).catch(() => {});
        load();
        const t = window.setInterval(load, 60000);
        return () => clearInterval(t);
    }, [active]);
    useEffect(() => {
        document.body.classList.add("adm-theme");
        return () => document.body.classList.remove("adm-theme");
    }, []);
    useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [active]);
    const logout = () => { if (onLogout) onLogout(); else { localStorage.removeItem("token"); window.location.href = "/login"; } };

    return <div className="adm">
        <aside className={`adm-side adm-glass ${open ? "on" : ""}`} aria-label="Bereiche">
            <Link to="/admin#orders" className="adm-brand"><span className="adm-brand-ic">S</span><div><b>Staplero</b><span>Verwaltung</span></div></Link>
            {GROUPS.map((g, gi) => <div key={gi} className={`adm-grp ${g.archive ? "arch" : ""}`}>
                {g.title && (g.archive
                    ? <button type="button" className="adm-grp-t adm-grp-btn" aria-expanded={arch} onClick={() => setArch(a => !a)}>{g.title}<span>{arch ? "−" : "+"}</span></button>
                    : <div className="adm-grp-t">{g.title}</div>)}
                {(!g.archive || arch) && g.items.map(it => {
                    const inner = <><span className={`adm-tile t-${it.color}`}><Ico d={it.icon} /></span>{it.label}{it.id === "mails" && unread > 0 && <span className="adm-badge" aria-label={`${unread} ungelesen`}>{unread}</span>}</>;
                    const cls = "adm-nav";
                    // sekcje starego panelu przełączają się w miejscu, Fragenkatalog ma własną stronę
                    return onSelect && !OWN_PAGE.includes(it.id)
                        ? <button key={it.id} type="button" className={cls} aria-current={active === it.id ? "page" : undefined} onClick={() => onSelect(it.id)}>{inner}</button>
                        : <Link key={it.id} to={sectionHref(it.id)} className={cls} aria-current={active === it.id ? "page" : undefined}>{inner}</Link>;
                })}
            </div>)}
            <div className="adm-sp" />
            <a href="/" className="adm-nav"><span className="adm-tile t-graphite"><Ico d={I.web} /></span>Zur Website</a>
            <button type="button" className="adm-nav" onClick={logout}><span className="adm-tile t-graphite"><Ico d={I.out} /></span>Abmelden</button>
        </aside>
        {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}
        <div className="adm-main">
            <header className="adm-top adm-glass">
                <button type="button" className="adm-tb adm-burger" aria-label="Menü" onClick={() => setOpen(o => !o)}><Ico d={I.menu} /></button>
                <h1 className="adm-title">{SECTION_TITLES[active]}</h1>
                <span className="adm-top-sp" />
                {actions}
            </header>
            <main className="adm-page">{children}</main>
        </div>
    </div>;
}
