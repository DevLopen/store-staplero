import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight, BadgeCheck, BadgePlus, Building2, CalendarCheck, Check, ChevronRight, Clock,
    Languages, Mail, MapPin, Phone, Send, Timer, Warehouse,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Flag, FlagCode } from "@/components/FlagIcons";
import { IconForklift } from "@/components/BrandIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { getRecaptchaToken, loadRecaptcha } from "@/lib/recaptcha";
import { CONTACT, FAQ, OG_IMAGE, PAGE_URL, SEO, buildJsonLd } from "@/seo/firmenschulung.seo";
import heroImage from "@/assets/bodzio.webp";
import warehouseImage from "@/assets/index-1.jpg";
import controlsImage from "@/assets/forklift-controls.jpg";
import trainingImage from "@/assets/sala.jpg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Inhalte (nur Deutsch) ────────────────────────────────────────────────────

const FACTS = [
    { Icon: Timer, value: "1 bis 3 Tage", label: "je nach Vorerfahrung, Standard: 2 Tage" },
    { Icon: Building2, value: "Ort nach Wahl", label: "bei Ihnen im Betrieb oder in unserer Schulungshalle in Berlin" },
    { Icon: Languages, value: "6 Sprachen", label: "Deutsch, Englisch, Polnisch, Ukrainisch, Russisch, Rumänisch" },
    { Icon: BadgeCheck, value: "DGUV 68 & 308-001", label: "bundesweit anerkannter Staplerschein" },
];

const SERVICES = [
    {
        Icon: IconForklift,
        title: "Staplerschein für Gabelstaplerfahrer",
        text: "Erstausbildung nach DGUV Vorschrift 68 und DGUV Grundsatz 308-001: Theorie mit schriftlicher Prüfung, Praxis mit Fahrprüfung.",
    },
    {
        Icon: BadgePlus,
        title: "Zusatzausbildung Flurförderzeuge",
        text: "Für weitere Gerätearten, z. B. Schubmaststapler oder Elektro-Ameise, abgestimmt auf Ihre Geräte und die Vorerfahrung Ihrer Mitarbeitenden.",
    },
    {
        Icon: CalendarCheck,
        title: "Jährliche Unterweisung",
        text: "Pflicht-Unterweisungen nach DGUV Vorschrift 1 für Ihre Belegschaft, auch als Inhouse-Variante direkt im Betrieb.",
    },
    {
        Icon: Languages,
        title: "Schulung in Ihrer Sprache",
        text: "Deutsch, Englisch, Polnisch, Ukrainisch, Russisch oder Rumänisch. Die Schulung findet vollständig in der gewünschten Sprache statt.",
    },
];

const STEPS = [
    { title: "Anfrage", text: "Sie nennen uns Mitarbeiterzahl, Ort, Geräteart und Vorerfahrung Ihrer Teilnehmenden." },
    { title: "Individuelles Angebot", text: "Wir planen Termin, Gruppengröße und Ablauf passend zu Ihrem Betrieb und erstellen Ihr Angebot." },
    { title: "Schulung am Ort Ihrer Wahl", text: "Bei Ihnen im Betrieb oder in unserer Schulungshalle in Berlin. Tag 1: Theorie mit schriftlicher Prüfung. Tag 2: Praxis mit Fahrprüfung." },
    { title: "Staplerschein", text: "Alle Teilnehmenden, die bestehen, erhalten den Staplerschein. Digital als PDF, für Apple Wallet und Google Wallet." },
];

const VARIANTS = [
    { days: "2 Tage", name: "Standard", text: "Gabelstapler: Tag 1 Theorie mit schriftlicher Prüfung, Tag 2 Praxis mit Fahrprüfung." },
    { days: "1 Tag", name: "Verkürzt", text: "Für Teilnehmende mit mindestens 6 Monaten Praxiserfahrung." },
    { days: "3 Tage", name: "Erweitert", text: "Z. B. bei Schubmaststaplern, mit mehr Zeit für Theorie und Fahrpraxis." },
];

const WE_BRING = [
    "Erfahrene Trainer",
    "Alle erforderlichen Schulungsunterlagen",
    "Theorieprüfung (schriftlich) und Fahrprüfung",
    "Staplerschein für alle, die bestehen",
];

const YOU_PROVIDE = [
    "Ruhiger Raum mit Tischen und Stühlen (Theorie)",
    "Geeigneter Übungsbereich, z. B. Lagerfläche oder Betriebshof",
    "Funktionsfähiger Gabelstapler",
    "Europaletten und idealerweise Gitterboxen",
];

const PARTICIPANTS_BRING = [
    "Gültiger Ausweis (Personalausweis oder Reisepass)",
    "Sicherheitsschuhe (Pflicht für den praktischen Teil)",
];

const LANGUAGES: { code: FlagCode; name: string }[] = [
    { code: "DE", name: "Deutsch" },
    { code: "EN", name: "English" },
    { code: "PL", name: "Polski" },
    { code: "UK", name: "Українська" },
    { code: "RU", name: "Русский" },
    { code: "RO", name: "Română" },
];

const BENEFITS = [
    "Individuelle Preisgestaltung je nach Mitarbeiteranzahl",
    "Schulung bei Ihnen im Betrieb (deutschlandweit) oder in unserer Schulungshalle in Berlin",
    "Flexible Terminplanung nach Ihren Bedürfnissen",
    "Jährliche Unterweisungen für Ihre gesamte Belegschaft",
    "Mehrsprachige Ausbildung in sechs Sprachen",
    "Persönlicher Ansprechpartner für Ihr Unternehmen",
];

const CheckList = ({ items, dark = false }: { items: string[]; dark?: boolean }) => (
    <ul className="space-y-3">
        {items.map((item) => (
            <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-primary text-[hsl(var(--on-primary))]">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className={dark ? "text-primary-foreground/85" : "text-foreground"}>{item}</span>
            </li>
        ))}
    </ul>
);

// ─── Seite ────────────────────────────────────────────────────────────────────

const FirmenschulungBerlin = () => {
    const { toast } = useToast();
    const jsonLd = useMemo(() => buildJsonLd(), []);

    const [form, setForm] = useState({
        name: "", company: "", email: "", phone: "",
        employees: "", equipment: "", venue: "Noch offen", location: "Berlin", message: "", website: "",
    });
    const [sending, setSending] = useState(false);
    const formLoadedAtRef = useRef(Date.now());

    useEffect(() => { loadRecaptcha(); }, []);

    const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            const recaptchaToken = await getRecaptchaToken("contact");

            // Der Kontakt-Endpoint kennt nur "message" — Zusatzangaben hängen wir als Block an.
            const details = [
                form.employees && `Anzahl Teilnehmende (zu schulen): ${form.employees}`,
                form.equipment && `Geräteart: ${form.equipment}`,
                form.venue && `Gewünschter Ort der Schulung: ${form.venue}`,
                form.location && `Stadt: ${form.location}`,
            ].filter(Boolean).join("\n");
            const message = [
                "[Anfrage Firmenschulung Berlin]",
                form.message.trim(),
                details && `\nAngaben zur Schulung:\n${details}`,
            ].filter(Boolean).join("\n");

            const response = await fetch(`${API_URL}/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    company: form.company,
                    message,
                    website: form.website,
                    formRenderedAt: formLoadedAtRef.current,
                    recaptchaToken,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Fehler");

            toast({ title: "Anfrage gesendet", description: "Vielen Dank! Wir melden uns schnellstmöglich mit Ihrem Angebot." });
            setForm({ name: "", company: "", email: "", phone: "", employees: "", equipment: "", venue: "Noch offen", location: "Berlin", message: "", website: "" });
            formLoadedAtRef.current = Date.now();
        } catch {
            toast({
                title: "Senden fehlgeschlagen",
                description: `Bitte versuchen Sie es erneut oder schreiben Sie uns an ${CONTACT.email}.`,
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Seo title={SEO.title} description={SEO.description} url={PAGE_URL} image={OG_IMAGE} jsonLd={jsonLd} />
            <Navbar />

            <main>
                {/* ── Hero ─────────────────────────────────────────────────── */}
                <section className="relative overflow-hidden bg-industrial pt-16">
                    <img
                        src={heroImage}
                        alt="Gabelstaplerfahrer bei der Firmenschulung im Lager"
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-industrial via-industrial/75 to-transparent" aria-hidden />

                    <div className="container relative mx-auto px-4 py-16 md:py-24 lg:py-28">
                        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-primary-foreground/70">
                            <Link to="/" className="hover:text-primary">Startseite</Link>
                            <ChevronRight className="h-4 w-4" aria-hidden />
                            <span className="text-primary-foreground" aria-current="page">Firmenschulung Berlin</span>
                        </nav>

                        <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-primary">
                            Für Unternehmen · Im Betrieb oder in unserer Halle
                        </span>
                        <h1 className="mb-6 max-w-4xl font-display text-5xl font-extrabold leading-[0.92] text-primary-foreground sm:text-6xl lg:text-8xl">
                            Staplerschein <span className="text-gradient">Firmenschulung</span> in Berlin
                        </h1>
                        <p className="mb-9 max-w-2xl text-lg text-primary-foreground/80 md:text-xl">
                            Wir schulen Ihre Mitarbeitenden bei Ihnen im Betrieb oder in unserer eigenen Schulungshalle
                            in Berlin, nach DGUV Vorschrift 68 und DGUV Grundsatz 308-001. Mehrsprachig, flexibel geplant und mit
                            bundesweit anerkanntem Staplerschein.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <a href="#anfrage">
                                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                                    Angebot anfordern <ArrowRight className="h-5 w-5" />
                                </Button>
                            </a>
                            <a href={`tel:${CONTACT.phones[0].href}`}>
                                <Button
                                    variant="outline"
                                    size="xl"
                                    className="w-full border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 sm:w-auto"
                                >
                                    <Phone className="h-5 w-5" /> {CONTACT.phones[0].display}
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* ── Fakten-Leiste ────────────────────────────────────────── */}
                <section aria-label="Auf einen Blick" className="border-b border-border bg-background">
                    <div className="container mx-auto px-4">
                        <ul className="grid grid-cols-2 lg:grid-cols-4">
                            {FACTS.map(({ Icon, value, label }, i) => (
                                <li
                                    key={value}
                                    className={`flex items-start gap-4 p-5 md:p-6 ${i % 2 === 1 ? "border-l border-border" : ""} ${i > 0 ? "lg:border-l lg:border-border" : ""} ${i >= 2 ? "border-t border-border lg:border-t-0" : ""}`}
                                >
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-[hsl(var(--on-primary))]">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="font-display text-xl font-bold leading-tight text-foreground md:text-2xl">{value}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* ── Einführung ───────────────────────────────────────────── */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-5 lg:gap-16">
                        <div className="lg:col-span-3">
                            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-primary">Zwei Wege zur Schulung</span>
                            <h2 className="mb-6 font-display text-4xl font-extrabold text-foreground md:text-6xl">
                                Gabelstaplerschulung für Firmen in Berlin
                            </h2>
                            <div className="space-y-4 text-lg text-muted-foreground">
                                <p>
                                    Sie möchten Mitarbeitende zum Staplerfahrer qualifizieren? Sie haben die Wahl: Wir schulen
                                    direkt bei Ihnen im Betrieb in Berlin, an Ihren Geräten und zu einem Zeitpunkt, der zu Ihrem
                                    Betriebsablauf passt. Oder Ihr Team trainiert in unserer eigenen Schulungshalle in Berlin.
                                </p>
                                <p>
                                    Die Ausbildung besteht aus einem Theorieteil mit schriftlicher Prüfung und einem Praxisteil
                                    mit Fahrprüfung. Unsere Trainer bringen alle erforderlichen Schulungsunterlagen mit.
                                    Ob einzelne Neueinsteiger oder ganze Schichtteams: Termin, Gruppengröße und Geräteart
                                    planen wir individuell mit Ihnen.
                                </p>
                            </div>
                            <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2">
                                {[
                                    { Icon: Building2, title: "Bei Ihnen im Betrieb", text: "Wir kommen in Ihr Lager, Ihre Produktionshalle oder auf Ihren Betriebshof. Ihr Team bleibt vor Ort und übt an Ihren eigenen Geräten." },
                                    { Icon: Warehouse, title: "In unserer Schulungshalle in Berlin", text: "Ihr Team trainiert in unserer eigenen Halle, an klassischen Frontstaplern und Schubmaststaplern (Hochregalstaplern). Sie müssen weder Raum noch Übungsbereich noch Stapler bereitstellen." },
                                ].map(({ Icon, title, text }) => (
                                    <div key={title} className="bg-background p-5 md:p-6">
                                        <span className="mb-4 flex h-11 w-11 items-center justify-center bg-primary text-[hsl(var(--on-primary))]">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
                                        <p className="text-sm text-muted-foreground">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <aside className="lg:col-span-2">
                            <div className="border border-border bg-secondary p-6 md:p-8">
                                <h3 className="mb-5 font-display text-2xl font-bold text-foreground">Auf einen Blick</h3>
                                <dl className="space-y-4 text-sm">
                                    {[
                                        ["Ort", "Bei Ihnen im Betrieb (Berlin, auf Wunsch deutschlandweit) oder in unserer Schulungshalle in Berlin"],
                                        ["Dauer", "1 bis 3 Tage, Standard: 2 Tage"],
                                        ["Sprachen", "Deutsch, Englisch, Polnisch, Ukrainisch, Russisch, Rumänisch"],
                                        ["Abschluss", "Staplerschein nach DGUV Vorschrift 68 / Grundsatz 308-001"],
                                        ["Preis", "Individuelles Angebot nach Teilnehmerzahl"],
                                    ].map(([dt, dd]) => (
                                        <div key={dt} className="grid grid-cols-3 gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
                                            <dt className="font-semibold text-foreground">{dt}</dt>
                                            <dd className="col-span-2 text-muted-foreground">{dd}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </aside>
                    </div>
                </section>

                {/* ── Leistungen ───────────────────────────────────────────── */}
                <section className="bg-secondary py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="mb-10 max-w-2xl md:mb-14">
                            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-primary">Leistungen</span>
                            <h2 className="font-display text-4xl font-extrabold text-foreground md:text-6xl">
                                Unsere Firmenschulungen im Überblick
                            </h2>
                        </div>
                        <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
                            {SERVICES.map(({ Icon, title, text }) => (
                                <article key={title} className="flex gap-5 bg-background p-6 md:p-8">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary text-[hsl(var(--on-primary))]">
                                        <Icon className="h-6 w-6" />
                                    </span>
                                    <div>
                                        <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
                                        <p className="text-muted-foreground">{text}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Ablauf ───────────────────────────────────────────────── */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="mb-10 max-w-2xl md:mb-14">
                            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-primary">Ablauf</span>
                            <h2 className="font-display text-4xl font-extrabold text-foreground md:text-6xl">
                                So läuft Ihre Firmenschulung ab
                            </h2>
                        </div>
                        <ol className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                            {STEPS.map(({ title, text }, i) => (
                                <li key={title} className="relative overflow-hidden bg-background p-6 md:p-8 min-h-[240px]">
                                    <span
                                        className="pointer-events-none absolute right-4 top-2 select-none font-display text-[8rem] font-extrabold leading-none text-foreground/[0.08]"
                                        aria-hidden
                                    >
                                        {i + 1}
                                    </span>
                                    <div className="relative">
                                        <h3 className="mb-3 text-2xl font-bold text-foreground">{title}</h3>
                                        <p className="text-muted-foreground">{text}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* ── Dauer & Varianten ────────────────────────────────────── */}
                <section className="bg-industrial py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="mb-10 max-w-2xl md:mb-14">
                            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-primary">Dauer & Varianten</span>
                            <h2 className="font-display text-4xl font-extrabold text-primary-foreground md:text-6xl">
                                Wie lange dauert die Staplerschulung?
                            </h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {VARIANTS.map(({ days, name, text }) => (
                                <div key={days} className="border border-primary-foreground/15 bg-primary-foreground/5 p-6 md:p-8">
                                    <p className="font-display text-6xl font-extrabold leading-none text-primary">{days}</p>
                                    <h3 className="mb-2 mt-4 flex items-center gap-2 text-xl font-bold text-primary-foreground">
                                        <Clock className="h-5 w-5 text-primary" aria-hidden /> {name}
                                    </h3>
                                    <p className="text-primary-foreground/75">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Wer bringt was mit ───────────────────────────────────── */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="mb-10 max-w-2xl md:mb-14">
                            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-primary">Vorbereitung</span>
                            <h2 className="font-display text-4xl font-extrabold text-foreground md:text-6xl">
                                Wer bringt was mit?
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Bei einer Schulung in unserer Schulungshalle in Berlin entfällt die Bereitstellung von Raum, Übungsbereich und Stapler. Wir schulen an klassischen Frontstaplern und Schubmaststaplern (Hochregalstaplern).
                            </p>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-3">
                            {[
                                { title: "Das bringt STAPLERO mit", items: WE_BRING },
                                { title: "Das stellen Sie im Betrieb bereit", items: YOU_PROVIDE },
                                { title: "Das bringen Teilnehmende mit", items: PARTICIPANTS_BRING },
                            ].map(({ title, items }) => (
                                <div key={title} className="border border-border p-6 md:p-8">
                                    <h3 className="mb-5 font-display text-2xl font-bold text-foreground">{title}</h3>
                                    <CheckList items={items} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Sprachen ─────────────────────────────────────────────── */}
                <section className="bg-secondary py-16 md:py-24">
                    <div className="container mx-auto grid items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
                        <div>
                            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-primary">Mehrsprachig</span>
                            <h2 className="mb-5 font-display text-4xl font-extrabold text-foreground md:text-6xl">
                                Schulung in Ihrer Sprache
                            </h2>
                            <p className="mb-6 text-lg text-muted-foreground">
                                Verständnis ist die Grundlage für sicheres Arbeiten. Deshalb führen wir die Schulung
                                vollständig in der Sprache Ihrer Mitarbeitenden durch. Für Schulungen in rumänischer Sprache
                                fällt ein Dolmetscherzuschlag von 179,99 € netto pro Tag an.
                            </p>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Verfügbare Sprachen
                            </p>
                            <ul className="grid max-w-xl grid-cols-3 gap-x-4 gap-y-3 border-t border-border pt-4">
                                {LANGUAGES.map((l) => (
                                    <li key={l.code} className="flex min-w-0 items-center gap-2 text-muted-foreground">
                                        <Flag code={l.code} />
                                        <span lang={l.code.toLowerCase()} className="truncate">{l.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <img src={trainingImage} alt="Theorieunterricht bei einer Staplerschulung" className="col-span-2 aspect-video w-full object-cover" loading="lazy" />
                            <img src={warehouseImage} alt="Lagerhalle für die praktische Staplerausbildung" className="aspect-square w-full object-cover" loading="lazy" />
                            <img src={controlsImage} alt="Bedienelemente eines Gabelstaplers" className="aspect-square w-full object-cover" loading="lazy" />
                        </div>
                    </div>
                </section>

                {/* ── Region / Berlin ──────────────────────────────────────── */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-2 lg:gap-16">
                        <div>
                            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-primary">Einsatzgebiet</span>
                            <h2 className="mb-5 font-display text-4xl font-extrabold text-foreground md:text-6xl">
                                Firmenschulungen in Berlin und deutschlandweit
                            </h2>
                            <div className="space-y-4 text-lg text-muted-foreground">
                                <p>
                                    Unsere Firmenschulungen finden dort statt, wo Sie es möchten: bei Ihnen im Lager, in Ihrer
                                    Produktionshalle oder auf Ihrem Betriebshof in Berlin, oder in unserer eigenen Schulungshalle in Berlin.
                                    Ob Logistik, Produktion oder Handel: Wir stimmen Inhalte und Praxisübungen auf Ihre Geräte
                                    und Abläufe ab.
                                </p>
                                <p>
                                    Darüber hinaus schulen wir Unternehmen deutschlandweit. Unsere Standorte:
                                </p>
                            </div>
                            <ul className="mt-5 flex flex-wrap gap-2">
                                {CONTACT.locations.map((loc) => (
                                    <li key={loc} className="flex items-center gap-2 border border-border px-4 py-2 font-medium text-foreground">
                                        <MapPin className="h-4 w-4 text-primary" aria-hidden /> {loc}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="border border-border bg-secondary p-6 md:p-8">
                            <h3 className="mb-5 font-display text-2xl font-bold text-foreground">Ihre Vorteile</h3>
                            <CheckList items={BENEFITS} />
                        </div>
                    </div>
                </section>

                {/* ── FAQ ──────────────────────────────────────────────────── */}
                <section className="bg-secondary py-16 md:py-24">
                    <div className="container mx-auto max-w-4xl px-4">
                        <div className="mb-10 text-center md:mb-14">
                            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-primary">FAQ</span>
                            <h2 className="font-display text-4xl font-extrabold text-foreground md:text-6xl">
                                Häufige Fragen zur Firmenschulung
                            </h2>
                        </div>
                        <Accordion type="single" collapsible className="space-y-3">
                            {FAQ.map((item, i) => (
                                <AccordionItem key={item.q} value={`faq-${i}`} className="border border-border bg-background px-5">
                                    <AccordionTrigger className="text-left text-base font-semibold hover:no-underline md:text-lg">
                                        {item.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-base text-muted-foreground">
                                        <p>{item.a}</p>
                                        {item.bullets && (
                                            <ul className="ml-5 mt-3 list-disc space-y-1">
                                                {item.bullets.map((b) => <li key={b}>{b}</li>)}
                                            </ul>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>

                {/* ── Anfrage ──────────────────────────────────────────────── */}
                <section id="anfrage" className="scroll-mt-20 bg-industrial py-16 md:py-24">
                    <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-5 lg:gap-16">
                        <div className="lg:col-span-2">
                            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-primary">Angebot</span>
                            <h2 className="mb-5 font-display text-4xl font-extrabold text-primary-foreground md:text-6xl">
                                Jetzt Angebot für Ihre Firmenschulung anfordern
                            </h2>
                            <p className="mb-8 text-primary-foreground/80">
                                Schildern Sie uns kurz Ihren Bedarf. Wir melden uns schnellstmöglich mit einem individuellen Angebot.
                            </p>
                            <ul className="space-y-4 text-primary-foreground">
                                {CONTACT.phones.map((p) => (
                                    <li key={p.href} className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-primary" aria-hidden />
                                        <a href={`tel:${p.href}`} className="hover:text-primary">{p.display}</a>
                                    </li>
                                ))}
                                <li className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-primary" aria-hidden />
                                    <a href={`mailto:${CONTACT.email}`} className="hover:text-primary">{CONTACT.email}</a>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-primary" aria-hidden />
                                    <span>{CONTACT.hours}</span>
                                </li>
                            </ul>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 bg-background p-6 md:p-8 lg:col-span-3">
                            {/* Honeypot — für Menschen unsichtbar */}
                            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
                                <label htmlFor="b2b-website">Website</label>
                                <input id="b2b-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="b2b-name">Ansprechpartner *</Label>
                                    <Input id="b2b-name" autoComplete="name" value={form.name} onChange={set("name")} required maxLength={150} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="b2b-company">Unternehmen</Label>
                                    <Input id="b2b-company" autoComplete="organization" value={form.company} onChange={set("company")} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="b2b-email">E-Mail *</Label>
                                    <Input id="b2b-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="b2b-phone">Telefon</Label>
                                    <Input id="b2b-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="b2b-employees">Anzahl Teilnehmende</Label>
                                    <Input id="b2b-employees" inputMode="numeric" value={form.employees} onChange={set("employees")} placeholder="Wie viele Personen sollen geschult werden?" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="b2b-equipment">Geräteart</Label>
                                    <Input id="b2b-equipment" value={form.equipment} onChange={set("equipment")} placeholder="z. B. Frontstapler" />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="b2b-venue">Wo soll die Schulung stattfinden?</Label>
                                    <select
                                        id="b2b-venue"
                                        value={form.venue}
                                        onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option>Noch offen</option>
                                        <option>Bei uns im Betrieb</option>
                                        <option>In Ihrer Schulungshalle (Berlin)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="b2b-location">Stadt</Label>
                                    <Input id="b2b-location" value={form.location} onChange={set("location")} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="b2b-message">Ihre Nachricht *</Label>
                                <Textarea
                                    id="b2b-message"
                                    rows={4}
                                    value={form.message}
                                    onChange={set("message")}
                                    required
                                    placeholder="Wunschtermin, Sprache, Vorerfahrung der Teilnehmenden …"
                                />
                            </div>
                            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={sending}>
                                <Send className="h-5 w-5" /> {sending ? "Wird gesendet …" : "Angebot anfordern"}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Angaben zur Bearbeitung Ihrer Anfrage zu.
                                Details in unserer <Link to="/datenschutz" className="underline hover:text-primary">Datenschutzerklärung</Link>.
                            </p>
                        </form>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default FirmenschulungBerlin;
