import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Loader2, MapPin, CalendarDays, Clock, CreditCard, Award,
  CheckCircle, ArrowLeft, Check, BellRing, Mail, Plus, Minus, ChevronDown, ShieldCheck,
} from "lucide-react";
import { Blob } from "@/components/SectionDecor";
import CourseLanguageFlags from "@/components/CourseLanguageFlags";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductBySlug, createNotifyRequest } from "@/api/product.api";
import { cn } from "@/lib/utils";
import {
  Product, ProductLocation, ProductLocationDate, CourseLanguage, COURSE_LANGUAGES,
  localize, localizeList, currentPrice, formatCourseDate, grossOf, formatEuro,
} from "@/types/product.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ADDITIONAL_PARTICIPANTS = 5;
/** Kod pod flagą; Ukraina jako UA, żeby nie myliło się z Wielką Brytanią */
const LANGUAGE_CODE_LABEL: Record<CourseLanguage, string> = {
  de: "DE", en: "EN", pl: "PL", uk: "UA", ru: "RU", ro: "RO",
};
/** Ile terminów widać od razu, reszta pod „Alle Termine anzeigen” */
const INITIAL_DATES = 5;

interface DateOption {
  date: ProductLocationDate;
  location: ProductLocation;
}

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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
      <div className="flex items-center gap-2 text-sm text-success bg-success/10 rounded-lg p-4">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span>{t("products.notifySuccess")}</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-muted/70">
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
        <Button type="submit" variant="outline" className="bg-background" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("products.notifyButton")}
        </Button>
      </form>
    </div>
  );
};

/** Opis kursu: na start kilka linijek, reszta po kliknięciu „Mehr lesen” */
const ExpandableText = ({ text, expanded, onToggle }: { text: string; expanded: boolean; onToggle: () => void }) => {
  const { t } = useLanguage();
  const ref = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div>
      <p ref={ref} className={cn("text-muted-foreground whitespace-pre-line", !expanded && "line-clamp-4")}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? t("products.readLess") : t("products.readMore")}
          <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
};

/** Zakładka lokalizacji, pokazywana tylko gdy kurs ma więcej niż jedno miasto */
const LocationTab = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "-mb-px border-b-2 px-1 pb-1.5 text-sm font-medium transition-colors",
      active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, t } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [locations, setLocations] = useState<ProductLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<DateOption | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<CourseLanguage | "all">("all");
  const [showAllDates, setShowAllDates] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  // Pasek z przyciskiem na dole ekranu (mobile) chowa się, gdy główny przycisk jest widoczny
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);

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

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [product, isLoading]);

  const showStickyBar = !!product && !ctaVisible;
  useEffect(() => {
    // Czat (prawy dolny róg) przesuwa się nad pasek, żeby go nie zasłaniał
    document.documentElement.style.setProperty("--cta-bar-h", showStickyBar ? "4.5rem" : "0px");
    return () => {
      document.documentElement.style.removeProperty("--cta-bar-h");
    };
  }, [showStickyBar]);

  // Wszystkie przyszłe terminy ze wszystkich lokalizacji, od najbliższego
  const allDates = useMemo<DateOption[]>(() => {
    const today = localToday();
    return locations
      .flatMap((location) =>
        location.dates
          .filter((date) => (date.endDate || date.startDate) >= today)
          .map((date) => ({ date, location }))
      )
      .sort((a, b) => a.date.startDate.localeCompare(b.date.startDate));
  }, [locations]);

  const availableLanguages = useMemo(
    () => COURSE_LANGUAGES.filter((code) => allDates.some(({ date }) => date.languages?.includes(code))),
    [allDates]
  );

  const filteredDates = allDates.filter(
    ({ date, location }) =>
      (locationFilter === "all" || location._id === locationFilter) &&
      (languageFilter === "all" || date.languages?.includes(languageFilter))
  );

  // Wybrany termin znika z listy po zmianie filtra, więc wybór też się kasuje
  useEffect(() => {
    if (selected && !filteredDates.some(({ date }) => date.id === selected.date.id)) setSelected(null);
  }, [filteredDates, selected]);

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

  const isOnline = product.type === "online";
  const title = localize(product.title, language);
  const description = localize(product.description, language);
  const shortDescription = localize(product.shortDescription, language);
  const benefits = localizeList(product.benefits, language).filter(Boolean);

  const netPrice = currentPrice(product);
  const grossPrice = grossOf(netPrice);
  const hasPromo = product.isPromoActive && product.promoPrice != null;

  const bookableDates = allDates.filter(({ date }) => date.availableSpots > 0);
  const visibleDates = showAllDates ? filteredDates : filteredDates.slice(0, INITIAL_DATES);
  // Przy jednej lokalizacji miasto nic nie mówi klientowi, więc go nie pokazujemy
  const multipleLocations = locations.length > 1;
  const filterLocation = locations.find((l) => l._id === locationFilter);

  // Maksymalna liczba uczestników łącznie: mniejsza z (1 + limit 5) i (dostępnych miejsc)
  const maxTotalParticipants = selected
    ? Math.max(1, Math.min(1 + MAX_ADDITIONAL_PARTICIPANTS, selected.date.availableSpots))
    : 1;
  const total = Math.round(grossPrice * participantCount * 100) / 100;

  const handleDateSelect = (option: DateOption) => {
    if (option.date.availableSpots === 0) return;
    setSelected(option);
    setParticipantCount(1);
  };

  const openCourseInfo = () => {
    setDescriptionOpen(true);
    document.getElementById("kursinfo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToDates = () => {
    document.getElementById("booking-dates")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOnlineCheckout = () => {
    setIsProcessing(true);
    navigate("/checkout", {
      state: {
        type: "online",
        productId: product._id,
        courseId: product.courseId,
        courseName: title,
        price: grossPrice,
        netPrice,
      },
    });
  };

  const handlePracticalCheckout = () => {
    if (!selected) {
      toast({
        title: t("common.error") || "Fehler",
        description: t("practical.selectDateWarn"),
        variant: "destructive",
      });
      scrollToDates();
      return;
    }

    const { location, date } = selected;
    setIsProcessing(true);
    navigate("/checkout", {
      state: {
        type: "practical",
        productId: product._id,
        courseName: title,
        price: total,
        practicalCourse: {
          locationId: location._id,
          locationName: location.city,
          locationAddress: location.address,
          dateId: date.id,
          startDate: date.startDate,
          endDate: date.endDate,
          time: date.time,
          availableSpots: date.availableSpots,
          basePrice: netPrice,
          price: total,
          participantCount,
        },
      },
    });
  };

  const spotsLabel = (spots: number) =>
    spots === 0
      ? t("products.soldOut")
      : (spots < 5 ? t("products.fewSpots") : t("products.spotsLeft")).replace("{n}", String(spots));

  // Nagłówek karty rezerwacji: cena oddzielona od wyboru miejsca, języka i terminu
  const priceBlock = (
    <div className="border-b border-border bg-muted/40 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            {hasPromo && (
              <span className="text-muted-foreground line-through">{formatEuro(grossOf(product.price))}</span>
            )}
            <span className="font-display text-3xl font-bold leading-none text-foreground">{formatEuro(grossPrice)}</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {product.priceUnit === "monthly" ? t("pricing.perMonth") : t("products.perPersonGross")}
            {" · "}
            {t("practical.courseNet") || "Netto"} {formatEuro(netPrice)}
          </p>
        </div>
        {hasPromo && (
          <span className="shrink-0 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-[hsl(var(--on-primary))]">
            {t("pricing.promo") || "Aktion"}
          </span>
        )}
      </div>
      {!isOnline && locations.length > 0 && (
        <p className="mt-3 flex items-start gap-1.5 text-sm">
          <MapPin className="mt-0.5 w-4 h-4 shrink-0 text-primary" aria-label={t("products.courseLocation")} />
          {multipleLocations ? (
            <span className="font-semibold text-foreground">{locations.map((l) => l.city).join(", ")}</span>
          ) : (
            <span>
              <span className="font-semibold text-foreground">{locations[0].city}</span>
              {locations[0].address && <span className="text-muted-foreground"> · {locations[0].address}</span>}
            </span>
          )}
        </p>
      )}
    </div>
  );

  const trustBlock = (
    <div className="space-y-2 pt-4 border-t border-border">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-success shrink-0" />
        {t("products.securePayment")}
      </p>
      {product.includesOnlineAccess && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Award className="w-4 h-4 text-success shrink-0" />
          {t("products.includesOnline") || "Inkl. Zugang zum Online-Kurs"}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative pt-20 md:pt-24 pb-24 overflow-hidden">
        <Blob tone="primary" className="w-[28rem] h-[28rem] -top-40 -right-40" />

        <div className="container mx-auto px-4 relative">
          <Link to="/kursy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 md:mb-6">
            <ArrowLeft className="w-4 h-4" />
            {t("products.backToList") || "Zurück zur Übersicht"}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-6 lg:gap-x-10">
            {/* Nagłówek: co to za kurs, gdzie i w jakich językach */}
            <header className="lg:col-span-7">
              {/* Mobile: zdjęcie na górze, żeby klient od razu wiedział, czego dotyczy kurs */}
              {product.thumbnailUrl && (
                <img
                  src={product.thumbnailUrl}
                  alt={title}
                  className="lg:hidden mb-4 w-full aspect-[16/9] object-cover rounded-xl border border-border"
                />
              )}
              <p className="text-sm text-primary font-semibold mb-0.5">
                {isOnline ? t("pricing.onlineLabel") : t("pricing.practicalLabel")}
              </p>
              <h1 className="font-display text-2xl md:text-4xl font-bold leading-tight text-foreground [text-wrap:balance]">{title}</h1>
              {shortDescription && (
                <p className="mt-3 text-muted-foreground md:text-lg">{shortDescription}</p>
              )}
              {!isOnline && multipleLocations && (
                <p className="mt-4 flex items-center gap-1.5 text-sm text-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {locations.map((l) => l.city).join(", ")}
                </p>
              )}

              {/* Mobile: najważniejsze punkty i skrót do pełnego opisu pod rezerwacją */}
              {(benefits.length > 0 || description) && (
                <div className="lg:hidden mt-4 space-y-2">
                  {benefits.length > 0 && (
                    <ul className="space-y-1.5">
                      {benefits.slice(0, 3).map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <Check className="w-4 h-4 mt-0.5 text-success shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={openCourseInfo}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary"
                  >
                    {t("products.seeDetails")}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </header>

            {/* Rezerwacja: na mobile zaraz pod tytułem, na desktopie po prawej */}
            <aside className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2">
              <div className="overflow-hidden rounded-[1.25rem_0.5rem_1.25rem_0.5rem] border-2 border-border bg-card shadow-sm">
                {priceBlock}
                <div className="space-y-4 p-4 sm:p-5">

                {!isOnline && (
                  <section id="booking-dates" className="scroll-mt-24 space-y-4">
                    <h2 className="font-display text-xl font-bold text-foreground">{t("products.datesTitle")}</h2>

                    {bookableDates.length === 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {locations.length === 0 ? t("products.noLocations") : t("products.noDates")}
                        </p>
                        <NotifyForm slug={product.slug} />
                      </>
                    ) : (
                      <>
                        {multipleLocations && (
                          <div className="flex flex-wrap gap-x-4 border-b border-border">
                            <LocationTab active={locationFilter === "all"} onClick={() => setLocationFilter("all")}>
                              {t("products.allLocations")}
                            </LocationTab>
                            {locations.map((l) => (
                              <LocationTab key={l._id} active={locationFilter === l._id} onClick={() => setLocationFilter(l._id)}>
                                {l.city}
                              </LocationTab>
                            ))}
                          </div>
                        )}

                        {/* Wybór języka jak przełącznik: „Alle” jest zaznaczone na start, więc widać, że to filtr */}
                        {availableLanguages.length > 1 && (
                          <div className="flex gap-1.5" role="radiogroup" aria-label={t("products.courseLanguage")}>
                            {(["all", ...availableLanguages] as const).map((code) => {
                              const active = languageFilter === code;
                              const name = code === "all" ? t("products.allLanguages") : t(`courseLang.${code}`);
                              return (
                                <button
                                  key={code}
                                  type="button"
                                  role="radio"
                                  aria-checked={active}
                                  aria-label={name}
                                  title={name}
                                  onClick={() => setLanguageFilter(code)}
                                  className={cn(
                                    "flex h-[3.25rem] min-w-0 flex-col items-center justify-center gap-1 rounded-md border-2 transition-colors",
                                    code === "all" ? "flex-[1.8] px-1" : "flex-1",
                                    active ? "border-primary bg-background" : "border-transparent bg-muted/60 hover:bg-muted"
                                  )}
                                >
                                  {code === "all" ? (
                                    <span className={cn("text-xs font-semibold", active ? "text-primary" : "text-foreground")}>
                                      {t("products.filterAll")}
                                    </span>
                                  ) : (
                                    <>
                                      <CourseLanguageFlags languages={[code]} size="lg" />
                                      <span
                                        className={cn(
                                          "text-[10px] font-semibold tracking-wide",
                                          active ? "text-primary" : "text-muted-foreground"
                                        )}
                                      >
                                        {LANGUAGE_CODE_LABEL[code]}
                                      </span>
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {filteredDates.length === 0 ? (
                          <p className="text-sm text-muted-foreground">{t("products.noDatesFilter")}</p>
                        ) : (
                          <div role="radiogroup" aria-label={t("products.datesTitle")} className="space-y-2">
                            {visibleDates.map((option) => {
                              const { date, location } = option;
                              const soldOut = date.availableSpots === 0;
                              const isSelected = selected?.date.id === date.id;
                              return (
                                <button
                                  key={`${location._id}-${date.id}`}
                                  type="button"
                                  role="radio"
                                  aria-checked={isSelected}
                                  disabled={soldOut}
                                  onClick={() => handleDateSelect(option)}
                                  className={cn(
                                    "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                                    soldOut && "opacity-50 cursor-not-allowed",
                                    isSelected
                                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                                      : !soldOut && "border-border hover:border-foreground/30 hover:bg-muted/40"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                                    )}
                                  >
                                    {isSelected && <Check className="w-3 h-3 text-[hsl(var(--on-primary))]" />}
                                  </span>
                                  <span className="flex-1 min-w-0">
                                    <span className="block font-semibold text-sm text-foreground">
                                      {formatCourseDate(date.startDate, date.endDate, language)}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                      {multipleLocations && (
                                        <>
                                          <MapPin className="w-3 h-3 shrink-0" />
                                          <span className="mr-1">{location.city}</span>
                                        </>
                                      )}
                                      <Clock className="w-3 h-3 shrink-0" />
                                      {date.time}
                                    </span>
                                  </span>
                                  <span className="flex flex-col items-end gap-1 shrink-0">
                                    <CourseLanguageFlags languages={date.languages ?? []} size="md" />
                                    <span
                                      className={cn(
                                        "text-xs",
                                        soldOut ? "text-destructive font-semibold" : date.availableSpots < 5 ? "text-primary font-semibold" : "text-muted-foreground"
                                      )}
                                    >
                                      {spotsLabel(date.availableSpots)}
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                            {!showAllDates && filteredDates.length > INITIAL_DATES && (
                              <button
                                type="button"
                                onClick={() => setShowAllDates(true)}
                                className="w-full inline-flex items-center justify-center gap-1 rounded-lg py-2 text-sm font-semibold text-primary hover:bg-primary/5"
                              >
                                {t("products.showAllDates").replace("{n}", String(filteredDates.length))}
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}

                        {!selected &&
                          (showNotify ? (
                            <NotifyForm
                              slug={product.slug}
                              locationId={filterLocation?._id}
                              locationCity={filterLocation?.city}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowNotify(true)}
                              aria-expanded={false}
                              className="flex w-full items-center gap-3 rounded-lg bg-muted/70 px-4 py-3 text-left transition-colors hover:bg-muted"
                            >
                              <BellRing className="w-5 h-5 shrink-0 text-primary" />
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-semibold text-foreground">{t("products.notifyTitle")}</span>
                                <span className="block text-xs text-muted-foreground">{t("products.notifyShort")}</span>
                              </span>
                              <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                            </button>
                          ))}
                      </>
                    )}
                  </section>
                )}

                {selected && (
                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t("products.participants")}</p>
                        <p className="text-xs text-muted-foreground">{t("practical.participantsCountDesc")}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setParticipantCount((c) => Math.max(1, c - 1))}
                          disabled={participantCount <= 1}
                          aria-label="-"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-display text-xl font-bold text-foreground w-6 text-center" aria-live="polite">
                          {participantCount}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setParticipantCount((c) => Math.min(maxTotalParticipants, c + 1))}
                          disabled={participantCount >= maxTotalParticipants}
                          aria-label="+"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {participantCount > 1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {participantCount} × {formatEuro(grossPrice)}
                        </span>
                        <span className="font-semibold text-foreground">
                          {t("products.total")}: {formatEuro(total)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div ref={ctaRef} className="hidden lg:block">
                  {isOnline ? (
                    <Button variant="hero" className="w-full" size="lg" onClick={handleOnlineCheckout} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : t("products.enroll")}
                    </Button>
                  ) : (
                    bookableDates.length > 0 && (
                      <Button
                        variant="hero"
                        className="w-full"
                        size="lg"
                        disabled={isProcessing}
                        onClick={selected ? handlePracticalCheckout : scrollToDates}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : selected ? (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            {t("practical.toPayment")}
                          </>
                        ) : (
                          t("products.pickDateFirst")
                        )}
                      </Button>
                    )
                  )}
                </div>

                {trustBlock}
                </div>
              </div>
            </aside>

            {/* Szczegóły: zdjęcie, opis (zwijany) i co jest w cenie */}
            <div id="kursinfo" className="lg:col-span-7 space-y-6 scroll-mt-20">
              {product.thumbnailUrl && (
                <img
                  src={product.thumbnailUrl}
                  alt={title}
                  className="hidden lg:block w-full h-64 object-cover rounded-2xl border border-border"
                />
              )}

              {benefits.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-bold text-foreground mb-3">
                    {t("products.included") || "Im Preis enthalten"}
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success">
                          <Check className="w-2.5 h-2.5 text-success-foreground" />
                        </span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {description && (
                <section>
                  <h2 className="font-display text-xl font-bold text-foreground mb-3">{t("products.aboutCourse")}</h2>
                  <ExpandableText
                    text={description}
                    expanded={descriptionOpen}
                    onToggle={() => setDescriptionOpen((v) => !v)}
                  />
                </section>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Cena i przycisk: na mobile zawsze widoczne, na desktopie gdy przycisk w karcie zniknie z ekranu */}
      {showStickyBar && (isOnline || bookableDates.length > 0) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="container mx-auto flex items-center justify-between gap-3 px-0 sm:px-4">
            <div className="min-w-0">
              <p className="font-display text-xl font-bold leading-none text-foreground">
                {formatEuro(selected ? total : grossPrice)}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {selected
                  ? `${formatCourseDate(selected.date.startDate, selected.date.endDate, language)}${multipleLocations ? ` · ${selected.location.city}` : ""}`
                  : t("products.perPersonGross")}
              </p>
            </div>
            <Button
              variant="hero"
              size="lg"
              className="shrink-0"
              disabled={isProcessing}
              onClick={isOnline ? handleOnlineCheckout : selected ? handlePracticalCheckout : scrollToDates}
            >
              {isOnline ? t("products.enroll") : selected ? t("practical.toPayment") : t("products.pickDateFirst")}
            </Button>
          </div>
        </div>
      )}

      <Footer />
      {/* Miejsce na dolny pasek, żeby nie zasłaniał końca stopki */}
      {showStickyBar && <div aria-hidden className="h-20 bg-industrial" />}
    </div>
  );
};

export default ProductDetail;
