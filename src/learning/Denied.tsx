import { Link } from "react-router-dom";
import { Lang } from "./types";

/** Brak dostępu do kursu: po wygaśnięciu zakupu z datą i drogą do sklepu, inaczej krótka informacja. */
const T = {
    expired: { de: "Zugang abgelaufen am {d}", en: "Access expired on {d}", pl: "Dostęp wygasł {d}", uk: "Доступ закінчився {d}" },
    expiredText: { de: "Ihr Zugang zu diesem Kurs ist abgelaufen. Sie können ihn im Shop erneut kaufen.", en: "Your access to this course has expired. You can buy it again in the shop.", pl: "Dostęp do tego kursu wygasł. Możesz kupić go ponownie w sklepie.", uk: "Доступ до цього курсу закінчився. Його можна знову придбати в магазині." },
    noAccess: { de: "Kein Zugriff auf diesen Kurs", en: "No access to this course", pl: "Brak dostępu do tego kursu", uk: "Немає доступу до цього курсу" },
    notFound: { de: "Nicht gefunden", en: "Not found", pl: "Nie znaleziono", uk: "Не знайдено" },
    toShop: { de: "Zum Shop", en: "To the shop", pl: "Do sklepu", uk: "До магазину" },
    toPanel: { de: "Meine Produkte", en: "My products", pl: "Moje produkty", uk: "Мої продукти" },
} satisfies Record<string, Record<Lang, string>>;
const LOC: Record<Lang, string> = { de: "de-DE", en: "en-GB", pl: "pl-PL", uk: "uk-UA" };

export default function Denied({ error, lang }: { error: unknown; lang: Lang }) {
    const e = error as any;
    const body = e?.body;
    if (body?.expired) {
        const d = new Date(body.expiredAt).toLocaleDateString(LOC[lang], { day: "numeric", month: "long", year: "numeric" });
        return <div className="co-page" style={{ maxWidth: 560 }}>
            <h2 className="q">{T.expired[lang].replace("{d}", d)}</h2>
            <p className="txt">{T.expiredText[lang]}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link to="/schulungen" className="btn btn-p" style={{ textDecoration: "none", width: "auto", padding: "0 20px" }}>{T.toShop[lang]}</Link>
                <Link to="/dashboard#kurse" className="btn btn-o" style={{ textDecoration: "none", width: "auto", padding: "0 20px" }}>{T.toPanel[lang]}</Link>
            </div>
        </div>;
    }
    return <div className="co-page"><h2 className="q">{T[e?.status === 403 ? "noAccess" : "notFound"][lang]}</h2></div>;
}
