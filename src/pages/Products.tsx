import { useEffect, useState } from "react";
import { Loader2, PackageSearch, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProducts } from "@/api/product.api";
import { Product, ProductType } from "@/types/product.types";
import { cn } from "@/lib/utils";
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

  const filterOptions = [
    { value: "all" as FilterValue, label: t("products.filterAll"), count: products.length },
    { value: "normal" as FilterValue, label: t("products.filterPractical"), count: products.filter((p) => p.type === "normal").length },
    { value: "online" as FilterValue, label: t("products.filterOnline"), count: products.filter((p) => p.type === "online").length },
  ].filter((o) => o.value === "all" || o.count > 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="relative flex-1 pt-24 pb-16 overflow-hidden">
        <Blob tone="primary" className="w-[32rem] h-[32rem] -top-40 -right-40" />
        <Blob tone="accent" className="w-80 h-80 bottom-0 -left-32" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-2 [text-wrap:balance]">
              {t("products.title")}
            </h1>
            <p className="text-muted-foreground md:text-lg">
              {t("products.subtitle")}
            </p>
          </div>

          {/* Jak to działa: jedna linia, żeby kursy było widać od razu po wejściu */}
          <ol
            aria-label={t("products.howItWorksTitle")}
            className="mb-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground"
          >
            {[t("products.step1"), t("products.step4"), t("products.step5")].map((label, i, arr) => (
              <li key={i} className="flex items-center gap-2">
                <span className="font-medium text-foreground">{label}</span>
                {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5" aria-hidden />}
              </li>
            ))}
          </ol>

          {/* Przełącznik typów tylko wtedy, gdy w ofercie są oba typy kursów */}
          {filterOptions.length > 2 && (
            <div className="mb-6 flex justify-center">
              <div role="tablist" className="inline-flex rounded-lg bg-muted p-1">
                {filterOptions.map(({ value, label, count }) => {
                  const active = filter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFilter(value)}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {label}
                      <span className={cn("ml-1.5 text-xs", active ? "text-primary" : "text-muted-foreground")}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
            // Kolumny o stałej szerokości, wyśrodkowane: przy 2 kursach nie zostaje pusta trzecia kolumna
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),25rem))] justify-center gap-4 lg:gap-5 max-w-6xl mx-auto items-stretch">
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
