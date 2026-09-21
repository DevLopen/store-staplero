/**
 * Migruje dzisiejsze (zahardkodowane w Index.tsx) karty karuzeli do realnych
 * rekordów Product w bazie, żeby admin mógł je dalej edytować z panelu.
 *
 * Uruchom: npx ts-node src/scripts/seedProducts.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Product from "../models/Product";
import Location from "../models/Location";

const COLORS = { reset: "\x1b[0m", green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m" };
const ok = (m: string) => console.log(`${COLORS.green}✅ ${m}${COLORS.reset}`);
const warn = (m: string) => console.log(`${COLORS.yellow}⚠️  ${m}${COLORS.reset}`);
const err = (m: string) => console.log(`${COLORS.red}❌ ${m}${COLORS.reset}`);

async function run() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/staplerschein";
  await mongoose.connect(MONGO_URI);
  ok(`Verbunden mit ${MONGO_URI}`);

  // Wszystkie aktywne lokalizacje przypisujemy do produktu praktycznego,
  // żeby zachować dotychczasowe zachowanie (wybór dowolnej lokalizacji).
  const activeLocations = await Location.find({ isActive: true }).select("_id").lean();
  const locationIds = activeLocations.map((l) => l._id.toString());

  const existingPractical = await Product.findOne({ slug: "basis-ausbildung-frontstapler" });
  if (existingPractical) {
    warn("Produkt 'basis-ausbildung-frontstapler' existiert bereits — übersprungen.");
  } else {
    await Product.create({
      slug: "basis-ausbildung-frontstapler",
      type: "normal",
      title: {
        de: "Basis-Ausbildung Frontstapler",
        en: "Basic Training Counterbalance Forklift",
        uk: "Базове навчання на фронтальний навантажувач",
        pl: "Szkolenie podstawowe – wózek czołowy",
      },
      shortDescription: {
        de: "Theorie & Praxis + Prüfungen",
        en: "Theory & practice + exams",
        uk: "Теорія та практика + іспити",
        pl: "Teoria i praktyka + egzaminy",
      },
      description: {
        de: "Vollständige Staplerausbildung (Stufe 1) gemäß DGUV Vorschrift 68 und DGUV Grundsatz 308-001. Inklusive Theorie, praktischer Ausbildung und Prüfungen vor Ort.",
        en: "",
        uk: "",
        pl: "",
      },
      benefits: {
        de: ["Theorie inklusive", "Praxis inklusive", "Schriftliche & praktische Prüfung"],
        en: [], uk: [], pl: [],
      },
      price: 279.99,
      isPromoActive: false,
      priceUnit: "person",
      status: "active",
      featured: true,
      order: 1,
      locationIds,
      includesOnlineAccess: false,
    });
    ok("Produkt 'basis-ausbildung-frontstapler' erstellt.");
  }

  const existingOnline = await Product.findOne({ slug: "online-theoriekurs" });
  if (existingOnline) {
    warn("Produkt 'online-theoriekurs' existiert bereits — übersprungen.");
  } else {
    await Product.create({
      slug: "online-theoriekurs",
      type: "online",
      title: { de: "Online-Theoriekurs", en: "Online Theory Course", uk: "Онлайн курс теорії", pl: "Kurs teorii online" },
      shortDescription: { de: "", en: "", uk: "", pl: "" },
      description: { de: "", en: "", uk: "", pl: "" },
      benefits: { de: [], en: [], uk: [], pl: [] },
      price: 49,
      isPromoActive: false,
      priceUnit: "monthly",
      status: "draft", // było "coming soon" — pozostawiamy jako draft do czasu podpięcia treści kursu
      featured: true,
      order: 2,
      locationIds: [],
      includesOnlineAccess: false,
    });
    ok("Produkt 'online-theoriekurs' erstellt (als Entwurf, da noch kein Kursinhalt verknüpft ist).");
  }

  await mongoose.disconnect();
  ok("Fertig.");
}

run().catch((e) => {
  err(e.message || String(e));
  process.exit(1);
});
