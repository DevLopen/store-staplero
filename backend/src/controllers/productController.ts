import { Request, Response } from "express";
import Product from "../models/Product";
import Location from "../models/Location";
import { effectiveLanguages, placeName } from "../utils/courseLocation";

const LANGUAGE_ORDER = ["de", "en", "pl", "uk", "ru", "ro"];
const sortLanguages = (codes: string[]) =>
  [...new Set(codes)].sort((a, b) => LANGUAGE_ORDER.indexOf(a) - LANGUAGE_ORDER.indexOf(b));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (input: string): string =>
  input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[ąàáâä]/g, "a")
    .replace(/[ćčç]/g, "c")
    .replace(/[ęèéêë]/g, "e")
    .replace(/[łl]/g, "l")
    .replace(/[ńñ]/g, "n")
    .replace(/[óòôö]/g, "o")
    .replace(/[śšş]/g, "s")
    .replace(/[żźž]/g, "z")
    .replace(/[üùúû]/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const ensureUniqueSlug = async (base: string, excludeId?: string): Promise<string> => {
  let slug = slugify(base) || `produkt-${Date.now()}`;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query: any = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Product.findOne(query).lean();
    if (!existing) return slug;
    counter += 1;
    slug = `${slugify(base)}-${counter}`;
  }
};

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

export const getPublicProducts = async (req: Request, res: Response) => {
  try {
    const { type, featured } = req.query;
    const filter: any = { status: "active" };
    if (type === "online" || type === "normal") filter.type = type;
    if (featured === "true") filter.featured = true;

    const products = await Product.find(filter).sort({ order: 1, createdAt: -1 }).lean();

    // Kafelek pokazuje najbliższy wolny termin i języki, więc klient widzi je już na liście
    const locationIds = [...new Set(products.flatMap((p) => p.locationIds || []))];
    const locations = locationIds.length
      ? await Location.find({ _id: { $in: locationIds }, isActive: true }).lean()
      : [];
    const today = new Date().toISOString().slice(0, 10);

    const withSchedule = products.map((p) => {
      if (p.type !== "normal") return p;
      const productLocations = locations.filter((l) => p.locationIds.includes(String(l._id)));
      const dates = productLocations
        .flatMap((l) =>
          l.dates
            .filter((d) => d.availableSpots > 0 && d.startDate >= today)
            .map((d) => ({
              startDate: d.startDate,
              city: placeName(l.address, l.city),
              languages: sortLanguages(effectiveLanguages(d.languages, l.city)),
            }))
        )
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      return {
        ...p,
        nextDate: dates[0] || null,
        languages: sortLanguages(dates.flatMap((d) => d.languages)),
      };
    });

    res.json({ products: withSchedule });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getPublicProductBySlug = async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: "active" }).lean();
    if (!product) return res.status(404).json({ message: "Produkt nie znaleziony" });

    let locations: any[] = [];
    if (product.type === "normal" && product.locationIds?.length) {
      const raw = await Location.find({
        _id: { $in: product.locationIds },
        isActive: true,
      }).lean();
      // Klient widzi miejsce (miasto z adresu) i języki terminów, a nie wewnętrzną nazwę wariantu
      locations = raw.map((l) => ({
        ...l,
        place: placeName(l.address, l.city),
        dates: l.dates.map((d) => ({ ...d, languages: sortLanguages(effectiveLanguages(d.languages, l.city)) })),
      }));
    }

    res.json({ product, locations });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const adminGetProducts = async (_req: Request, res: Response) => {
  try {
    const products = await Product.find({}).sort({ order: 1, createdAt: -1 }).lean();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const adminGetProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) return res.status(404).json({ message: "Produkt nie znaleziony" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const adminCreateProduct = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.title?.de && !body.title?.en && !body.title?.pl && !body.title?.uk) {
      return res.status(400).json({ message: "Podaj tytuł produktu przynajmniej w jednym języku" });
    }
    if (!body.type || !["online", "normal"].includes(body.type)) {
      return res.status(400).json({ message: "Nieprawidłowy typ produktu" });
    }
    if (body.price == null) {
      return res.status(400).json({ message: "Cena jest wymagana" });
    }

    const baseForSlug = body.slug || body.title?.de || body.title?.en || body.title?.pl || body.title?.uk;
    const slug = await ensureUniqueSlug(baseForSlug);
    // Nowy produkt trafia na koniec listy, chyba że admin poda kolejność
    const last = await Product.findOne({}).sort({ order: -1 }).select("order").lean();

    const product = await Product.create({
      slug,
      type: body.type,
      title: body.title,
      shortDescription: body.shortDescription ?? {},
      description: body.description ?? {},
      benefits: body.benefits ?? {},
      thumbnailUrl: body.thumbnailUrl,
      gallery: body.gallery ?? [],
      price: body.price,
      promoPrice: body.promoPrice,
      isPromoActive: !!body.isPromoActive,
      priceUnit: body.priceUnit ?? "person",
      status: body.status ?? "draft",
      featured: !!body.featured,
      order: body.order ?? (last ? last.order + 1 : 0),
      courseId: body.courseId,
      locationIds: body.locationIds ?? [],
      includesOnlineAccess: !!body.includesOnlineAccess,
      linkedCourseId: body.linkedCourseId,
    });

    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Server error", error: err });
  }
};

export const adminUpdateProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const body = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Produkt nie znaleziony" });

    if (body.slug && body.slug !== product.slug) {
      product.slug = await ensureUniqueSlug(body.slug, productId);
    }

    const fields = [
      "type", "title", "shortDescription", "description", "benefits",
      "thumbnailUrl", "gallery", "price", "promoPrice", "isPromoActive",
      "priceUnit", "status", "featured", "order", "courseId",
      "locationIds", "includesOnlineAccess", "linkedCourseId",
    ] as const;

    fields.forEach((field) => {
      if (body[field] !== undefined) {
        (product as any)[field] = body[field];
      }
    });

    await product.save();
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Server error", error: err });
  }
};

/** Zapisuje kolejność produktów na liście: body.ids w docelowej kolejności */
export const adminReorderProducts = async (req: Request, res: Response) => {
  try {
    const ids: unknown = req.body?.ids;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
      return res.status(400).json({ message: "Nieprawidłowa lista produktów" });
    }
    await Product.bulkWrite(
      ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index } } } }))
    );
    res.json({ message: "Kolejność zapisana" });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Server error", error: err });
  }
};

export const adminDeleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) return res.status(404).json({ message: "Produkt nie znaleziony" });
    res.json({ message: "Produkt usunięty" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
