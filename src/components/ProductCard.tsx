import { Link } from "react-router-dom";
import { Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product, localize, localizeList, currentPrice } from "@/types/product.types";
import { SealBadge, IconCertificate, IconForklift } from "@/components/BrandIcons";

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard = ({ product, className }: ProductCardProps) => {
  const { language, t } = useLanguage();

  const hasPromo = product.isPromoActive && product.promoPrice != null;
  const Icon = product.type === "online" ? IconCertificate : IconForklift;
  const title = localize(product.title, language);
  const shortDescription = localize(product.shortDescription, language);
  const benefits = localizeList(product.benefits, language).slice(0, 4);
  const price = currentPrice(product);

  return (
    <Link to={`/kursy/${product.slug}`} className={cn("block h-full", className)}>
      <div
        className={cn(
          "relative bg-card rounded-[2rem_0.75rem_2rem_0.75rem] p-6 shadow-xl border-2 overflow-hidden h-full flex flex-col transition-transform hover:-translate-y-1",
          product.featured ? "border-primary" : "border-border"
        )}
      >
        {hasPromo && (
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-xl text-sm font-medium">
            {t("pricing.promo") || "Promocja"}
          </div>
        )}

        <div className="text-center mb-6">
          <SealBadge tone={product.type === "online" ? "primary" : "dark"} rotate={-6} className="mx-auto mb-4">
            <Icon className="w-6 h-6 text-primary-foreground" />
          </SealBadge>
          <h3 className="font-display text-xl font-bold text-foreground mb-1">
            {title}
          </h3>
          <p className="text-sm text-primary font-medium mb-2">
            {product.type === "online"
              ? t("pricing.onlineLabel") || "Kurs online"
              : t("pricing.practicalLabel") || "Kurs praktyczny"}
          </p>
          {shortDescription && (
            <p className="text-muted-foreground text-sm mb-4">{shortDescription}</p>
          )}

          <div className="flex items-baseline justify-center gap-2 flex-wrap">
            {hasPromo && (
              <span className="text-muted-foreground text-lg line-through">
                €{product.price.toFixed(2)}
              </span>
            )}
            <span className="font-display text-4xl font-bold text-foreground">
              €{price.toFixed(2)}
            </span>
            <span className="text-muted-foreground text-sm">
              {product.priceUnit === "monthly"
                ? t("pricing.perMonth") || "/ Monat"
                : t("pricing.perPerson") || "/ Person"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("pricing.vatNote") || "zzgl. MwSt."}
          </p>
        </div>

        {benefits.length > 0 && (
          <div className="space-y-3 mb-6 flex-1">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-success-foreground" />
                </div>
                <span className="text-foreground text-xs">{benefit}</span>
              </div>
            ))}
          </div>
        )}

        <Button variant="hero" size="lg" className="w-full mt-auto">
          <Calendar className="w-4 h-4 mr-2" />
          {t("pricing.viewDetails") || "Details ansehen"} →
        </Button>
      </div>
    </Link>
  );
};

export default ProductCard;
