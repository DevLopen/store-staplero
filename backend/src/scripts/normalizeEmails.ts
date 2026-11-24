/**
 * Ujednolica adresy e-mail kont (kolekcja users): trim + małe litery.
 *
 *   npx ts-node src/scripts/normalizeEmails.ts            # podgląd (nic nie zapisuje)
 *   npx ts-node src/scripts/normalizeEmails.ts --apply    # zapis zmian
 *   MONGO_URI="mongodb+srv://..." npx ts-node src/scripts/normalizeEmails.ts
 *
 * Konta, które po normalizacji miałyby ten sam adres (np. "Jan@x.de" i "jan@x.de"), NIE są
 * scalane ani usuwane. Skrypt je tylko wypisuje i pomija; trzeba je rozstrzygnąć ręcznie.
 * Przed --apply zrób kopię: ./scripts/backup-mongo.sh
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

type Row = { _id: mongoose.Types.ObjectId; email?: unknown; name?: string; isAdmin?: boolean; createdAt?: Date; purchasedCourses?: unknown[] };

async function main() {
    const apply = process.argv.includes("--apply");
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("Brak MONGO_URI");

    await mongoose.connect(uri);
    const host = mongoose.connection.host;
    const dbName = mongoose.connection.name;
    console.log(`Baza: ${host}/${dbName}  tryb: ${apply ? "ZAPIS (--apply)" : "podgląd (bez zmian)"}`);

    // surowa kolekcja: bez setterów modelu, widzimy adresy dokładnie tak, jak są zapisane
    const users = mongoose.connection.db.collection<Row>("users");
    const all = await users
        .find({}, { projection: { email: 1, name: 1, isAdmin: 1, createdAt: 1, purchasedCourses: 1 } })
        .toArray();

    const groups = new Map<string, Row[]>();
    const invalid: Row[] = [];
    for (const u of all) {
        if (typeof u.email !== "string" || !u.email.trim()) { invalid.push(u); continue; }
        const key = u.email.trim().toLowerCase();
        groups.set(key, [...(groups.get(key) || []), u]);
    }

    const toChange: { _id: Row["_id"]; from: string; to: string }[] = [];
    const collisions: [string, Row[]][] = [];
    for (const [key, rows] of groups) {
        if (rows.length > 1) { collisions.push([key, rows]); continue; }
        const from = rows[0].email as string;
        if (from !== key) toChange.push({ _id: rows[0]._id, from, to: key });
    }

    console.log(`\nKont: ${all.length}. Do zmiany: ${toChange.length}. Kolizje (pomijane): ${collisions.length}. Bez adresu: ${invalid.length}.`);

    if (toChange.length) {
        console.log("\nZmiany:");
        toChange.forEach(c => console.log(`  ${c._id}  "${c.from}" -> "${c.to}"`));
    }
    if (collisions.length) {
        console.log("\nKOLIZJE: te konta mają ten sam adres po normalizacji. Nic z nimi nie robię, rozstrzygnij ręcznie:");
        for (const [key, rows] of collisions) {
            console.log(`  ${key}`);
            rows.forEach(r => console.log(
                `    ${r._id}  "${r.email}"  admin=${!!r.isAdmin}  kursy=${r.purchasedCourses?.length ?? 0}  założone=${r.createdAt?.toISOString?.() ?? "?"}`
            ));
        }
    }
    if (invalid.length) {
        console.log("\nKonta bez poprawnego pola email:");
        invalid.forEach(r => console.log(`  ${r._id}  email=${JSON.stringify(r.email)}`));
    }

    if (!apply) {
        console.log("\nPodgląd zakończony, nic nie zapisano. Zapis: dodaj --apply.");
    } else {
        let ok = 0, failed = 0;
        for (const c of toChange) {
            try {
                // warunek na stary adres: nie nadpisujemy, jeśli ktoś w międzyczasie zmienił konto
                const r = await users.updateOne({ _id: c._id, email: c.from }, { $set: { email: c.to } });
                if (r.modifiedCount === 1) ok++; else { failed++; console.log(`  pominięto ${c._id} (adres zmienił się w trakcie)`); }
            } catch (err: any) {
                failed++;
                console.log(`  BŁĄD ${c._id} "${c.from}": ${err?.code === 11000 ? "adres już istnieje (kolizja)" : err?.message}`);
            }
        }
        console.log(`\nZapisano: ${ok}. Nieudane/pominięte: ${failed}.`);
    }

    await mongoose.disconnect();
    if (collisions.length) process.exitCode = 2;
}

main().catch(err => { console.error("Błąd:", err); process.exit(1); });
