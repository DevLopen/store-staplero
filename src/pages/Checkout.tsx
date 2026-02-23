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
import { ShoppingBag, CreditCard, Lock, ArrowRight, CheckCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface CheckoutData {
    type: "online" | "practical";
    courseId?: string;
    courseName: string;
    price: number;
    practicalCourse?: {
        locationId: string;
        locationName: string;
        locationAddress: string;
        date: string;
        time: string;
        availableSpots: number;
        price: number;
        wantsPlasticCard: boolean;
    };
}

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const checkoutData = location.state as CheckoutData;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
    });

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

    const calculateTotal = () => {
        if (checkoutData.type === "practical" && checkoutData.practicalCourse) {
            const base = checkoutData.practicalCourse.price;
            const card = checkoutData.practicalCourse.wantsPlasticCard ? 14.99 : 0;
            return base;
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

        setIsProcessing(true);

        try {
            const response = await fetch(`${API_URL}/checkout/create-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    type: checkoutData.type,
                    courseId: checkoutData.courseId,
                    practicalCourse: checkoutData.practicalCourse,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // POPRAWKA: Wykryj istniejące konto
                if (response.status === 401 && data.existingAccount) {
                    setExistingAccountError(true);
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
                                            Persönliche Daten
                                        </CardTitle>
                                        <CardDescription>
                                            Geben Sie Ihre Daten ein, um fortzufahren
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Name *</Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        required
                                                        placeholder="Max Mustermann"
                                                    />
                                                </div>
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
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password">Passwort *</Label>
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="Mindestens 6 Zeichen"
                                                    minLength={6}
                                                />
                                                {existingAccountError ? (
                                                    <p className="text-xs text-destructive font-medium">
                                                        ⚠️ Ein Konto mit dieser E-Mail existiert bereits. Bitte geben Sie Ihr Passwort ein.
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">
                                                        Ein Konto wird automatisch für Sie erstellt
                                                    </p>
                                                )}
                                            </div>

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
                                <Card className="sticky top-24">
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

                                            {checkoutData.type === "practical" &&
                                                checkoutData.practicalCourse?.wantsPlasticCard && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Plastikkarte</span>
                                                        <span className="font-medium">14,99 €</span>
                                                    </div>
                                                )}

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