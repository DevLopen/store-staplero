/**
 * Szablony maili: łączenie domyślnych tekstów (mailTemplateCatalog) ze zmianami z panelu,
 * wybór szablonu dla zamówienia i języka, formatowanie tekstów.
 */
import EmailTemplate from "../models/EmailTemplate";
import Product from "../models/Product";
import Location from "../models/Location";
import {
    BUILTIN_TEMPLATES, BOOKING_FALLBACK_BY_DAYS, Content, FIELDS, MailLang, MAIL_LANGS, TemplateDef, TemplateKind,
} from "./mailTemplateCatalog";
import { escapeHtml } from "./emailTemplates";

export interface ResolvedTemplate {
    key: string;
    name: string;
    kind: TemplateKind;
    description: string;
    languages: MailLang[];
    custom: boolean;
    baseKey?: string;
}

// Krótki cache — szablony czytane przy każdym mailu; zapis z panelu czyści cache
let cache: { at: number; docs: Map<string, any> } | null = null;
const CACHE_MS = 60_000;
export const clearTemplateCache = () => { cache = null; };
const loadDocs = async () => {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.docs;
    const docs = await EmailTemplate.find().lean();
    cache = { at: Date.now(), docs: new Map(docs.map((d: any) => [d.key, d])) };
    return cache.docs;
};

const builtin = (key: string) => BUILTIN_TEMPLATES.find((t) => t.key === key);

/** Wszystkie szablony (wbudowane + własne z bazy) */
export const listTemplates = async (): Promise<ResolvedTemplate[]> => {
    const docs = await loadDocs();
    const out: ResolvedTemplate[] = BUILTIN_TEMPLATES.map((t) => ({
        key: t.key, name: t.name, kind: t.kind, description: t.description, languages: t.languages, custom: false,
    }));
    for (const d of docs.values()) {
        if (!d.custom) continue;
        const base = builtin(d.baseKey);
        out.push({
            key: d.key, name: d.name || d.key, kind: d.kind, description: base ? `Kopie von „${base.name}“` : "",
            languages: base?.languages ?? MAIL_LANGS, custom: true, baseKey: d.baseKey,
        });
    }
    return out;
};

export const getTemplate = async (key: string): Promise<ResolvedTemplate | null> =>
    (await listTemplates()).find((t) => t.key === key) ?? null;

/** Domyślne teksty szablonu w języku (dla własnych: ze szablonu bazowego) */
export const defaultContent = (t: ResolvedTemplate, lang: MailLang): Content => {
    const def: TemplateDef | undefined = builtin(t.custom ? t.baseKey! : t.key);
    if (!def) return {};
    return structuredClone(def.defaults[lang] ?? def.defaults.de ?? {});
};

/** Zmiany z panelu w danym języku (albo null) */
export const overrideContent = async (key: string, lang: MailLang): Promise<Content | null> => {
    const d = (await loadDocs()).get(key);
    return d?.content?.[lang] ?? null;
};

/** Teksty do maila: domyślne + zmiany z panelu (pole po polu) */
export const resolveContent = async (key: string, lang: MailLang): Promise<Content> => {
    const t = await getTemplate(key);
    if (!t) throw new Error(`E-Mail-Vorlage ${key} nicht gefunden`);
    const l = t.languages.includes(lang) ? lang : t.languages.includes("en") && lang !== "de" ? "en" : "de";
    const over = await overrideContent(key, l);
    return { ...defaultContent(t, l), ...(over || {}) };
};

/** Język maila: język strony z zamówienia; dla terminów „auf Englisch” zamiast niemieckiego angielski */
export const pickLanguage = (orderLang: string | undefined | null, locationName = ""): MailLang => {
    const lang = (MAIL_LANGS as string[]).includes(String(orderLang)) ? (orderLang as MailLang) : null;
    const englishTerm = /englisch|english/i.test(locationName);
    if (englishTerm && (!lang || lang === "de")) return "en";
    return lang ?? "de";
};

/** Szablon potwierdzenia rezerwacji: z produktu (zamówienia albo terminu), inaczej wg liczby dni */
export const resolveBookingTemplateKey = async (o: {
    productId?: string | null; locationId?: string; dateId?: string; startDate?: string | Date; endDate?: string | Date;
}): Promise<string> => {
    let productId = o.productId || null;
    if (!productId && o.locationId && o.dateId) {
        try {
            const loc: any = await Location.findById(o.locationId).select("dates").lean();
            const date = loc?.dates?.find((d: any) => d.id === o.dateId);
            if (date?.productIds?.length === 1) productId = date.productIds[0];
        } catch { /* brak terminu = fallback */ }
    }
    if (productId && /^[a-f0-9]{24}$/i.test(productId)) {
        const p: any = await Product.findById(productId).select("emailTemplate").lean();
        if (p?.emailTemplate && (await getTemplate(p.emailTemplate))?.kind === "booking") return p.emailTemplate;
    }
    const start = o.startDate ? new Date(o.startDate) : null;
    const end = o.endDate ? new Date(o.endDate) : null;
    const days = start && end ? Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1 : 2;
    return BOOKING_FALLBACK_BY_DAYS(days);
};

/**
 * Tekst z panelu → HTML: escape, {zmienne}, **pogrubienie**, [tekst](link), nowa linia = <br>.
 * Zmienne też są escapowane. Nieznane zmienne zostają bez zmian (widać je w podglądzie).
 */
export const fmt = (text: unknown, vars: Record<string, string | number | undefined> = {}, opts: { linkColor?: string } = {}): string => {
    let s = escapeHtml(String(text ?? ""));
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? escapeHtml(String(vars[k])) : m));
    s = s.replace(/\[([^\]]+)\]\(((?:https?:|tel:|mailto:)[^)\s]+)\)/g, (_m, label, url) =>
        `<a href="${url}" style="color:${opts.linkColor || "#111111"};font-weight:700;">${label}</a>`);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return s.replace(/\r?\n/g, "<br>");
};
/** Jak fmt, ale bez HTML (temat, preheader) */
export const fmtPlain = (text: unknown, vars: Record<string, string | number | undefined> = {}): string =>
    String(text ?? "")
        .replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m))
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\s*\r?\n\s*/g, " ")
        .trim();

/** Czyści treść z panelu do znanych pól i typów (bez obcych kluczy) */
export const sanitizeContent = (kind: TemplateKind, input: any): Content => {
    const out: Content = {};
    for (const f of FIELDS[kind]) {
        const v = input?.[f.key];
        if (v === undefined) continue;
        if (f.type === "list") {
            if (!Array.isArray(v)) continue;
            out[f.key] = v.slice(0, 30).map((row: any) => {
                const r: Record<string, any> = {};
                for (const it of f.item || []) {
                    const x = row?.[it.key];
                    r[it.key] = it.type === "bool" ? !!x : it.type === "number" ? Math.max(1, Math.min(30, Number(x) || 1)) : String(x ?? "").slice(0, 2000);
                }
                return r;
            });
        } else {
            out[f.key] = String(v ?? "").slice(0, 4000);
        }
    }
    return out;
};
