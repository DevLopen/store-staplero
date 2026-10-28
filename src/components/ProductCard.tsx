import { Link } from "react-router-dom";
import { Check, CalendarDays, ArrowRight, MonitorPlay } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Product, localize, localizeList, currentPrice, formatCourseDate, grossOf, formatEuro,
} from "@/types/product.types";
import CourseLanguageFlags from "@/components/CourseLanguageFlags";

interface ProductCardProps {
  product: Product;
  className?: string;
}

/**
 * Kafelek kursu. Kursów jest niewiele, więc kafelek jest pełny także na telefonie:
 * duży tytuł, opis, korzyści, najbliższy termin z językami, cena i przycisk.
 */
const ProductCard = ({ product, className }: ProductCardProps) => {
  const { language, t } = useLanguage();

  const hasPromo = product.isPromoActive && product.promoPrice != null;
  const isOnline = product.type === "online";
  const title = localize(product.title, language);
  const shortDescription = localize(product.shortDescription, language);
  const benefits = localizeList(product.benefits, language).filter(Boolean).slice(0, 4);
  const price = grossOf(currentPrice(product));
  const nextDate = product.nextDate;

  return (
    <Link
      to={`/kursy/${product.slug}`}
      className={cn(
        "group relative flex h-full flex-col gap-4 overflow-hidden bg-card p-5 sm:p-6 border-2 border-border shadow-sm transition-all hover:border-primary hover:shadow-lg hover:-translate-y-0.5",
        "rounded-[1.25rem_0.5rem_1.25rem_0.5rem]",
        className
      )}
    >
      {hasPromo && (
        <span className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg text-xs font-semibold">
          {t("pricing.promo") || "Aktion"}
        </span>
      )}

      <div className="pr-14">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
          {isOnline ? t("pricing.onlineLabel") : t("pricing.practicalLabel")}
        </p>
        <h3 className="font-display text-2xl sm:text-[1.75rem] font-bold uppercase leading-[1.05] text-foreground [text-wrap:balance]">
          {title}
        </h3>
      </div>

      {shortDescription && <p className="text-muted-foreground">{shortDescription}</p>}

      {benefits.length > 0 && (
        <ul className="space-y-2">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 mt-0.5 text-success shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto space-y-4">
        <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
          {isOnline ? (
            <span className="flex items-center gap-2 text-foreground">
              <MonitorPlay className="w-4 h-4 text-primary shrink-0" />
              {t("products.onlineAnytime")}
            </span>
          ) : nextDate ? (
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[11px] leading-tight text-muted-foreground">
                    {t("products.nextDate")}
                  </span>
                  <span className="block truncate font-semibold text-foreground">
                    {formatCourseDate(nextDate.startDate, nextDate.startDate, language)}
                    <span className="font-normal text-muted-foreground"> · {nextDate.city}</span>
                  </span>
                </span>
              </span>
              <CourseLanguageFlags languages={product.languages ?? []} max={3} size="md" className="shrink-0" />
            </div>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4 shrink-0" />
              {t("products.noDatesShort")}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            {hasPromo && (
              <span className="text-muted-foreground line-through">{formatEuro(grossOf(product.price))}</span>
            )}
            <span className="font-display text-3xl font-bold leading-none text-foreground">{formatEuro(price)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.priceUnit === "monthly" ? t("pricing.perMonth") : t("products.perPersonGross")}
          </p>
        </div>

        <span className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-semibold text-[hsl(var(--on-primary))] transition-colors group-hover:bg-primary/90">
          {nextDate ? t("products.pickDateFirst") : t("pricing.viewDetails")}
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
};

export default ProductCard;
