/**
 * Nadaje albo odbiera prawa admina (flaga isAdmin w kolekcji users). Jedyny sposób nadania admina:
 * backend nie przyznaje go już na podstawie adresu e-mail.
 *
 *   npx ts-node src/scripts/setAdmin.ts <email>                    # podgląd: pokaże, co by zmienił
 *   npx ts-node src/scripts/setAdmin.ts <email> --apply            # nadaj admina
 *   npx ts-node src/scripts/setAdmin.ts <email> --revoke --apply   # odbierz admina
 *   npx ts-node src/scripts/setAdmin.ts --list                     # lista obecnych adminów
 *   MONGO_URI="mongodb+srv://..." npx ts-node src/scripts/setAdmin.ts ...
 *
 * Konto musi już istnieć (najpierw rejestracja na stronie). Adres porównywany bez względu na wielkość liter.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function main() {
    const args = process.argv.slice(2);
    const apply = args.includes("--apply");
    const revoke = args.includes("--revoke");
    const list = args.includes("--list");
    const email = args.find(a => !a.startsWith("--"))?.trim().toLowerCase();

    if (!list && !email) {
        console.log("Użycie: npx ts-node src/scripts/setAdmin.ts <email> [--revoke] [--apply] | --list");
        process.exit(1);
    }
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("Brak MONGO_URI");

    await mongoose.connect(uri);
    console.log(`Baza: ${mongoose.connection.host}/${mongoose.connection.name}`);
    const users = mongoose.connection.db.collection("users");

    if (list) {
        const admins = await users.find({ isAdmin: true }, { projection: { email: 1 } }).toArray();
        console.log(`Admini (${admins.length}):`);
        admins.forEach(a => console.log(`  ${a._id}  ${a.email}`));
        await mongoose.disconnect();
        return;
    }

    const matches = await users
        .find({ email: new RegExp(`^\\s*${escapeRegex(email!)}\\s*$`, "i") }, { projection: { email: 1, isAdmin: 1, name: 1 } })
        .toArray();

    if (matches.length === 0) {
        console.log(`Nie ma konta z adresem ${email}. Najpierw załóż konto (rejestracja), potem uruchom skrypt ponownie.`);
        await mongoose.disconnect();
        process.exit(1);
    }
    if (matches.length > 1) {
        console.log(`Kilka kont pasuje do ${email} (różna wielkość liter). Najpierw rozstrzygnij je (scripts/normalizeEmails.ts):`);
        matches.forEach(m => console.log(`  ${m._id}  "${m.email}"  isAdmin=${!!m.isAdmin}`));
        await mongoose.disconnect();
        process.exit(2);
    }

    const u = matches[0];
    const target = !revoke;
    console.log(`Konto: ${u._id}  ${u.email}  (${u.name ?? "-"})  isAdmin teraz: ${!!u.isAdmin}  ->  ${target}`);

    if (!!u.isAdmin === target) {
        console.log("Bez zmian, flaga już ma tę wartość.");
    } else if (!apply) {
        console.log("Podgląd, nic nie zapisano. Zapis: dodaj --apply.");
    } else {
        await users.updateOne({ _id: u._id }, { $set: { isAdmin: target } });
        console.log(`Zapisano: isAdmin=${target}. Zmiana działa od razu (backend czyta flagę z bazy przy każdym żądaniu).`);
    }
    await mongoose.disconnect();
}

main().catch(err => { console.error("Błąd:", err); process.exit(1); });
