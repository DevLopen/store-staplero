import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingBag, CreditCard, Lock, ArrowRight, CheckCircle, Users } from "lucide-react";

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

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const checkoutData = location.state as CheckoutData;

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

    // Jawny wybór: nowe konto vs. logowanie na istniejące — zamiast domyślnego,
    // niejawnego tworzenia konta "w tle".
    const [isExistingCustomer, setIsExistingCustomer] = useState(false);

    const [billingAddressDifferent, setBillingAddressDifferent] = useState(false);
    const [billingIsCompany, setBillingIsCompany] = useState(false);
    const [billingAddress, setBillingAddress] = useState({
        name: "",
        company: "",
        vatId: "",
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
    const [existingAccountError, setExistingAccountError] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!acceptTerms) {
            toast({
                title: "Fehler",
                description: "Bitte akzeptieren Sie die AGB",
                variant: "destructive",
            });
            return;
        }

        if (billingAddressDifferent) {
            if (!billingAddress.address.trim() || !billingAddress.city.trim() || !billingAddress.postalCode.trim()) {
                toast({
                    title: "Fehler",
                    description: "Bitte füllen Sie die Rechnungsadresse vollständig aus",
                    variant: "destructive",
                });
                return;
            }
            if (billingIsCompany && (!billingAddress.company.trim() || !billingAddress.vatId.trim())) {
                toast({
                    title: "Fehler",
                    description: "Firmenname und USt-IdNr. sind für Firmenkunden erforderlich",
                    variant: "destructive",
                });
                return;
            }
            if (!billingIsCompany && !billingAddress.name.trim()) {
                toast({
                    title: "Fehler",
                    description: "Bitte geben Sie den Namen für die Rechnungsadresse ein",
                    variant: "destructive",
                });
                return;
            }
        }

        const incompleteParticipant = additionalParticipants.some((p) => !p.firstName.trim() || !p.lastName.trim());
        if (incompleteParticipant) {
            toast({
                title: "Fehler",
                description: "Bitte geben Sie Vor- und Nachname für alle weiteren Teilnehmer ein",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);

        try {
            // Bei "Ich habe bereits ein Konto" senden wir nur E-Mail + Passwort —
            // die übrigen Profildaten sollen NICHT mit leeren Werten überschrieben werden
            // (der Backend behält bestehende Daten, wenn ein Feld fehlt).
            const profileFields = isExistingCustomer
                ? {}
                : {
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    postalCode: formData.postalCode,
                };

            const response = await fetch(`${API_URL}/checkout/create-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    ...profileFields,
                    billingAddressDifferent,
                    billingAddress: billingAddressDifferent ? { ...billingAddress, isCompany: billingIsCompany } : undefined,
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
                // POPRAWKA: Wykryj istniejące konto
                if (response.status === 401 && data.existingAccount) {
                    setExistingAccountError(true);
                    setIsExistingCustomer(true);
                    toast({
                        title: "Konto bereits vorhanden",
                        description: "Ein Konto mit dieser E-Mail existiert bereits. Bitte geben Sie Ihr Passwort ein.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Fehler",
                        description: data.message || "Checkout fehlgeschlagen",
                        variant: "destructive",
                    });
                }
                setIsProcessing(false);
                return;
            }

            setExistingAccountError(false);

            // Save token for auto-login after payment
            localStorage.setItem("token", data.token);

            // Redirect to Stripe Checkout
            if (data.sessionUrl) {
                window.location.href = data.sessionUrl;
            }
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Fehler",
                description: err.message || "Checkout konnte nicht gestartet werden",
                variant: "destructive",
            });
            setIsProcessing(false);
        }
    };

    if (!checkoutData) return null;

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
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ShoppingBag className="w-5 h-5 text-primary" />
                                            {isExistingCustomer ? "Anmelden & bestellen" : "Persönliche Daten"}
                                        </CardTitle>
                                        <CardDescription>
                                            {isExistingCustomer
                                                ? "Melden Sie sich mit Ihrem bestehenden Konto an, um die Bestellung abzuschließen"
                                                : "Geben Sie Ihre Daten ein, um fortzufahren"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Jawny wybór trybu — zamiast niejawnego tworzenia konta w tle */}
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <button
                                                type="button"
                                                onClick={() => { setIsExistingCustomer(false); setExistingAccountError(false); }}
                                                className={`text-sm font-medium rounded-lg border-2 py-2.5 px-3 transition-colors ${
                                                    !isExistingCustomer
                                                        ? "border-primary bg-primary/5 text-foreground"
                                                        : "border-border text-muted-foreground hover:bg-muted/50"
                                                }`}
                                            >
                                                Ich bin neu hier
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsExistingCustomer(true)}
                                                className={`text-sm font-medium rounded-lg border-2 py-2.5 px-3 transition-colors ${
                                                    isExistingCustomer
                                                        ? "border-primary bg-primary/5 text-foreground"
                                                        : "border-border text-muted-foreground hover:bg-muted/50"
                                                }`}
                                            >
                                                Ich habe bereits ein Konto
                                            </button>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            {!isExistingCustomer && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="firstName">Vorname *</Label>
                                                        <Input
                                                            id="firstName"
                                                            name="firstName"
                                                            autoComplete="given-name"
                                                            value={formData.firstName}
                                                            onChange={handleInputChange}
                                                            required
                                                            placeholder="Max"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="lastName">Nachname *</Label>
                                                        <Input
                                                            id="lastName"
                                                            name="lastName"
                                                            autoComplete="family-name"
                                                            value={formData.lastName}
                                                            onChange={handleInputChange}
                                                            required
                                                            placeholder="Mustermann"
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor="email">E-Mail *</Label>
                                                        <Input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            required
                                                            placeholder="max@example.com"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {isExistingCustomer && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">E-Mail *</Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        required
                                                        placeholder="max@example.com"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="password">Passwort *</Label>
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder={isExistingCustomer ? "Ihr Passwort" : "Mindestens 6 Zeichen"}
                                                    minLength={6}
                                                />
                                                {existingAccountError ? (
                                                    <p className="text-xs text-destructive font-medium">
                                                        ⚠️ Ein Konto mit dieser E-Mail existiert bereits. Bitte geben Sie Ihr Passwort ein.{" "}
                                                        <a href="/forgot-password" target="_blank" rel="noopener noreferrer" className="underline">Passwort vergessen?</a>
                                                    </p>
                                                ) : isExistingCustomer ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        Melden Sie sich mit dem Passwort Ihres bestehenden Kontos an.{" "}
                                                        <a href="/forgot-password" target="_blank" rel="noopener noreferrer" className="text-primary underline">Passwort vergessen?</a>
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">
                                                        Ein Konto wird automatisch für Sie erstellt
                                                    </p>
                                                )}
                                            </div>

                                            {!isExistingCustomer && (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="phone">Telefon</Label>
                                                        <Input
                                                            id="phone"
                                                            name="phone"
                                                            type="tel"
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                            placeholder="+49 170 1234567"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="address">Adresse</Label>
                                                        <Input
                                                            id="address"
                                                            name="address"
                                                            value={formData.address}
                                                            onChange={handleInputChange}
                                                            placeholder="Straße und Hausnummer"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="postalCode">PLZ</Label>
                                                            <Input
                                                                id="postalCode"
                                                                name="postalCode"
                                                                value={formData.postalCode}
                                                                onChange={handleInputChange}
                                                                placeholder="12345"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="city">Stadt</Label>
                                                            <Input
                                                                id="city"
                                                                name="city"
                                                                value={formData.city}
                                                                onChange={handleInputChange}
                                                                placeholder="Berlin"
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* ── Zusätzliche Teilnehmer ───────────────────────────────────── */}
                                            {/* Wyraźnie oddzielona sekcja, PO danych głównego kupującego —
                                                żeby nie wyglądało, że poniższe pola (telefon/adres) dotyczą
                                                dodatkowej osoby. Imię i nazwisko jako osobne pola, tak jak u
                                                głównego kupującego powyżej. */}
                                            {additionalParticipants.length > 0 && (
                                                <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                                                    <div>
                                                        <Label className="text-sm font-semibold flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-primary" />
                                                            Zusätzliche Teilnehmer ({additionalParticipants.length})
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Diese Personen nehmen zusätzlich zu Ihnen am Kurs teil.
                                                        </p>
                                                    </div>
                                                    {additionalParticipants.map((p, i) => (
                                                        <div key={i} className="space-y-1.5">
                                                            <p className="text-xs text-muted-foreground">
                                                                Teilnehmer {i + 2}
                                                            </p>
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

                                            {/* ── Rechnungsadresse ─────────────────────────────────────────── */}
                                            <div className="pt-2">
                                                <div className="flex items-start space-x-3">
                                                    <Checkbox
                                                        id="billingDifferent"
                                                        checked={billingAddressDifferent}
                                                        onCheckedChange={(checked) => setBillingAddressDifferent(checked === true)}
                                                    />
                                                    <Label htmlFor="billingDifferent" className="cursor-pointer text-sm">
                                                        Rechnungsadresse weicht von der oben angegebenen Adresse ab
                                                    </Label>
                                                </div>

                                                {billingAddressDifferent && (
                                                    <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
                                                        {/* Privatperson / Firma — bestimmt, welche Felder benötigt werden */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => setBillingIsCompany(false)}
                                                                className={`text-sm font-medium rounded-lg border-2 py-2 px-3 transition-colors ${
                                                                    !billingIsCompany
                                                                        ? "border-primary bg-primary/5 text-foreground"
                                                                        : "border-border text-muted-foreground hover:bg-muted"
                                                                }`}
                                                            >
                                                                Privatperson
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setBillingIsCompany(true)}
                                                                className={`text-sm font-medium rounded-lg border-2 py-2 px-3 transition-colors ${
                                                                    billingIsCompany
                                                                        ? "border-primary bg-primary/5 text-foreground"
                                                                        : "border-border text-muted-foreground hover:bg-muted"
                                                                }`}
                                                            >
                                                                Firma
                                                            </button>
                                                        </div>

                                                        {billingIsCompany ? (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="billingCompany">Firmenname *</Label>
                                                                    <Input
                                                                        id="billingCompany"
                                                                        name="company"
                                                                        value={billingAddress.company}
                                                                        onChange={handleBillingInputChange}
                                                                        placeholder="Muster GmbH"
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="billingName">Ansprechpartner (optional)</Label>
                                                                    <Input
                                                                        id="billingName"
                                                                        name="name"
                                                                        value={billingAddress.name}
                                                                        onChange={handleBillingInputChange}
                                                                        placeholder="Max Mustermann"
                                                                    />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <Label htmlFor="billingName">Name *</Label>
                                                                <Input
                                                                    id="billingName"
                                                                    name="name"
                                                                    value={billingAddress.name}
                                                                    onChange={handleBillingInputChange}
                                                                    placeholder="Max Mustermann"
                                                                    required
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="space-y-2">
                                                            <Label htmlFor="billingAddress">Adresse *</Label>
                                                            <Input
                                                                id="billingAddress"
                                                                name="address"
                                                                value={billingAddress.address}
                                                                onChange={handleBillingInputChange}
                                                                placeholder="Straße und Hausnummer"
                                                                required={billingAddressDifferent}
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="billingPostalCode">PLZ *</Label>
                                                                <Input
                                                                    id="billingPostalCode"
                                                                    name="postalCode"
                                                                    value={billingAddress.postalCode}
                                                                    onChange={handleBillingInputChange}
                                                                    placeholder="12345"
                                                                    required={billingAddressDifferent}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="billingCity">Stadt *</Label>
                                                                <Input
                                                                    id="billingCity"
                                                                    name="city"
                                                                    value={billingAddress.city}
                                                                    onChange={handleBillingInputChange}
                                                                    placeholder="Berlin"
                                                                    required={billingAddressDifferent}
                                                                />
                                                            </div>
                                                        </div>
                                                        {billingIsCompany && (
                                                            <div className="space-y-2">
                                                                <Label htmlFor="billingVatId">USt-IdNr. *</Label>
                                                                <Input
                                                                    id="billingVatId"
                                                                    name="vatId"
                                                                    value={billingAddress.vatId}
                                                                    onChange={handleBillingInputChange}
                                                                    placeholder="DE123456789"
                                                                    required
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-start space-x-3 pt-4 border-t">
                                                <Checkbox
                                                    id="terms"
                                                    checked={acceptTerms}
                                                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                                                />
                                                <div className="flex-1">
                                                    <Label htmlFor="terms" className="cursor-pointer text-sm">
                                                        Ich akzeptiere die{" "}
                                                        <a href="#" className="text-primary hover:underline">
                                                            AGB
                                                        </a>{" "}
                                                        und{" "}
                                                        <a href="#" className="text-primary hover:underline">
                                                            Datenschutzbestimmungen
                                                        </a>
                                                    </Label>
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full"
                                                size="lg"
                                                disabled={isProcessing}
                                            >
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
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>

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
                                                        {participantCount} {participantCount === 1 ? "Teilnehmer" : "Teilnehmer"}
                                                    </p>
                                                    {additionalParticipants.length > 0 && (
                                                        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                                            <li>• {`${formData.firstName} ${formData.lastName}`.trim() || "Sie"} (Hauptteilnehmer)</li>
                                                            {additionalParticipants.map((p, i) => (
                                                                <li key={i}>• {`${p.firstName} ${p.lastName}`.trim() || `Teilnehmer ${i + 2}`}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="space-y-2 pt-4 border-t">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Kurspreis</span>
                                                <span className="font-medium">
                          {checkoutData.type === "practical" && checkoutData.practicalCourse
                              ? checkoutData.practicalCourse.price.toFixed(2)
                              : checkoutData.price.toFixed(2)}{" "}
                                                    €
                        </span>
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