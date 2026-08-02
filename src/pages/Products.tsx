import { useEffect, useState } from "react";
import { Loader2, PackageSearch, Search, FileSearch, MapPin, CalendarCheck, CreditCard, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProducts } from "@/api/product.api";
import { Product, ProductType } from "@/types/product.types";
import { SealBadge } from "@/components/BrandIcons";
import { Blob } from "@/components/SectionDecor";

type FilterValue = "all" | ProductType;

const Products = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getProducts()
      .then((data) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Fehler beim Laden der Kurse");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = products.filter((p) => filter === "all" || p.type === filter);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="relative flex-1 pt-24 pb-16 overflow-hidden">
        <Blob tone="primary" className="w-[32rem] h-[32rem] -top-40 -right-40" />
        <Blob tone="accent" className="w-80 h-80 bottom-0 -left-32" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t("products.title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("products.subtitle")}
            </p>
          </div>

          {/* How it works */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-primary mb-5">
              {t("products.howItWorksTitle")}
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2 sm:gap-0">
              {[
                { icon: Search, label: t("products.step1") },
                { icon: FileSearch, label: t("products.step2") },
                { icon: MapPin, label: t("products.step3") },
                { icon: CalendarCheck, label: t("products.step4") },
                { icon: CreditCard, label: t("products.step5") },
              ].map((step, i, arr) => (
                <div key={i} className="flex items-center sm:flex-1">
                  <div className="flex flex-col items-center gap-2 flex-1 px-2">
                    <SealBadge size="sm" tone={i % 2 === 0 ? "primary" : "dark"} rotate={i % 2 === 0 ? -6 : 6}>
                      <step.icon className="w-5 h-5 text-primary-foreground" />
                    </SealBadge>
                    <span className="text-xs sm:text-sm font-medium text-foreground text-center">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ChevronRight className="hidden sm:block w-5 h-5 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {(["all", "normal", "online"] as FilterValue[]).map((value) => (
              <Button
                key={value}
                variant={filter === value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(value)}
              >
                {value === "all"
                  ? t("products.filterAll") || "Alle"
                  : value === "normal"
                  ? t("products.filterPractical") || "Praxiskurse"
                  : t("products.filterOnline") || "Online-Kurse"}
              </Button>
            ))}
          </div>

          {isLoading && (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center py-24 text-muted-foreground">{error}</div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-4">
              <PackageSearch className="w-12 h-12 opacity-50" />
              <p>{t("products.empty") || "Aktuell sind keine Kurse verfügbar."}</p>
            </div>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
              {filtered.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
