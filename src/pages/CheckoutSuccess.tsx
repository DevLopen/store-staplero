import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ArrowRight, Download, Calendar } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get("session_id");

    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) {
            navigate("/");
            return;
        }

        const verifySession = async () => {
            try {
                const response = await fetch(`${API_URL}/checkout/verify/${sessionId}`);
                const data = await response.json();

                if (data.success && data.order) {
                    setOrder(data.order);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        verifySession();
    }, [sessionId, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span>Lade Bestelldetails...</span>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">Bestellung nicht gefunden</p>
                        <Button className="mt-4" onClick={() => navigate("/")}>
                            Zurück zur Startseite
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        {/* Success Message */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-success" />
                            </div>
                            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                                Zahlung erfolgreich!
                            </h1>
                            <p className="text-muted-foreground">
                                Ihre Bestellung wurde erfolgreich abgeschlossen
                            </p>
                        </div>

                        {/* Order Details */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Bestelldetails</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bestellnummer</p>
                                        <p className="font-semibold">{order.orderNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <p className="font-semibold text-success">Bezahlt</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    {order.items.map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between mb-2">
                                            <span>{item.courseName}</span>
                                            <span className="font-semibold">{item.price.toFixed(2)} €</span>
                                        </div>
                                    ))}

                                    {order.practicalCourseDetails?.wantsPlasticCard && (
                                        <div className="flex justify-between mb-2 text-sm text-muted-foreground">
                                            <span>Plastikkarte</span>
                                            <span>14,99 €</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                                        <span>Gesamt</span>
                                        <span className="text-primary">{order.totalAmount.toFixed(2)} €</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Course Access Info */}
                        {order.type === "online" && (
                            <Card className="mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                            <CheckCircle className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground mb-2">
                                                Ihr Kurs ist jetzt freigeschaltet!
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Sie haben 30 Tage lang Zugang zu Ihrem Online-Kurs.
                                                Sie können jederzeit in Ihrem Dashboard mit dem Lernen beginnen.
                                            </p>
                                            <Button onClick={() => navigate("/dashboard")}>
                                                Zum Kurs
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Practical Course Info */}
                        {order.type === "practical" && order.practicalCourseDetails && (
                            <Card className="mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                            <Calendar className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground mb-2">
                                                Ihr Kurs-Termin
                                            </h3>
                                            <div className="space-y-2 mb-4">
                                                <p className="text-sm">
                                                    <span className="text-muted-foreground">Standort:</span>{" "}
                                                    <span className="font-medium">{order.practicalCourseDetails.locationName}</span>
                                                </p>
                                                <p className="text-sm">
                                                    <span className="text-muted-foreground">Adresse:</span>{" "}
                                                    <span className="font-medium">{order.practicalCourseDetails.locationAddress}</span>
                                                </p>
                                                <p className="text-sm">
                                                    <span className="text-muted-foreground">Datum:</span>{" "}
                                                    <span className="font-medium">
                            {new Date(order.practicalCourseDetails.date).toLocaleDateString("de-DE", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                          </span>
                                                </p>
                                                <p className="text-sm">
                                                    <span className="text-muted-foreground">Uhrzeit:</span>{" "}
                                                    <span className="font-medium">{order.practicalCourseDetails.time}</span>
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-4">
                                                Eine Bestätigungs-E-Mail mit allen Details wurde an Ihre E-Mail-Adresse gesendet.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Next Steps */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Nächste Schritte</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-primary">1</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                Überprüfen Sie Ihre E-Mail
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Wir haben Ihnen eine Bestätigung mit allen Details gesendet
                                            </p>
                                        </div>
                                    </div>

                                    {order.type === "online" && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-primary">2</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    Beginnen Sie mit Ihrem Kurs
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Loggen Sie sich ein und starten Sie Ihre Ausbildung
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {order.type === "practical" && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-primary">2</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    Bereiten Sie sich vor
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Erscheinen Sie pünktlich mit Ausweis und festem Schuhwerk
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-primary">3</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                Bei Fragen kontaktieren Sie uns
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Wir helfen Ihnen gerne weiter: info@staplero.de
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => navigate("/dashboard")}
                            >
                                Zum Dashboard
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => navigate("/")}
                            >
                                Zurück zur Startseite
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutSuccess;