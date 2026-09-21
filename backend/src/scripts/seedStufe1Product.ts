/**
 * Dodaje produkt "Staplerschein Stufe 1: Theorie & Praxis" (kurs 2-dniowy, dawny /practical-course)
 * z opisami w 4 językach (de, en, uk, pl). Skrypt jest idempotentny: jeśli produkt o danym slugu
 * już istnieje, nic nie zmienia (chyba że podasz --update).
 *
 * Uruchom (w katalogu backend):
 *   npx ts-node src/scripts/seedStufe1Product.ts --dry-run        # tylko wypisz dane, bez bazy
 *   npx ts-node src/scripts/seedStufe1Product.ts                  # utwórz produkt (status: active)
 *   npx ts-node src/scripts/seedStufe1Product.ts --draft          # utwórz jako szkic
 *   npx ts-node src/scripts/seedStufe1Product.ts --price=289.99   # inna cena netto
 *   npx ts-node src/scripts/seedStufe1Product.ts --update         # nadpisz istniejący produkt
 *
 * Cena jest NETTO za osobę. Do produktu przypisywane są wszystkie aktywne lokalizacje.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Product from "../models/Product";
import Location from "../models/Location";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

const SLUG = opt("slug") || "staplerschein-stufe-1-theorie-praxis";
// Cena netto za osobę: 279,99 € netto (+ 19% MwSt.)
const PRICE = opt("price") ? Number(opt("price")) : 279.99;

const data = {
  slug: SLUG,
  type: "normal" as const,

  title: {
    de: "Staplerschein Stufe 1: Theorie & Praxis",
    en: "Forklift License Level 1: Theory & Practice",
    uk: "Права на навантажувач, рівень 1: теорія та практика",
    pl: "Uprawnienia na wózek widłowy Stufe 1: teoria i praktyka",
  },

  shortDescription: {
    de: "2 Tage Intensivkurs mit Theorie, Praxis und Prüfungen",
    en: "2-day intensive course with theory, practice and exams",
    uk: "Інтенсивний курс на 2 дні: теорія, практика та іспити",
    pl: "Intensywny kurs 2 dni: teoria, praktyka i egzaminy",
  },

  description: {
    de: [
      "Vollständige Staplerausbildung Stufe 1 (Frontgabelstapler und Mitgänger) nach DGUV Vorschrift 68 und DGUV Grundsatz 308-001. In 2 Tagen zum anerkannten Staplerschein.",
      "Tag 1: Theorie mit schriftlicher Prüfung. Tag 2: Praxis mit Fahrprüfung.",
      "Inhalte: Rechtsgrundlagen, Maßnahmen zur Unfallverhütung, Einsatzprüfung, Fahrverhalten und Fahrzeugcharakteristik, Sicherheitsregeln im Umgang mit Lasten, praktisches Fahren sowie theoretische und praktische Prüfungen.",
      "Prüfungsgebühren und Schulungsmaterial sind im Preis enthalten. Sie erhalten ein anerkanntes Zertifikat, digital als PDF sowie für Apple Wallet und Google Wallet.",
      "Bitte mitbringen: gültigen Ausweis, Passfoto und Sicherheitsschuhe.",
    ].join("\n\n"),

    en: [
      "Complete forklift training Level 1 (counterbalance forklift and pedestrian-operated truck) according to DGUV Regulation 68 and DGUV Principle 308-001. Get your recognized German forklift license in 2 days.",
      "Day 1: theory with a written exam. Day 2: practical training with a driving test.",
      "Topics: legal foundations, accident prevention measures, operational inspection, driving behavior and vehicle characteristics, safety rules for handling loads, practical driving, and theoretical and practical examinations.",
      "Exam fees and training materials are included in the price. You receive a recognized certificate, digitally as a PDF and for Apple Wallet and Google Wallet.",
      "Please bring: a valid ID, a passport photo and safety shoes.",
    ].join("\n\n"),

    uk: [
      "Повне навчання водія навантажувача, рівень 1 (фронтальний навантажувач і штабелер з ручним керуванням) відповідно до DGUV Vorschrift 68 та DGUV Grundsatz 308-001. За 2 дні до визнаного німецького посвідчення (Staplerschein).",
      "День 1: теорія та письмовий іспит. День 2: практика та іспит з водіння.",
      "Теми: правові основи, заходи з попередження нещасних випадків, перевірка перед використанням, поведінка та характеристики транспортного засобу, правила безпеки під час роботи з вантажами, практична їзда, теоретичні та практичні іспити.",
      "Екзаменаційні збори та навчальні матеріали включені в ціну. Ви отримуєте визнаний сертифікат у цифровому вигляді: PDF, а також для Apple Wallet і Google Wallet.",
      "Візьміть із собою: чинний документ, що посвідчує особу, фото на паспорт і захисне взуття.",
    ].join("\n\n"),

    pl: [
      "Pełne szkolenie operatora wózka widłowego Stufe 1 (wózek czołowy i wózek prowadzony) zgodnie z DGUV Vorschrift 68 i DGUV Grundsatz 308-001. W 2 dni do uznawanych w Niemczech uprawnień (Staplerschein).",
      "Dzień 1: teoria i egzamin pisemny. Dzień 2: praktyka i egzamin z jazdy.",
      "Zakres: podstawy prawne, środki zapobiegania wypadkom, kontrola przed użyciem, zachowanie i charakterystyka pojazdu, zasady bezpieczeństwa przy pracy z ładunkiem, jazda praktyczna oraz egzaminy teoretyczne i praktyczne.",
      "Opłaty egzaminacyjne i materiały szkoleniowe są wliczone w cenę. Otrzymujesz uznawany certyfikat w wersji cyfrowej: PDF oraz dla Apple Wallet i Google Wallet.",
      "Zabierz ze sobą: ważny dokument tożsamości, zdjęcie paszportowe i buty ochronne.",
    ].join("\n\n"),
  },

  benefits: {
    de: [
      "2 Tage Intensivkurs",
      "Theorie und Praxis",
      "Schriftliche Prüfung und Fahrprüfung",
      "Anerkannter Staplerschein nach DGUV Vorschrift 68",
      "Prüfungsgebühren und Schulungsmaterial inklusive",
      "Digitales Zertifikat (PDF, Apple Wallet, Google Wallet)",
    ],
    en: [
      "2-day intensive course",
      "Theory and practice",
      "Written exam and driving test",
      "Recognized forklift license per DGUV Regulation 68",
      "Exam fees and training materials included",
      "Digital certificate (PDF, Apple Wallet, Google Wallet)",
    ],
    uk: [
      "Інтенсивний курс на 2 дні",
      "Теорія і практика",
      "Письмовий іспит та іспит з водіння",
      "Визнане посвідчення за DGUV Vorschrift 68",
      "Екзаменаційні збори та матеріали включені",
      "Цифровий сертифікат (PDF, Apple Wallet, Google Wallet)",
    ],
    pl: [
      "Intensywny kurs 2 dni",
      "Teoria i praktyka",
      "Egzamin pisemny i egzamin z jazdy",
      "Uznawane uprawnienia zgodne z DGUV Vorschrift 68",
      "Opłaty egzaminacyjne i materiały w cenie",
      "Certyfikat cyfrowy (PDF, Apple Wallet, Google Wallet)",
    ],
  },

  price: PRICE,
  isPromoActive: false,
  priceUnit: "person" as const,
  status: (flag("draft") ? "draft" : "active") as "draft" | "active",
  featured: true,
  order: 1,
  includesOnlineAccess: false,
};

const COLORS = { reset: "\x1b[0m", green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m" };
const ok = (m: string) => console.log(`${COLORS.green}✅ ${m}${COLORS.reset}`);
const warn = (m: string) => console.log(`${COLORS.yellow}⚠️  ${m}${COLORS.reset}`);
const err = (m: string) => console.log(`${COLORS.red}❌ ${m}${COLORS.reset}`);

async function run() {
  if (!Number.isFinite(PRICE) || PRICE < 0) throw new Error(`Ungültiger Preis: ${opt("price")}`);

  if (flag("dry-run")) {
    console.log(JSON.stringify({ ...data, locationIds: "<alle aktiven Standorte>" }, null, 2));
    return;
  }

  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/staplerschein";
  await mongoose.connect(MONGO_URI);
  ok(`Verbunden mit ${MONGO_URI}`);

  const activeLocations = await Location.find({ isActive: true }).select("_id city").lean();
  const locationIds = activeLocations.map((l) => l._id.toString());
  if (locationIds.length === 0) warn("Keine aktiven Standorte gefunden: Produkt hat keine Standorte/Termine.");
  else ok(`Standorte: ${activeLocations.map((l) => l.city).join(", ")}`);

  // Podobny produkt z wcześniejszego seedProducts.ts — ostrzegamy przed dublem na liście
  const legacy = await Product.findOne({ slug: "basis-ausbildung-frontstapler" }).select("status").lean();
  if (legacy && SLUG !== "basis-ausbildung-frontstapler") {
    warn(`Produkt 'basis-ausbildung-frontstapler' (${legacy.status}) existiert bereits. Prüfen Sie, ob beide gleichzeitig aktiv sein sollen.`);
  }

  const existing = await Product.findOne({ slug: SLUG });
  if (existing && !flag("update")) {
    warn(`Produkt '${SLUG}' existiert bereits, übersprungen. Zum Überschreiben: --update`);
  } else if (existing) {
    Object.assign(existing, { ...data, locationIds });
    await existing.save();
    ok(`Produkt '${SLUG}' aktualisiert (Preis netto: ${PRICE} €).`);
  } else {
    await Product.create({ ...data, locationIds });
    ok(`Produkt '${SLUG}' erstellt (Preis netto: ${PRICE} €, Status: ${data.status}).`);
  }

  await mongoose.disconnect();
}

run().catch(async (e) => {
  err(e.message || String(e));
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
