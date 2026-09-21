export type ProductType = "online" | "normal";
export type ProductStatus = "draft" | "active";
export type PriceUnit = "person" | "monthly";

export interface LocalizedText {
  de: string;
  en: string;
  uk: string;
  pl: string;
}

export interface LocalizedList {
  de: string[];
  en: string[];
  uk: string[];
  pl: string[];
}

export interface Product {
  _id: string;
  slug: string;
  type: ProductType;

  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  benefits: LocalizedList;

  thumbnailUrl?: string;
  gallery: string[];

  price: number;
  promoPrice?: number;
  isPromoActive: boolean;
  priceUnit: PriceUnit;

  status: ProductStatus;
  featured: boolean;
  order: number;

  courseId?: string;

  locationIds: string[];
  includesOnlineAccess: boolean;
  linkedCourseId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ProductLocationDate {
  id: string;
  startDate: string;
  endDate: string;
  time: string;
  availableSpots: number;
}

export interface ProductLocation {
  _id: string;
  city: string;
  address: string;
  isActive: boolean;
  price: number;
  dates: ProductLocationDate[];
}

export const emptyLocalizedText = (): LocalizedText => ({ de: "", en: "", uk: "", pl: "" });
export const emptyLocalizedList = (): LocalizedList => ({ de: [], en: [], uk: [], pl: [] });

/** Zwraca wartość dla danego języka z fallbackiem do niemieckiego / pierwszego niepustego */
export function localize(text: LocalizedText | undefined, lang: string): string {
  if (!text) return "";
  const val = (text as any)[lang];
  if (val) return val;
  return text.de || text.en || text.pl || text.uk || "";
}

export function localizeList(list: LocalizedList | undefined, lang: string): string[] {
  if (!list) return [];
  const val = (list as any)[lang];
  if (val && val.length) return val;
  return list.de.length ? list.de : list.en.length ? list.en : list.pl.length ? list.pl : list.uk;
}

/** Aktualna cena produktu (promocyjna jeśli aktywna) */
export function currentPrice(product: Product): number {
  return product.isPromoActive && product.promoPrice != null ? product.promoPrice : product.price;
}
