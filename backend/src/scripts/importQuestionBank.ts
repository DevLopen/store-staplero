/**
 * Zakłada katalog pytań klienta (slug "ffz-fragenkatalog") z KLIENT_FRAGEN.
 * Pytania już istniejące w bazie NIE są nadpisywane (mogły zostać zmienione w panelu admina); dopisywane są tylko brakujące.
 * --reset nadpisuje cały katalog treścią z pliku (kasuje zmiany z panelu).
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import QuestionBank, { BankQuestion } from "../models/QuestionBank";
import { KLIENT_FRAGEN } from "./content/klientFragen";

dotenv.config();
const SLUG = "ffz-fragenkatalog";
const T4 = (de: string, en: string, pl: string, uk: string) => ({ de, en, pl, uk });
const TOPICS = [
    { key: "ch_grundlagen", title: T4("Grundlagen & Vorschriften", "Basics & regulations", "Podstawy i przepisy", "Основи й приписи") },
    { key: "ch_aufbau", title: T4("Aufbau, Funktion & Typen", "Design, function & types", "Budowa, działanie i typy", "Будова, принцип роботи і типи") },
    { key: "ch_antrieb", title: T4("Antriebsarten", "Drive types", "Rodzaje napędu", "Типи приводу") },
    { key: "ch_stand", title: T4("Standsicherheit", "Stability", "Stateczność", "Стійкість") },
    { key: "ch_betrieb", title: T4("Betrieb allgemein", "General operation", "Eksploatacja ogólna", "Загальна експлуатація") },
    { key: "ch_pruefung", title: T4("Regelmäßige Prüfung", "Regular inspection", "Regularne kontrole", "Регулярні перевірки") },
    { key: "ch_last", title: T4("Umgang mit Last", "Handling loads", "Praca z ładunkiem", "Робота з вантажем") },
    { key: "ch_sonder", title: T4("Sondereinsätze", "Special operations", "Zastosowania specjalne", "Особливі види робіт") },
    { key: "ch_verkehr", title: T4("Verkehrsregelung und Verkehrswege", "Traffic rules and traffic routes", "Zasady ruchu i drogi komunikacyjne", "Правила руху й транспортні шляхи") },
];
const fromFile = (): BankQuestion[] => KLIENT_FRAGEN.map(f => ({
    id: f.id, topic: f.ch, q: f.q, o: f.o ?? [], c: f.c ?? [],
    ...(f.num !== undefined ? { num: f.num, unit: f.unit } : {}),
    ...(f.img ? { media: { type: "image" as const, src: f.img } } : {}),
    ...(f.wait ? { wait: f.wait } : {}), hidden: false,
}));

async function main() {
    await mongoose.connect(process.env.MONGO_URI!);
    let b = await QuestionBank.findOne({ slug: SLUG });
    const reset = process.argv.includes("--reset");
    if (!b) b = new QuestionBank({ slug: SLUG });
    b.title = T4("Fragenkatalog Staplerschein", "Forklift licence question bank", "Katalog pytań Staplerschein", "Каталог питань Staplerschein");
    b.description = T4("Prüfungsfragen mit Lösungen", "Exam questions with answers", "Pytania egzaminacyjne z odpowiedziami", "Екзаменаційні питання з відповідями");
    b.topics = TOPICS;
    const file = fromFile();
    if (reset || !b.questions.length) b.questions = file;
    else { const have = new Set(b.questions.map(q => q.id)); for (const q of file) if (!have.has(q.id)) b.questions.push(q); }
    b.markModified("questions");
    await b.save();
    console.log(`Katalog ${SLUG} (${b._id}): ${b.questions.length} pytań, aktywnych ${b.questions.filter(q => !q.hidden && !q.wait).length}`);
    await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
