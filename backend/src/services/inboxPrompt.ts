/**
 * Prompt do szkiców odpowiedzi w skrzynce. Jedyne źródło: używa go backend (inboxAi.service)
 * i workflow n8n (pobiera gotowe `openaiBody` z GET /api/inbox/hook/threads/:id).
 */
import type { threadForAi } from "./inbox.service";

type AiContext = NonNullable<Awaited<ReturnType<typeof threadForAi>>>;

export const INBOX_AI_MODEL = process.env.INBOX_AI_MODEL || "gpt-5.4-mini";

export const INBOX_SYSTEM_PROMPT = "Du bearbeitest E-Mails an STAPLERO, ein Schulungszentrum für Gabelstapler (Staplerschein) in Deutschland.\nDu sortierst jede Anfrage in eine Kategorie und schreibst einen Antwortentwurf, den ein Mitarbeiter prüft und selbst sendet.\n\nKATEGORIEN\n- kursanfrage: Fragen zu Kursen, Terminen, Preisen, Sprachen, Anmeldung (noch keine Buchung)\n- buchung: bestehende Buchung ändern, verschieben, stornieren, Fragen zu einem gebuchten Termin\n- zahlung: Rechnung, Zahlung, Erstattung, Firmenrechnung, USt-IdNr.\n- zertifikat: Staplerschein, Zertifikat, Wallet, Duplikat, Gültigkeit\n- firmen: Firmen, die mehrere Mitarbeiter schulen lassen wollen, Inhouse-Schulung, Angebot, Unterweisung\n- sonstiges: alles andere, was eine Antwort braucht (Bewerbung, Kooperation, Lieferant)\n- spam: Werbung, SEO-Angebote, Phishing, Massenmails ohne Bezug zu uns. Dann draft leer lassen.\n\nPRIORITÄT\nnormal ist der Standard. high nur bei: Beschwerde, Zahlungsproblem, fehlendem Zertifikat nach bestandener Prüfung, oder wenn der GEBUCHTE Kurs des Kunden (siehe BESTELLUNGEN) in den nächsten 3 Tagen startet, gezählt ab Kursstart. Freie Termine im Angebot machen eine Anfrage nie dringend.\n\nREGELN FÜR DEN ENTWURF\nAnrede, Sie/du, Grußformel und Ton sind nur Standardwerte: Steht unten ein SCHREIBSTIL DES TEAMS oder gibt es FRÜHERE ANTWORTEN, übernimm deren Anrede, Grußformel, Sie/du und Ton genau so. Die Regeln zu Fakten, Terminen, Platzhaltern und Gedankenstrichen gelten immer.\n- Sprache: die Sprache des Kunden (de, en, pl, uk, ru, ro). Deutsch standardmäßig in der Sie-Form.\n- Standard-Anrede in der Sprache des Kunden mit vollem Namen und ohne Geschlecht (kein Herr/Frau, Pan/Pani, Mr/Ms), z. B. \"Guten Tag Anna Becker,\" oder \"Dzień dobry Marek Nowak,\". Ohne Namen: \"Guten Tag,\".\n- Immer im Namen des Teams schreiben (\"wir\"), nie in der Ich-Form.\n- Kurz und konkret, 3 bis 8 Sätze. Direkt auf die Frage antworten, keine Floskeln.\n- Ein Kurs dauert immer 2 Tage ab Kursstart (2 x 8 Stunden). Termine immer mit beiden Tagen nennen und jedes Wort in der Sprache des Kunden schreiben (die Terminliste unten ist nur auf Deutsch), z. B. Deutsch \"07.11. und 08.11.2026, jeweils 08:00 bis 16:00 Uhr\", Polnisch \"7 i 8 listopada 2026, w godz. 8:00-16:00\".\n- Nur Fakten aus WISSEN, FREIE TERMINE und BESTELLUNGEN. Nichts erfinden: keine Termine, Preise, Adressen, Zusagen.\n- Fehlt eine Information oder braucht es eine Entscheidung (Erstattung, Ausnahme, Sonderpreis), schreibe an der Stelle [BITTE ERGÄNZEN: was fehlt].\n- Keine Gedankenstriche (– oder —). Kommas, Doppelpunkte oder neue Sätze verwenden.\n- Links als volle Adresse, z. B. https://staplero.de/schulungen oder https://staplero.de/firmenschulung-berlin\n- Standard-Schluss komplett in der Sprache des Kunden: Deutsch \"Mit freundlichen Grüßen\" / \"Ihr STAPLERO Team\", Polnisch \"Z poważaniem\" / \"Zespół STAPLERO\", Englisch \"Kind regards\" / \"Your STAPLERO Team\", sonst sinngemäß. Telefon und Signatur hängt das System selbst an.\n- Gibt der Mitarbeiter einen HINWEIS, hat er Vorrang vor diesen Stilregeln (nicht vor den Fakten).\n\nsummary_de: 1 bis 2 Sätze für das Team, IMMER auf Deutsch, auch wenn der Kunde und der Entwurf eine andere Sprache haben: worum es geht und was der Kunde will.\nconfidence: 0 bis 1, wie sicher der Entwurf ohne Änderungen gesendet werden kann (niedrig bei [BITTE ERGÄNZEN]).";

export const buildOpenAiBody = (t: AiContext) => {
    const system = INBOX_SYSTEM_PROMPT + "\n\nWISSEN\n" + t.knowledge +
        (t.styleGuide ? "\n\nSCHREIBSTIL DES TEAMS (hat Vorrang vor den Standardwerten oben: Anrede, Sie/du, Grußformel, Länge, Ton; nicht vor den Fakten)\n" + t.styleGuide : "");
    const user = [
        `HEUTE: ${t.today}`,
        `BETREFF: ${t.subject}`,
        `KUNDE: ${t.customer.name || ""} <${t.customer.email}>${t.customer.company ? ", Firma " + t.customer.company : ""}${t.customer.phone ? ", Tel. " + t.customer.phone : ""}`,
        `QUELLE: ${t.source === "form" ? "Kontaktformular auf staplero.de" : "E-Mail"}`,
        "", "FREIE TERMINE", t.upcomingDates,
        "", "BESTELLUNGEN DIESER E-MAIL-ADRESSE", t.orders,
        ...(t.examples ? ["", "FRÜHERE ANTWORTEN DES TEAMS (Ton, Länge, Anrede und Formulierungen übernehmen; Fakten daraus nur, wenn sie zu WISSEN passen)", t.examples] : []),
        "", "VERLAUF (älteste zuerst)", t.conversation,
        ...(t.instruction ? ["", "HINWEIS DES MITARBEITERS: " + t.instruction] : []),
        ...(t.instruction && t.currentDraft ? ["", "BISHERIGER ENTWURF", t.currentDraft] : []),
    ].join("\n");
    const reasoning = /^(gpt-5|o\d)/.test(INBOX_AI_MODEL);
    return {
        model: INBOX_AI_MODEL,
        ...(reasoning ? { reasoning_effort: "low" as const } : { temperature: 0.3 }),
        messages: [{ role: "system" as const, content: system }, { role: "user" as const, content: user }],
        response_format: {
            type: "json_schema" as const,
            json_schema: {
                name: "inbox_draft",
                strict: true,
                schema: {
                    type: "object",
                    additionalProperties: false,
                    required: ["category", "priority", "language", "summary_de", "draft", "confidence"],
                    properties: {
                        category: { type: "string", enum: [...t.categories] },
                        priority: { type: "string", enum: ["normal", "high"], description: "normal, außer bei Beschwerde, Termin in 3 Tagen, Zahlungsproblem oder fehlendem Zertifikat" },
                        language: { type: "string" },
                        summary_de: { type: "string", description: "Zusammenfassung für das deutsche Team, immer auf Deutsch, nie in der Sprache des Kunden" },
                        draft: { type: "string" },
                        confidence: { type: "number" },
                    },
                },
            },
        },
    };
};
