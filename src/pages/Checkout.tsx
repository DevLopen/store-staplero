import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/utils/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    CreditCard, Lock, ArrowRight, CheckCircle, Users, User, Building2, LogIn, UserCheck, FileText,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface CheckoutData {
    type: "online" | "practical";
    courseId?: string;
    // Produkt z panelu — backend na jego podstawie weryfikuje cenę
    productId?: string;
    courseName: string;
    price: number;
    // Opcjonalna cena netto kursu online (np. z konfiguracji Produktu, z uwzględnieniem promocji).
    // Jeśli pominięta, backend zastosuje domyślną cenę globalną.
    netPrice?: number;
    practicalCourse?: {
        locationId: string;
        locationName: string;
        locationAddress: string;
        date: string;
        time: string;
        availableSpots: number;
        price: number;
        participantCount?: number;
    };
}

type BuyerType = "private" | "company";

/** Numerowany nagłówek kroku — kupujący od razu widzi, ile kroków go czeka */
const StepTitle = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <CardTitle className="flex items-center gap-3 text-xl">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-[hsl(var(--on-primary))]">
            {n}
        </span>
        {children}
    </CardTitle>
);

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const auth = useAuth();

    const checkoutData = location.state as CheckoutData;

    // Krok 1: Privatperson / Unternehmen — widoczny od razu na górze formularza.
    // Wcześniej opcja "Firma" była schowana za checkboxem "abweichende Rechnungsadresse".
    const [buyerType, setBuyerType] = useState<BuyerType>("private");
    const isCompany = buyerType === "company";

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
    });

    const [company, setCompany] = useState({ name: "", vatId: "" });

    // Logowanie w miejscu — po zalogowaniu formularz nie pyta już o hasło
    const [showLogin, setShowLogin] = useState(false);
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [loginError, setLoginError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Abweichende Rechnungsadresse — tylko dla osób prywatnych
    // (u firm adres firmy JEST adresem rozliczeniowym)
    const [billingAddressDifferent, setBillingAddressDifferent] = useState(false);
    const [billingAddress, setBillingAddress] = useState({
        name: "",
        address: "",
        city: "",
        postalCode: "",
    });

    // Dane dodatkowych uczestników — liczba osób została ustalona na poprzednim kroku
    // (ProductDetail). Dla każdej osoby zbieramy osobno imię i nazwisko,
    // tak samo jak dla głównego kupującego.
    const additionalCount = Math.max(0, (checkoutData?.practicalCourse?.participantCount || 1) - 1);
    const [additionalParticipants, setAdditionalParticipants] = useState<{ firstName: string; lastName: string }[]>(
        Array.from({ length: additionalCount }, () => ({ firstName: "", lastName: "" }))
    );

    const updateParticipant = (index: number, field: "firstName" | "lastName", value: string) => {
        setAdditionalParticipants((prev) =>
            prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
        );
    };

    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!checkoutData) {
            navigate("/");
        }
    }, [checkoutData, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBillingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBillingAddress({ ...billingAddress, [e.target.name]: e.target.value });
    };

    const participantCount = checkoutData?.practicalCourse?.participantCount || 1;

    const calculateTotal = () => {
        if (checkoutData.type === "practical" && checkoutData.practicalCourse) {
            return checkoutData.practicalCourse.price;
        }
        return checkoutData.price;
    };

    const openLogin = (email = formData.email, error = "") => {
        setLoginData({ email, password: "" });
        setLoginError(error);
        setShowLogin(true);
    };

    const handleLogin = async () => {
        if (!loginData.email || !loginData.password) {
            setLoginError("Bitte E-Mail und Passwort eingeben.");
            return;
        }
        setIsLoggingIn(true);
        setLoginError("");
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData),
            });
            const data = await res.json();
            if (!res.ok) {
                setLoginError(data.message || "E-Mail oder Passwort ist falsch.");
                return;
            }
            auth.login(data.user, data.token);
            setShowLogin(false);
            toast({ title: "Angemeldet", description: `Willkommen zurück, ${data.user.name}!` });
        } catch {
            setLoginError("Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const fail = (description: string) => toast({ title: "Fehler", description, variant: "destructive" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!acceptTerms) return fail("Bitte akzeptieren Sie die AGB");

        if (isCompany) {
            if (!company.name.trim() || !company.vatId.trim()) {
                return fail("Firmenname und USt-IdNr. sind für Firmenkunden erforderlich");
            }
            if (!formData.address.trim() || !formData.city.trim() || !formData.postalCode.trim()) {
                return fail("Bitte füllen Sie die Firmenadresse vollständig aus");
            }
        } else if (billingAddressDifferent) {
            if (!billingAddress.name.trim() || !billingAddress.address.trim() || !billingAddress.city.trim() || !billingAddress.postalCode.trim()) {
                return fail("Bitte füllen Sie die Rechnungsadresse vollständig aus");
            }
        }

        if (additionalParticipants.some((p) => !p.firstName.trim() || !p.lastName.trim())) {
            return fail("Bitte geben Sie Vor- und Nachname für alle weiteren Teilnehmer ein");
        }

        setIsProcessing(true);

        try {
            const contactName = auth.isLoggedIn
                ? auth.userName
                : `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

            // Firma: dane firmy wysyłamy jako adres rozliczeniowy (backend już to obsługuje)
            const billing = isCompany
                ? {
                    billingAddressDifferent: true,
                    billingAddress: {
                        isCompany: true,
                        company: company.name.trim(),
                        vatId: company.vatId.trim(),
                        name: contactName,
                        address: formData.address,
                        city: formData.city,
                        postalCode: formData.postalCode,
                    },
                }
                : {
                    billingAddressDifferent,
                    billingAddress: billingAddressDifferent ? { ...billingAddress, isCompany: false } : undefined,
                };

            // Zalogowany użytkownik: backend rozpoznaje go po tokenie, więc nie wysyłamy hasła
            // ani pustych pól profilu (nie nadpisujemy zapisanych danych).
            const account = auth.isLoggedIn
                ? { email: auth.userEmail }
                : {
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    postalCode: formData.postalCode,
                };

            const token = auth.isLoggedIn ? getToken() : null;
            const response = await fetch(`${API_URL}/checkout/create-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    ...account,
                    ...billing,
                    type: checkoutData.type,
                    courseId: checkoutData.courseId,
                    productId: checkoutData.productId,
                    price: checkoutData.netPrice,
                    practicalCourse: checkoutData.practicalCourse
                        ? {
                            ...checkoutData.practicalCourse,
                            additionalParticipants: additionalParticipants.map((p) => ({
                                firstName: p.firstName.trim(),
                                lastName: p.lastName.trim(),
                            })),
                        }
                        : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // E-Mail gehört zu einem bestehenden Konto → Anmeldung direkt anbieten
                if (response.status === 401 && data.existingAccount) {
                    openLogin(formData.email, "Zu dieser E-Mail gibt es bereits ein Konto. Bitte melden Sie sich an.");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                    fail(data.message || "Checkout fehlgeschlagen");
                }
                setIsProcessing(false);
                return;
            }

            // Save token for auto-login after payment
            localStorage.setItem("token", data.token);

            // Redirect to Stripe Checkout
            if (data.sessionUrl) {
                window.location.href = data.sessionUrl;
            }
        } catch (err) {
            console.error(err);
            fail(err instanceof Error ? err.message : "Checkout konnte nicht gestartet werden");
            setIsProcessing(false);
        }
    };

    if (!checkoutData) return null;

    const buyerOptions: { value: BuyerType; Icon: typeof User; title: string; text: string }[] = [
        { value: "private", Icon: User, title: "Privatperson", text: "Ich kaufe für mich selbst" },
        { value: "company", Icon: Building2, title: "Unternehmen", text: "Rechnung auf Firma, z. B. für Mitarbeitende" },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-8">
                            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                                Kasse
                            </h1>
                            <p className="text-muted-foreground">
                                Vervollständigen Sie Ihre Bestellung
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Form */}
                            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
                                {/* ── Anmeldung ────────────────────────────────────────────── */}
                                {auth.isLoggedIn ? (
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
                                        <p className="flex items-center gap-2 text-sm text-foreground">
                                            <UserCheck className="h-5 w-5 text-success" aria-hidden />
                                            Angemeldet als <strong>{auth.userName}</strong>
                                            <span className="text-muted-foreground">({auth.userEmail})</span>
                                        </p>
                                        <button type="button" onClick={auth.logout} className="text-sm text-muted-foreground underline hover:text-foreground">
                                            Nicht Sie? Abmelden
                                        </button>
                                    </div>
                                ) : !showLogin ? (
                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
                                        <p className="flex items-center gap-2 text-sm text-foreground">
                                            <LogIn className="h-5 w-5 text-primary" aria-hidden />
                                            <span><strong>Bereits Kunde?</strong> Melden Sie sich an und bestellen Sie schneller.</span>
                                        </p>
                                        <Button type="button" variant="outline" size="sm" onClick={() => openLogin()}>
                                            Anmelden
                                        </Button>
                                    </div>
                                ) : (
                                    <Card className="border-primary/40">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <LogIn className="h-5 w-5 text-primary" aria-hidden /> Anmelden
                                            </CardTitle>
                                            <CardDescription>Mit Ihrem bestehenden Konto bestellen</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="loginEmail">E-Mail</Label>
                                                    <Input
                                                        id="loginEmail"
                                                        type="email"
                                                        autoComplete="email"
                                                        value={loginData.email}
                                                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="loginPassword">Passwort</Label>
                                                    <Input
                                                        id="loginPassword"
                                                        type="password"
                                                        autoComplete="current-password"
                                                        value={loginData.password}
                                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleLogin(); } }}
                                                    />
                                                </div>
                                            </div>
                                            {loginError && <p className="text-sm font-medium text-destructive" role="alert">{loginError}</p>}
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                <Button type="button" onClick={handleLogin} disabled={isLoggingIn}>
                                                    {isLoggingIn ? "Wird angemeldet …" : "Anmelden"}
                                                </Button>
                                                <a href="/forgot-password" target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                                                    Passwort vergessen?
                                                </a>
                                                <button type="button" onClick={() => setShowLogin(false)} className="text-sm text-muted-foreground underline hover:text-foreground">
                                                    Ohne Anmeldung fortfahren
                                                </button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* ── 1. Privatperson / Unternehmen ────────────────────────── */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <StepTitle n={1}>Wie möchten Sie bestellen?</StepTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div role="radiogroup" aria-label="Käufertyp" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {buyerOptions.map(({ value, Icon, title, text }) => {
                                                const selected = buyerType === value;
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={selected}
                                                        onClick={() => setBuyerType(value)}
                                                        className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                                            selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                                                        }`}
                                                    >
                                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${selected ? "bg-primary text-[hsl(var(--on-primary))]" : "bg-muted text-muted-foreground"}`}>
                                                            <Icon className="h-5 w-5" aria-hidden />
                                                        </span>
                                                        <span className="flex-1">
                                                            <span className="block font-semibold text-foreground">{title}</span>
                                                            <span className="block text-sm text-muted-foreground">{text}</span>
                                                        </span>
                                                        <span
                                                            aria-hidden
                                                            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-primary" : "border-muted-foreground/40"}`}
                                                        >
                                                            {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {isCompany && (
                                            <p className="mt-3 text-sm text-muted-foreground">
                                                Sie erhalten eine Rechnung auf Ihr Unternehmen mit ausgewiesener MwSt.
                                                Mehrere Mitarbeitende oder Schulung im Betrieb?{" "}
                                                <Link to="/firmenschulung-berlin" className="text-primary underline">Individuelles Angebot anfragen</Link>
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* ── 2. Kontakt / Konto ───────────────────────────────────── */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <StepTitle n={2}>{isCompany ? "Ansprechpartner" : "Ihre Daten"}</StepTitle>
                                        {isCompany && !auth.isLoggedIn && (
                                            <CardDescription>
                                                Auf diese Person wird das Kundenkonto angelegt. Sie ist Teilnehmer 1 der Schulung.
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {auth.isLoggedIn ? (
                                            <p className="text-sm text-muted-foreground">
                                                Sie bestellen als <strong className="text-foreground">{auth.userName}</strong> ({auth.userEmail}).
                                                Ihre gespeicherten Kontodaten werden verwendet.
                                            </p>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="firstName">Vorname *</Label>
                                                        <Input id="firstName" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={handleInputChange} required placeholder="Max" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="lastName">Nachname *</Label>
                                                        <Input id="lastName" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={handleInputChange} required placeholder="Mustermann" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="email">E-Mail *</Label>
                                                        <Input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleInputChange} required placeholder={isCompany ? "max@firma.de" : "max@example.com"} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="phone">Telefon</Label>
                                                        <Input id="phone" name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleInputChange} placeholder="+49 170 1234567" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="password">Passwort für Ihr Kundenkonto *</Label>
                                                    <Input id="password" name="password" type="password" autoComplete="new-password" value={formData.password} onChange={handleInputChange} required minLength={6} placeholder="Mindestens 6 Zeichen" />
                                                    <p className="text-xs text-muted-foreground">
                                                        Damit greifen Sie später auf Kurs, Termine und Zertifikat zu.{" "}
                                                        Schon ein Konto?{" "}
                                                        <button type="button" onClick={() => openLogin()} className="text-primary underline">Hier anmelden</button>
                                                    </p>
                                                </div>
                                            </>
                                        )}

                                        {/* ── Zusätzliche Teilnehmer ─────────────────────────── */}
                                        {additionalParticipants.length > 0 && (
                                            <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                                                <div>
                                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-primary" />
                                                        Weitere Teilnehmer ({additionalParticipants.length})
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {isCompany
                                                            ? "Teilnehmer 1 ist der oben genannte Ansprechpartner. Bitte tragen Sie hier die weiteren Mitarbeitenden ein."
                                                            : "Diese Personen nehmen zusätzlich zu Ihnen am Kurs teil."}
                                                    </p>
                                                </div>
                                                {additionalParticipants.map((p, i) => (
                                                    <div key={i} className="space-y-1.5">
                                                        <p className="text-xs text-muted-foreground">Teilnehmer {i + 2}</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <Input
                                                                id={`participant-${i}-firstName`}
                                                                aria-label={`Vorname Teilnehmer ${i + 2}`}
                                                                placeholder="Vorname"
                                                                value={p.firstName}
                                                                onChange={(e) => updateParticipant(i, "firstName", e.target.value)}
                                                                required
                                                            />
                                                            <Input
                                                                id={`participant-${i}-lastName`}
                                                                aria-label={`Nachname Teilnehmer ${i + 2}`}
                                                                placeholder="Nachname"
                                                                value={p.lastName}
                                                                onChange={(e) => updateParticipant(i, "lastName", e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* ── 3. Rechnung ──────────────────────────────────────────── */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <StepTitle n={3}>{isCompany ? "Firmendaten & Rechnung" : "Adresse & Rechnung"}</StepTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {isCompany && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="companyName">Firmenname *</Label>
                                                    <Input id="companyName" autoComplete="organization" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} required placeholder="Muster GmbH" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="companyVatId">USt-IdNr. *</Label>
                                                    <Input id="companyVatId" value={company.vatId} onChange={(e) => setCompany({ ...company, vatId: e.target.value })} required placeholder="DE123456789" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Adres: dla firmy wymagany (adres na fakturze), dla osoby prywatnej opcjonalny.
                                            Zalogowana osoba prywatna ma adres w koncie, więc go nie pokazujemy. */}
                                        {(isCompany || !auth.isLoggedIn) && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="address">{isCompany ? "Firmenadresse *" : "Adresse"}</Label>
                                                    <Input id="address" name="address" autoComplete="street-address" value={formData.address} onChange={handleInputChange} required={isCompany} placeholder="Straße und Hausnummer" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="postalCode">PLZ{isCompany && " *"}</Label>
                                                        <Input id="postalCode" name="postalCode" autoComplete="postal-code" value={formData.postalCode} onChange={handleInputChange} required={isCompany} placeholder="12345" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="city">Stadt{isCompany && " *"}</Label>
                                                        <Input id="city" name="city" autoComplete="address-level2" value={formData.city} onChange={handleInputChange} required={isCompany} placeholder="Berlin" />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {!isCompany && (
                                            <div>
                                                <div className="flex items-start space-x-3">
                                                    <Checkbox
                                                        id="billingDifferent"
                                                        checked={billingAddressDifferent}
                                                        onCheckedChange={(checked) => setBillingAddressDifferent(checked === true)}
                                                    />
                                                    <Label htmlFor="billingDifferent" className="cursor-pointer text-sm">
                                                        Rechnung an eine andere Person / Adresse
                                                    </Label>
                                                </div>

                                                {billingAddressDifferent && (
                                                    <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="billingName">Name *</Label>
                                                            <Input id="billingName" name="name" value={billingAddress.name} onChange={handleBillingInputChange} placeholder="Max Mustermann" required />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="billingAddress">Adresse *</Label>
                                                            <Input id="billingAddress" name="address" value={billingAddress.address} onChange={handleBillingInputChange} placeholder="Straße und Hausnummer" required />
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="billingPostalCode">PLZ *</Label>
                                                                <Input id="billingPostalCode" name="postalCode" value={billingAddress.postalCode} onChange={handleBillingInputChange} placeholder="12345" required />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="billingCity">Stadt *</Label>
                                                                <Input id="billingCity" name="city" value={billingAddress.city} onChange={handleBillingInputChange} placeholder="Berlin" required />
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Rechnung auf ein Unternehmen?{" "}
                                                            <button type="button" onClick={() => { setBuyerType("company"); setBillingAddressDifferent(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-primary underline">
                                                                Als Unternehmen bestellen
                                                            </button>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-start space-x-3 pt-4 border-t">
                                            <Checkbox
                                                id="terms"
                                                checked={acceptTerms}
                                                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                                            />
                                            <Label htmlFor="terms" className="cursor-pointer text-sm">
                                                Ich akzeptiere die{" "}
                                                <Link to="/agb" target="_blank" className="text-primary hover:underline">AGB</Link>{" "}
                                                und{" "}
                                                <Link to="/datenschutz" target="_blank" className="text-primary hover:underline">Datenschutzbestimmungen</Link>
                                            </Label>
                                        </div>

                                        <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                                            {isProcessing ? (
                                                "Wird verarbeitet..."
                                            ) : (
                                                <>
                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                    Zur Zahlung
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </form>

                            {/* Right Column - Summary */}
                            <div className="lg:col-span-1">
                                <Card className="lg:sticky lg:top-24">
                                    <CardHeader>
                                        <CardTitle>Bestellübersicht</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="p-4 bg-muted rounded-lg">
                                            <h3 className="font-semibold text-foreground mb-2">
                                                {checkoutData.courseName}
                                            </h3>
                                            {checkoutData.type === "online" && (
                                                <p className="text-sm text-muted-foreground">
                                                    30 Tage Online-Zugang
                                                </p>
                                            )}
                                            {checkoutData.type === "practical" && checkoutData.practicalCourse && (
                                                <>
                                                    <p className="text-sm text-muted-foreground">
                                                        {checkoutData.practicalCourse.locationName}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(checkoutData.practicalCourse.date).toLocaleDateString("de-DE", {
                                                            weekday: "long",
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {checkoutData.practicalCourse.time}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {participantCount} Teilnehmer
                                                    </p>
                                                    {additionalParticipants.length > 0 && (
                                                        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                                            <li>• {(auth.isLoggedIn ? auth.userName : `${formData.firstName} ${formData.lastName}`.trim()) || "Sie"} (Teilnehmer 1)</li>
                                                            {additionalParticipants.map((p, i) => (
                                                                <li key={i}>• {`${p.firstName} ${p.lastName}`.trim() || `Teilnehmer ${i + 2}`}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-start gap-2 text-sm">
                                            {isCompany ? <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                                            <span className="text-muted-foreground">
                                                Rechnung an:{" "}
                                                <span className="font-medium text-foreground">
                                                    {isCompany ? company.name.trim() || "Ihr Unternehmen" : "Privatperson"}
                                                </span>
                                            </span>
                                        </div>

                                        <div className="space-y-2 pt-4 border-t">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Kurspreis</span>
                                                <span className="font-medium">{calculateTotal().toFixed(2)} €</span>
                                            </div>

                                            <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                                <span>Gesamt</span>
                                                <span className="text-primary">{calculateTotal().toFixed(2)} €</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <CheckCircle className="w-4 h-4 text-success" />
                                                <span>Sichere Zahlung mit Stripe</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Lock className="w-4 h-4 text-success" />
                                                <span>SSL-verschlüsselt</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Checkout;
