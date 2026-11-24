import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ArrowRight, Calendar, Users, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fill, fmtDate, fmtMoney } from "@/components/dashboard/panelUtils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type SeatsSummary = { total: number; open: number; withEmail: number; buyerParticipates: boolean };

// Strona po płatności: w 4 językach (język strony), z informacją o wolnych miejscach
const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const sessionId = searchParams.get("session_id");

    const [order, setOrder] = useState<any>(null);
    const [seats, setSeats] = useState<SeatsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) {
            navigate("/");
            return;
        }
        const verifySession = async () => {
            try {
                const response = await fetch(`${API_URL}/checkout/verify/${encodeURIComponent(sessionId)}`);
                const data = await response.json();
                if (data.success && data.order) {
                    setOrder(data.order);
                    setSeats(data.seats || null);
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
                <span>{t("checkoutSuccess.loading")}</span>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">{t("checkoutSuccess.notFound")}</p>
                        <Button className="mt-4" onClick={() => navigate("/")}>
                            {t("checkoutSuccess.backHome")}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const d = order.practicalCourseDetails;
    const hasOnline = (order.items || []).some((i: any) => i.courseId);
    const buyerIn = seats ? seats.buyerParticipates : true;
    const multi = !!seats && (seats.total > 1 || !seats.buyerParticipates);
    const courseDate = d?.startDate
        ? d.endDate && d.endDate !== d.startDate
            ? `${fmtDate(d.startDate, language, { weekday: "short", day: "numeric", month: "long" })} – ${fmtDate(d.endDate, language, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}`
            : fmtDate(d.startDate, language, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : "";

    const step = (n: number, title: string, text: string) => (
        <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">{n}</span>
            </div>
            <div>
                <p className="font-medium text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-success" />
                            </div>
                            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                                {t("checkoutSuccess.successTitle")}
                            </h1>
                            <p className="text-muted-foreground">{t("checkoutSuccess.successDesc")}</p>
                        </div>

                        {/* Wolne miejsca: najważniejsze zadanie po zakupie dla kilku osób */}
                        {multi && seats && seats.open > 0 && (
                            <Card className="mb-6 border-primary/40">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                            <Users className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-semibold text-lg text-foreground mb-1">
                                                {fill(t("checkoutSuccess.seatsOpenTitle"), { x: seats.open, y: seats.total })}
                                            </h2>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {t(hasOnline ? "checkoutSuccess.seatsOpenText" : "checkoutSuccess.seatsOpenTextPractical")}
                                            </p>
                                            {seats.withEmail > 0 && (
                                                <p className="text-sm text-foreground mb-4 flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-primary shrink-0" />
                                                    {seats.withEmail === 1 ? t("checkoutSuccess.invitesSentOne") : fill(t("checkoutSuccess.invitesSent"), { n: seats.withEmail })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Button className="mt-2 w-full sm:w-auto sm:ml-16 h-auto min-h-11 whitespace-normal py-2.5" onClick={() => navigate("/dashboard#bestellungen")}>
                                        {t("checkoutSuccess.seatsButton")}
                                        <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                        {multi && seats && seats.open === 0 && seats.withEmail > 0 && (
                            <p className="mb-6 text-sm text-foreground flex items-center justify-center gap-2 text-center">
                                <Mail className="w-4 h-4 text-primary shrink-0" />
                                {seats.withEmail === 1 ? t("checkoutSuccess.invitesSentOne") : fill(t("checkoutSuccess.invitesSent"), { n: seats.withEmail })}
                            </p>
                        )}

                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>{t("checkoutSuccess.orderDetails")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm text-muted-foreground">{t("checkoutSuccess.orderNumber")}</p>
                                        <p className="font-semibold break-all">{order.orderNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t("checkoutSuccess.status")}</p>
                                        <p className="font-semibold text-success">{t("checkoutSuccess.paid")}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    {order.items.map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between gap-4 mb-2">
                                            <span className="min-w-0">{(item.quantity || 1) > 1 ? `${item.quantity} × ` : ""}{item.courseName}</span>
                                            <span className="font-semibold shrink-0">{fmtMoney(item.price * (item.quantity || 1), language)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                                        <span>{t("checkoutSuccess.totalAmount")}</span>
                                        <span className="text-primary">{fmtMoney(order.totalAmount, language)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {order.type === "online" && buyerIn && (
                            <Card className="mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                            <CheckCircle className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground mb-2">{t("checkoutSuccess.courseUnlocked")}</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {order.expiresAt
                                                    ? fill(t("checkoutSuccess.courseAccessUntil"), { date: fmtDate(order.expiresAt, language) })
                                                    : t("checkoutSuccess.step2OnlineDesc")}
                                            </p>
                                            <Button onClick={() => navigate("/dashboard#kurse")}>
                                                {t("checkoutSuccess.goToCourse")}
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {order.type === "practical" && d && (
                            <Card className="mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                            <Calendar className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-foreground mb-2">{t("checkoutSuccess.yourAppointment")}</h3>
                                            <div className="space-y-2 mb-4">
                                                <p className="text-sm"><span className="text-muted-foreground">{t("checkoutSuccess.location")}</span>{" "}<span className="font-medium">{d.locationName}</span></p>
                                                <p className="text-sm"><span className="text-muted-foreground">{t("checkoutSuccess.addressLabel")}</span>{" "}<span className="font-medium">{d.locationAddress}</span></p>
                                                {courseDate && <p className="text-sm"><span className="text-muted-foreground">{t("checkoutSuccess.date")}</span>{" "}<span className="font-medium">{courseDate}</span></p>}
                                                {d.time && <p className="text-sm"><span className="text-muted-foreground">{t("checkoutSuccess.time")}</span>{" "}<span className="font-medium">{d.time}</span></p>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{t("checkoutSuccess.confirmEmail")}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("checkoutSuccess.nextSteps")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {step(1, t("checkoutSuccess.step1Title"), t("checkoutSuccess.step1Desc"))}
                                    {order.type === "online"
                                        ? step(2, t("checkoutSuccess.step2OnlineTitle"), t("checkoutSuccess.step2OnlineDesc"))
                                        : step(2, t("checkoutSuccess.step2PractTitle"), t("checkoutSuccess.step2PractDesc"))}
                                    {step(3, t("checkoutSuccess.step3Title"), t("checkoutSuccess.step3Desc"))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                            <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                                {t("checkoutSuccess.toDashboard")}
                            </Button>
                            <Button className="flex-1" onClick={() => navigate("/")}>
                                {t("checkoutSuccess.backToHome")}
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
