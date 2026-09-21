import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Loader2, MapPin, Calendar, Clock, Users, CreditCard, Award,
  CheckCircle, AlertCircle, ArrowLeft, Check, BellRing, Mail, Plus, Minus,
} from "lucide-react";
import { SealBadge, IconCertificate, IconForklift } from "@/components/BrandIcons";
import { Blob } from "@/components/SectionDecor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductBySlug, createNotifyRequest } from "@/api/product.api";
import {
  Product, ProductLocation, ProductLocationDate,
  localize, localizeList, currentPrice,
} from "@/types/product.types";

const VAT_RATE = 0.19;
const grossOf = (net: number) => Math.round(net * (1 + VAT_RATE) * 100) / 100;

const formatDate = (startDate: string, endDate: string) => {
  if (startDate === endDate) {
    return new Date(startDate).toLocaleDateString("de-DE", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }
  return `${new Date(startDate).toLocaleDateString("de-DE", { day: "numeric", month: "numeric", year: "numeric" })} - ${new Date(endDate).toLocaleDateString("de-DE", { day: "numeric", month: "numeric", year: "numeric" })}`;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface NotifyFormProps {
  slug: string;
  locationId?: string;
  locationCity?: string;
}

const NotifyForm = ({ slug, locationId, locationCity }: NotifyFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email)) {
      toast({
        title: t("common.error"),
        description: t("products.notifyInvalidEmail"),
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await createNotifyRequest(slug, { email, locationId, locationCity });
      setIsDone(true);
    } catch (err: any) {
      toast({
        title: t("common.error"),
        description: err.message || t("products.notifyError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="flex items-center gap-2 text-sm text-success bg-success/10 rounded-lg p-3">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span>{t("products.notifySuccess")}</span>
      </div>
    );
  }

  return (
    <div className="p-4 border border-dashed border-border rounded-xl bg-muted/30">
      <div className="flex items-center gap-2 mb-1">
        <BellRing className="w-4 h-4 text-primary" />
        <p className="font-medium text-foreground text-sm">{t("products.notifyTitle")}</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{t("products.notifyDesc")}</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("products.notifyPlaceholder")}
            className="pl-9"
            required
          />
        </div>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("products.notifyButton")}
        </Button>
      </form>
    </div>
  );
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, t } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [locations, setLocations] = useState<ProductLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<ProductLocation | null>(null);
  const [selectedDate, setSelectedDate] = useState<ProductLocationDate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  const MAX_ADDITIONAL_PARTICIPANTS = 5;

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setIsLoading(true);
    getProductBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setProduct(data.product);
        setLocations(data.locations);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Kurs nicht gefunden");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center pt-24 gap-4 text-center px-4">
          <p className="text-muted-foreground">{error || "Dieser Kurs existiert nicht (mehr)."}</p>
          <Link to="/kursy">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("products.backToList") || "Zurück zur Übersicht"}
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const title = localize(product.title, language);
  const description = localize(product.description, language);
  const shortDescription = localize(product.shortDescription, language);
  const benefits = localizeList(product.benefits, language);

  const netPrice = currentPrice(product);
  const hasPromo = product.isPromoActive && product.promoPrice != null;
  const Icon = product.type === "online" ? IconCertificate : IconForklift;

  const handleLocationSelect = (location: ProductLocation) => {
    if (!location.isActive) return;
    setSelectedLocation(location);
    setSelectedDate(null);
    setParticipantCount(1);
  };

  const handleDateSelect = (date: ProductLocationDate) => {
    if (date.availableSpots === 0) {
      toast({
        title: t("common.error") || "Fehler",
        description: "Dieser Termin ist leider ausgebucht.",
        variant: "destructive",
      });
      return;
    }
    setSelectedDate(date);
    setParticipantCount(1);
  };

  // Maksymalna liczba uczestników łącznie: mniejsza z (1 + limit 5) i (dostępnych miejsc)
  const maxTotalParticipants = selectedDate
    ? Math.max(1, Math.min(1 + MAX_ADDITIONAL_PARTICIPANTS, selectedDate.availableSpots))
    : 1;

  const incrementParticipants = () => {
    setParticipantCount((c) => Math.min(maxTotalParticipants, c + 1));
  };

  const decrementParticipants = () => {
    setParticipantCount((c) => Math.max(1, c - 1));
  };

  const handleOnlineCheckout = () => {
    setIsProcessing(true);
    navigate("/checkout", {
      state: {
        type: "online",
        productId: product._id,
        courseId: product.courseId,
        courseName: title,
        price: grossOf(netPrice),
        netPrice,
      },
    });
  };

  const handlePracticalCheckout = () => {
    if (!selectedLocation || !selectedDate) {
      toast({
        title: t("common.error") || "Fehler",
        description: "Bitte wählen Sie einen Standort und Termin aus.",
        variant: "destructive",
      });
      return;
    }

    const finalPrice = Math.round(grossOf(netPrice) * participantCount * 100) / 100;
    setIsProcessing(true);
    navigate("/checkout", {
      state: {
        type: "practical",
        productId: product._id,
        courseName: title,
        price: finalPrice,
        practicalCourse: {
          locationId: selectedLocation._id,
          locationName: selectedLocation.city,
          locationAddress: selectedLocation.address,
          dateId: selectedDate.id,
          startDate: selectedDate.startDate,
          endDate: selectedDate.endDate,
          time: selectedDate.time,
          availableSpots: selectedDate.availableSpots,
          basePrice: netPrice,
          price: finalPrice,
          participantCount,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative pt-24 pb-16 overflow-hidden">
        <Blob tone="primary" className="w-[28rem] h-[28rem] -top-40 -right-40" />
        {/* Hero */}
        <section className="container mx-auto px-4 mb-10">
          <Link to="/kursy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            {t("products.backToList") || "Zurück zur Übersicht"}
          </Link>
          <div className="flex items-start gap-4 max-w-3xl">
            <SealBadge tone="primary" rotate={-6} className="shrink-0">
              <Icon className="w-7 h-7 text-primary-foreground" />
            </SealBadge>
            <div>
              <p className="text-sm text-primary font-medium mb-1">
                {product.type === "online"
                  ? t("pricing.onlineLabel") || "Kurs online"
                  : t("pricing.practicalLabel") || "Kurs praktyczny"}
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                {title}
              </h1>
              {shortDescription && (
                <p className="text-muted-foreground text-lg">{shortDescription}</p>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column — description, benefits, location/date selection */}
            <div className="lg:col-span-2 space-y-8">
              {product.thumbnailUrl && (
                <img
                  src={product.thumbnailUrl}
                  alt={title}
                  className="w-full h-64 object-cover rounded-2xl border border-border"
                />
              )}

              {description && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("products.description") || "Beschreibung"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">{description}</p>
                  </CardContent>
                </Card>
              )}

              {benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("products.included") || "Im Preis enthalten"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-success-foreground" />
                          </div>
                          <span className="text-foreground text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {product.type === "normal" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        {t("practical.selectLocation") || "Standort wählen"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {locations.length === 0 ? (
                        <div className="space-y-4">
                          <p className="text-muted-foreground text-sm">
                            {t("products.noLocations")}
                          </p>
                          <NotifyForm slug={product.slug} />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {locations.map((location) => (
                            <Card
                              key={location._id}
                              className={`cursor-pointer transition-all ${
                                !location.isActive
                                  ? "opacity-60 cursor-not-allowed"
                                  : selectedLocation?._id === location._id
                                  ? "ring-2 ring-primary shadow-md"
                                  : "hover:shadow-md"
                              }`}
                              onClick={() => handleLocationSelect(location)}
                            >
                              <CardContent className="p-4">
                                <h3 className="font-semibold text-foreground mb-1">{location.city}</h3>
                                <p className="text-sm text-muted-foreground">{location.address}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {selectedLocation && selectedLocation.isActive && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          {t("practical.selectDate") || "Termin wählen"} - {selectedLocation.city}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedLocation.dates.length === 0 ? (
                          <>
                            <p className="text-muted-foreground text-sm">
                              {t("products.noDates")}
                            </p>
                            <NotifyForm
                              slug={product.slug}
                              locationId={selectedLocation._id}
                              locationCity={selectedLocation.city}
                            />
                          </>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedLocation.dates.map((date) => (
                              <Card
                                key={date.id}
                                className={`cursor-pointer transition-all ${
                                  date.availableSpots === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : selectedDate?.id === date.id
                                    ? "ring-2 ring-primary bg-primary/5"
                                    : "hover:bg-muted/50"
                                }`}
                                onClick={() => handleDateSelect(date)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-foreground">{formatDate(date.startDate, date.endDate)}</p>
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {date.time}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm">
                                      <Users className="w-4 h-4" />
                                      <span
                                        className={
                                          date.availableSpots === 0
                                            ? "text-destructive font-semibold"
                                            : date.availableSpots < 5
                                            ? "text-orange-500"
                                            : "text-muted-foreground"
                                        }
                                      >
                                        {date.availableSpots === 0 ? "Ausgebucht" : `${date.availableSpots} Plätze`}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                        {selectedLocation.dates.length > 0 &&
                          selectedLocation.dates.every((d) => d.availableSpots === 0) && (
                            <NotifyForm
                              slug={product.slug}
                              locationId={selectedLocation._id}
                              locationCity={selectedLocation.city}
                            />
                          )}
                      </CardContent>
                    </Card>
                  )}

                  {selectedDate && selectedDate.availableSpots > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          {t("practical.participantsCountTitle")}
                        </CardTitle>
                        <CardDescription>
                          {t("practical.participantsCountSubtitle")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={decrementParticipants}
                            disabled={participantCount <= 1}
                            aria-label="-"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-display text-2xl font-bold text-foreground w-10 text-center">
                            {participantCount}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={incrementParticipants}
                            disabled={participantCount >= maxTotalParticipants}
                            aria-label="+"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {participantCount > 1 && (
                          <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-foreground">
                              {t("practical.participantsCountDesc")}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {t("practical.participantsCountHint")}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Right column — summary & purchase */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    {t("practical.summary") || "Zusammenfassung"}
                  </CardTitle>
                  <CardDescription>{title}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {hasPromo && (
                      <span className="text-muted-foreground text-base line-through">
                        €{product.price.toFixed(2)}
                      </span>
                    )}
                    <span className="font-display text-3xl font-bold text-foreground">
                      €{grossOf(netPrice).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {product.priceUnit === "monthly"
                        ? t("pricing.perMonth") || "/ Monat"
                        : t("pricing.perPerson") || "/ Person"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("practical.courseNet") || "Netto"}: €{netPrice.toFixed(2)} + 19% MwSt.
                  </p>

                  {product.type === "normal" && participantCount > 1 && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {participantCount} × €{grossOf(netPrice).toFixed(2)}
                        </span>
                        <span className="font-semibold text-foreground">
                          €{(grossOf(netPrice) * participantCount).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("practical.totalForParticipants")}
                      </p>
                    </div>
                  )}

                  {product.type === "online" ? (
                    <Button className="w-full" size="lg" onClick={handleOnlineCheckout} disabled={isProcessing}>
                      {isProcessing ? "..." : t("products.enroll") || "Jetzt anmelden"}
                    </Button>
                  ) : (
                    <>
                      {selectedLocation && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-medium text-foreground">{selectedLocation.city}</p>
                          <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                        </div>
                      )}
                      {selectedDate && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-medium text-foreground">{formatDate(selectedDate.startDate, selectedDate.endDate)}</p>
                          <p className="text-sm text-muted-foreground">{selectedDate.time}</p>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        size="lg"
                        disabled={!selectedDate || isProcessing}
                        onClick={handlePracticalCheckout}
                      >
                        {isProcessing ? "..." : t("practical.toPayment") || "Zur Zahlung"}
                      </Button>
                      {!selectedDate && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {t("practical.selectDateWarn") || "Bitte Standort und Termin wählen"}
                        </p>
                      )}
                    </>
                  )}

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Sichere Zahlung mit Stripe</span>
                    </div>
                    {product.includesOnlineAccess && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award className="w-4 h-4 text-success" />
                        <span>{t("products.includesOnline") || "Inkl. Zugang zum Online-Kurs"}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
