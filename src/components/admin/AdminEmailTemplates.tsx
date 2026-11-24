/**
 * Admin → E-Mail-Vorlagen: Texte der automatischen E-Mails in allen Sprachen bearbeiten,
 * Vorschau, Testversand. Welche Buchungsvorlage ein Produkt nutzt, wird beim Produkt gewählt.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Loader2, Mail, Plus, RotateCcw, Save, Send, Trash2, ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import "./admin-templates.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const authH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });
const req = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const r = await fetch(`${API}/admin/email-templates${path}`, { ...init, headers: { ...authH(), ...(init.headers || {}) } });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(body.message || `Fehler ${r.status}`);
    return body as T;
};

type Lang = "de" | "en" | "uk" | "pl";
const LANG_LABEL: Record<Lang, string> = { de: "Deutsch", en: "Englisch", uk: "Ukrainisch", pl: "Polnisch" };
const KIND_LABEL: Record<string, string> = {
    booking: "Buchung", "online-access": "Online-Zugang", "online-purchase": "Online-Kauf", "account-welcome": "Konto",
    "seat-invite": "Einladung", "seat-block": "Plätze", "seats-reminder": "Erinnerungen", "seat-invite-reminder": "Erinnerungen", common: "Gemeinsam",
};

interface TemplateRow {
    key: string; name: string; kind: string; description: string; languages: Lang[]; custom: boolean;
    editedLangs: Lang[]; updatedAt: string | null; updatedBy: string | null;
    products: Array<{ _id: string; title: string; status: string }>;
}
interface ItemField { key: string; label: string; type: "text" | "textarea" | "bool" | "number" }
interface FieldDef { key: string; label: string; type: "text" | "textarea" | "list"; hint?: string; optional?: boolean; langs?: Lang[]; item?: ItemField[] }
interface Detail {
    template: TemplateRow; fields: FieldDef[]; placeholders: Array<{ key: string; label: string }>;
    content: Record<string, Record<string, any>>; defaults: Record<string, Record<string, any>>; edited: Record<string, boolean>;
}

export default function AdminEmailTemplates() {
    const { toast } = useToast();
    const [list, setList] = useState<{ templates: TemplateRow[]; productsWithoutTemplate: Array<{ _id: string; title: string }> } | null>(null);
    const [sel, setSel] = useState<string>("");
    const [detail, setDetail] = useState<Detail | null>(null);
    const [lang, setLang] = useState<Lang>("de");
    const [draft, setDraft] = useState<Record<string, any>>({});
    const [dirty, setDirty] = useState(false);
    const [busy, setBusy] = useState(false);
    const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
    const [previewBusy, setPreviewBusy] = useState(false);
    const [testTo, setTestTo] = useState(() => localStorage.getItem("tplTestTo") || "");
    const [dupOpen, setDupOpen] = useState(false);
    const [dupName, setDupName] = useState("");
    const [confirmReset, setConfirmReset] = useState(false);

    const loadList = useCallback(() => req<typeof list>("").then((d) => { setList(d); return d; }), []);
    useEffect(() => {
        loadList().then((d) => { if (d && !sel && d.templates.length) setSel(d.templates[0].key); }).catch((e) => toast({ title: "Laden fehlgeschlagen", description: e.message, variant: "destructive" }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadDetail = useCallback(async (key: string, keepLang?: Lang) => {
        const d = await req<Detail>(`/${encodeURIComponent(key)}`);
        setDetail(d);
        const l = keepLang && d.template.languages.includes(keepLang) ? keepLang : d.template.languages[0];
        setLang(l);
        setDraft(structuredClone(d.content[l] || {}));
        setDirty(false);
    }, []);
    useEffect(() => { if (sel) loadDetail(sel, lang).catch((e) => toast({ title: "Laden fehlgeschlagen", description: e.message, variant: "destructive" })); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sel]);

    const switchLang = (l: Lang) => {
        if (!detail || l === lang) return;
        if (dirty && !window.confirm("Ungespeicherte Änderungen verwerfen?")) return;
        setLang(l);
        setDraft(structuredClone(detail.content[l] || {}));
        setDirty(false);
    };
    const pick = (key: string) => {
        if (key === sel) return;
        if (dirty && !window.confirm("Ungespeicherte Änderungen verwerfen?")) return;
        setSel(key);
    };

    // Vorschau mit dem aktuellen Entwurf (verzögert)
    const timer = useRef<number>();
    useEffect(() => {
        if (!detail) return;
        window.clearTimeout(timer.current);
        setPreviewBusy(true);
        timer.current = window.setTimeout(() => {
            req<{ subject: string; html: string }>(`/${encodeURIComponent(detail.template.key)}/preview`, { method: "POST", body: JSON.stringify({ lang, content: draft }) })
                .then(setPreview).catch(() => setPreview(null)).finally(() => setPreviewBusy(false));
        }, 450);
        return () => window.clearTimeout(timer.current);
    }, [detail, lang, draft]);

    const set = (k: string, v: any) => { setDraft((d) => ({ ...d, [k]: v })); setDirty(true); };

    const save = async () => {
        if (!detail) return;
        setBusy(true);
        try {
            await req(`/${encodeURIComponent(detail.template.key)}`, { method: "PUT", body: JSON.stringify({ lang, content: draft }) });
            await Promise.all([loadDetail(detail.template.key, lang), loadList()]);
            toast({ title: "Gespeichert", description: `${detail.template.name} · ${LANG_LABEL[lang]}. Gilt ab sofort für neue E-Mails.` });
        } catch (e: any) { toast({ title: "Speichern fehlgeschlagen", description: e.message, variant: "destructive" }); }
        finally { setBusy(false); }
    };
    const resetLang = async () => {
        if (!detail) return;
        setBusy(true);
        try {
            await req(`/${encodeURIComponent(detail.template.key)}/lang/${lang}`, { method: "DELETE" });
            await Promise.all([loadDetail(detail.template.key, lang), loadList()]);
            setConfirmReset(false);
            toast({ title: "Standardtexte wiederhergestellt", description: LANG_LABEL[lang] });
        } catch (e: any) { toast({ title: "Fehlgeschlagen", description: e.message, variant: "destructive" }); }
        finally { setBusy(false); }
    };
    const sendTest = async () => {
        if (!detail) return;
        setBusy(true);
        try {
            const r = await req<{ to: string; subject: string }>(`/${encodeURIComponent(detail.template.key)}/test`, { method: "POST", body: JSON.stringify({ lang, to: testTo.trim() || undefined, content: draft }) });
            if (testTo.trim()) localStorage.setItem("tplTestTo", testTo.trim());
            toast({ title: "Test-E-Mail gesendet", description: `${r.to}: ${r.subject}` });
        } catch (e: any) { toast({ title: "Versand fehlgeschlagen", description: e.message, variant: "destructive" }); }
        finally { setBusy(false); }
    };
    const duplicate = async () => {
        if (!detail || !dupName.trim()) return;
        setBusy(true);
        try {
            const r = await req<{ key: string }>(`/${encodeURIComponent(detail.template.key)}/duplicate`, { method: "POST", body: JSON.stringify({ name: dupName.trim() }) });
            await loadList();
            setDupOpen(false); setDupName(""); setDirty(false); setSel(r.key);
            toast({ title: "Vorlage kopiert", description: "Jetzt beim Produkt auswählen, damit sie verwendet wird." });
        } catch (e: any) { toast({ title: "Kopieren fehlgeschlagen", description: e.message, variant: "destructive" }); }
        finally { setBusy(false); }
    };
    const remove = async () => {
        if (!detail?.template.custom || !window.confirm(`Vorlage „${detail.template.name}“ löschen?`)) return;
        setBusy(true);
        try {
            await req(`/${encodeURIComponent(detail.template.key)}`, { method: "DELETE" });
            const d = await loadList();
            setDirty(false); setSel(d?.templates[0]?.key || "");
            toast({ title: "Vorlage gelöscht" });
        } catch (e: any) { toast({ title: "Löschen fehlgeschlagen", description: e.message, variant: "destructive" }); }
        finally { setBusy(false); }
    };

    const groups = useMemo(() => {
        // Erinnerungen (Käufer + Einladung) in einer Gruppe
        const order: Array<[string, string[]]> = [
            ["booking", ["booking"]], ["online-access", ["online-access"]], ["online-purchase", ["online-purchase"]],
            ["account-welcome", ["account-welcome"]], ["seat-invite", ["seat-invite"]], ["seat-block", ["seat-block"]],
            ["seats-reminder", ["seats-reminder", "seat-invite-reminder"]], ["common", ["common"]],
        ];
        const t = list?.templates ?? [];
        return order.map(([k, kinds]) => ({ kind: k, items: t.filter((x) => kinds.includes(x.kind)) })).filter((g) => g.items.length);
    }, [list]);

    if (!list) return <div className="tpl-empty"><Loader2 className="w-5 h-5 animate-spin" /> Lädt …</div>;
    const fields = (detail?.fields ?? []).filter((f) => !f.langs || f.langs.includes(lang));
    // Szczegóły z API nie mają listy produktów — bierzemy ją z listy szablonów
    const t = detail ? { ...detail.template, products: list.templates.find((x) => x.key === detail.template.key)?.products ?? [] } : undefined;

    return (
        <div className="tpl">
            <aside className="tpl-list">
                {groups.map((g) => (
                    <div key={g.kind} className="tpl-group">
                        <div className="tpl-group-h">{KIND_LABEL[g.kind]}</div>
                        {g.items.map((it) => (
                            <button key={it.key} type="button" className={`tpl-item${it.key === sel ? " on" : ""}`} onClick={() => pick(it.key)}>
                                <span className="n">{it.name}</span>
                                <span className="m">
                                    {it.languages.map((l) => <span key={l} className={`lg${it.editedLangs.includes(l) ? " ed" : ""}`} title={it.editedLangs.includes(l) ? "angepasst" : "Standardtext"}>{l.toUpperCase()}</span>)}
                                    {it.kind === "booking" && <span className="pr">{it.products.length ? `${it.products.length} Produkt${it.products.length > 1 ? "e" : ""}` : "nicht verwendet"}</span>}
                                </span>
                            </button>
                        ))}
                    </div>
                ))}
                {list.productsWithoutTemplate.length > 0 && (
                    <p className="tpl-warn">Ohne gewählte Vorlage (automatisch nach Kursdauer): {list.productsWithoutTemplate.map((p) => p.title).join(", ")}</p>
                )}
            </aside>

            {!detail || !t ? <div className="tpl-empty"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
                <section className="tpl-main">
                    <header className="tpl-head">
                        <div>
                            <h2>{t.name} {t.custom && <Badge variant="secondary">Eigene Vorlage</Badge>}</h2>
                            <p>{t.description}</p>
                            {t.kind === "booking" && <p className="tpl-used">{t.products.length ? <>Verwendet von: {t.products.map((p) => <span key={p._id} className="chip">{p.title}{p.status !== "active" ? " (Entwurf)" : ""}</span>)}</> : "Noch keinem Produkt zugewiesen. Auswahl unter Produkte → Bearbeiten → E-Mail-Vorlage."}</p>}
                            {t.kind === "online-purchase" && <p className="tpl-used">Geht in der Sprache der Bestellung raus. Die Vorschau zeigt einen Kauf mit drei Zugängen; die Texte „Käufer nimmt nicht teil“ gelten, wenn der Käufer selbst keinen Zugang nutzt.</p>}
                            {t.kind === "common" && <p className="tpl-used">Gilt für alle Buchungsbestätigungen. Die Vorschau zeigt die Vorlage „Stufe 1“ in der Variante „Käufer nimmt nicht teil“.</p>}
                            {t.kind === "seat-block" && <p className="tpl-used">Erscheint in Buchungsbestätigung, Online-Kauf, Online-Zugang und Erinnerung, sobald es mehrere Plätze gibt oder der Käufer nicht selbst teilnimmt. Die Vorschau zeigt eine Buchung ohne eigene Teilnahme.</p>}
                            {t.kind === "seats-reminder" && <p className="tpl-used">Höchstens zwei pro Bestellung: 2 Tage nach dem Kauf und 7 Tage vor Ablauf bzw. vor dem Kurstag, nur solange Plätze ohne E-Mail-Adresse sind.</p>}
                            {t.kind === "seat-invite-reminder" && <p className="tpl-used">Einmal pro Einladung, 5 Tage nach dem Versand, solange der Platz nicht aktiviert ist. Enthält immer einen neuen Link; der alte funktioniert danach nicht mehr.</p>}
                        </div>
                        <div className="tpl-head-act">
                            {t.kind === "booking" && <Button variant="outline" size="sm" onClick={() => { setDupName(`${t.name} (Kopie)`); setDupOpen(true); }}><Copy className="w-4 h-4 mr-1" />Kopieren</Button>}
                            {t.custom && <Button variant="outline" size="sm" onClick={remove} disabled={busy}><Trash2 className="w-4 h-4 mr-1" />Löschen</Button>}
                        </div>
                    </header>

                    <div className="tpl-langs" role="tablist">
                        {t.languages.map((l) => (
                            <button key={l} role="tab" aria-selected={l === lang} className={l === lang ? "on" : ""} onClick={() => switchLang(l)}>
                                {LANG_LABEL[l]}{detail.edited[l] && <span className="dot" title="angepasst" />}
                            </button>
                        ))}
                    </div>

                    <div className="tpl-body">
                        <div className="tpl-form">
                            <details className="tpl-help">
                                <summary>Variablen &amp; Formatierung</summary>
                                <p><code>**fett**</code> · <code>[Linktext](https://…)</code> · neue Zeile = Zeilenumbruch</p>
                                <div className="vars">{detail.placeholders.map((p) => <span key={p.key} title={p.label}><code>{`{${p.key}}`}</code> {p.label}</span>)}</div>
                            </details>

                            {fields.map((f) => (
                                <div key={f.key} className="tpl-field">
                                    <Label>{f.label}{f.optional && <span className="opt"> optional</span>}</Label>
                                    {f.hint && <p className="hint">{f.hint}</p>}
                                    {f.type === "text" && <Input value={draft[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />}
                                    {f.type === "textarea" && <Textarea rows={Math.min(8, Math.max(2, String(draft[f.key] ?? "").split("\n").length + 1))} value={draft[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />}
                                    {f.type === "list" && <ListEditor field={f} rows={Array.isArray(draft[f.key]) ? draft[f.key] : []} onChange={(rows) => set(f.key, rows)} />}
                                    {JSON.stringify(draft[f.key] ?? "") !== JSON.stringify(detail.defaults[lang]?.[f.key] ?? "") && (
                                        <button type="button" className="tpl-def" onClick={() => set(f.key, structuredClone(detail.defaults[lang]?.[f.key] ?? ""))}><RotateCcw className="w-3 h-3" /> Standard</button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="tpl-preview">
                            <div className="tpl-subject"><Mail className="w-4 h-4" /><span>{preview?.subject || "…"}</span>{previewBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}</div>
                            {preview ? <iframe title="Vorschau" srcDoc={preview.html} sandbox="" /> : <div className="tpl-empty">Keine Vorschau</div>}
                        </div>
                    </div>

                    <footer className="tpl-foot">
                        <span className="state">{dirty ? "Nicht gespeicherte Änderungen" : detail.edited[lang] ? "Angepasst" : "Standardtext"}</span>
                        <div className="test">
                            <Input placeholder="Test an (leer = Ihre Adresse)" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
                            <Button variant="outline" onClick={sendTest} disabled={busy}><Send className="w-4 h-4 mr-1" />Test senden</Button>
                        </div>
                        {!t.custom && detail.edited[lang] && (confirmReset
                            ? <span className="confirm">Alle Änderungen ({LANG_LABEL[lang]}) verwerfen? <Button size="sm" variant="destructive" onClick={resetLang} disabled={busy}>Ja</Button><Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>Nein</Button></span>
                            : <Button variant="ghost" onClick={() => setConfirmReset(true)} disabled={busy}><RotateCcw className="w-4 h-4 mr-1" />Standard</Button>)}
                        <Button onClick={save} disabled={busy || !dirty}>{busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}Speichern</Button>
                    </footer>
                </section>
            )}

            <Dialog open={dupOpen} onOpenChange={setDupOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Vorlage kopieren</DialogTitle>
                        <DialogDescription>Die Kopie übernimmt alle Texte in allen Sprachen. Danach beim gewünschten Produkt auswählen.</DialogDescription>
                    </DialogHeader>
                    <Label>Name</Label>
                    <Input value={dupName} onChange={(e) => setDupName(e.target.value)} autoFocus />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setDupOpen(false)}>Abbrechen</Button>
                        <Button onClick={duplicate} disabled={busy || !dupName.trim()}>Kopieren</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ListEditor({ field, rows, onChange }: { field: FieldDef; rows: any[]; onChange: (rows: any[]) => void }) {
    const items = field.item || [];
    const upd = (i: number, k: string, v: any) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
    const move = (i: number, d: number) => { const n = [...rows]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); };
    const blank = () => Object.fromEntries(items.map((it) => [it.key, it.type === "bool" ? false : it.type === "number" ? 1 : ""]));
    return (
        <div className="tpl-rows">
            {rows.map((r, i) => (
                <div key={i} className="tpl-row">
                    <div className="cells">
                        {items.map((it) => (
                            <label key={it.key} className={`cell t-${it.type}`}>
                                <span>{it.label}</span>
                                {it.type === "text" && <Input value={r[it.key] ?? ""} onChange={(e) => upd(i, it.key, e.target.value)} />}
                                {it.type === "textarea" && <Textarea rows={2} value={r[it.key] ?? ""} onChange={(e) => upd(i, it.key, e.target.value)} />}
                                {it.type === "number" && <Input type="number" min={1} max={30} value={r[it.key] ?? 1} onChange={(e) => upd(i, it.key, Number(e.target.value) || 1)} />}
                                {it.type === "bool" && <Switch checked={!!r[it.key]} onCheckedChange={(c) => upd(i, it.key, c)} />}
                            </label>
                        ))}
                    </div>
                    <div className="acts">
                        <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="nach oben"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button type="button" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="nach unten"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="entfernen"><X className="w-3.5 h-3.5" /></button>
                    </div>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, blank()])}><Plus className="w-4 h-4 mr-1" />Eintrag hinzufügen</Button>
        </div>
    );
}
