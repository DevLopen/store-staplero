import OpenAI from "openai";
import * as mammoth from "mammoth";
const pdf = require("pdf-parse-fork");
import { nanoid } from "nanoid";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

interface GenerateContentParams {
    title: string;
    prompt: string;
    files?: Express.Multer.File[];
    language?: string;
    outputFormat?: "markdown" | "blocks";
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface ContentBlock {
    id: string;
    type: string;
    order: number;
    data: any;
}

// Existing FAQ and system prompts remain the same...
const EXPERT_SYSTEM_PROMPT = `
Du bist ein hochqualifizierter Dozent für Flurförderzeuge bei STAPLERO.

WICHTIG - QUELLEN-PRIORITÄT:
1. Deine Hauptquelle sind die vom Nutzer hochgeladenen Dokumente und Bilder.
2. Verwende primär die Informationen aus diesen Materialien (Redaktioneller Fokus).
3. Nutze dein eigenes Expertenwissen nur, um Lücken zu füllen oder rechtliche Grundlagen (z.B. DGUV Vorschriften) zu präzisieren.
4. Wenn Materialien vorliegen, haben diese Vorrang vor generischem Wissen.

QUALITÄTS-STANDARDS:
1. RECHTLICHER FOKUS: Nutze konkrete deutsche Rechtsgrundlagen (z.B. DGUV Vorschrift 1, DGUV Vorschrift 68, BetrSichV, ArbSchG). 
2. KEINE GENERISCHEN BEISPIELE: Bleibe bei fachlichen Fakten und realen Gefahrenpotenzialen.
3. TECHNISCHE TIEFE: Erkläre physikalische Grundsätze (Standsicherheit, Lastschwerpunkt).
4. STRUKTURIERT: Gliedere Inhalte in logische Abschnitte mit klaren Überschriften.
`;

const BLOCKS_SYSTEM_PROMPT = `
Du bist ein erfahrener E-Learning-Autor und didaktischer Experte für Flurförderzeug-Schulungen.

DEINE AUFGABE:
Erstelle einen VOLLSTÄNDIGEN, ABWECHSLUNGSREICHEN Kursabschnitt als JSON-Array von Content-Blöcken.
Der Abschnitt soll professionell und lehrreich sein — wie ein echtes Schulungsmodul.

═══════════════════════════════════════════════
VERFÜGBARE BLOCKTYPEN (alle nutzen!):
═══════════════════════════════════════════════

1. richtext  → { "type": "richtext", "richtextData": "<HTML>", "width": "full" | "half" }
   - Vollständiger Lehrtext in HTML: h2, h3, p, strong, em, ul, li, ol
   - KEIN div, KEINE class-Attribute
   - Mindestens 3-5 inhaltlich volle Absätze pro Block

2. callout   → { "type": "callout", "calloutStyle": "warning"|"danger"|"info"|"success", "calloutTitle": "...", "calloutText": "...", "width": "full" | "half" }
   - warning: Vorsichtshinweise
   - danger: Lebensgefahr / gesetzliche Verbote
   - info: Zusatzinfo / Tipp
   - success: Korrekte Vorgehensweise / Best Practice

3. image     → { "type": "image", "imageUrl": null, "imageCaption": "PLATZHALTER: [genaue Beschreibung was einzufügen ist]", "width": "full" | "half" }
   - imageUrl IMMER null
   - imageCaption: präzise Beschreibung des Bildinhalts (Foto, Diagramm, Schema)

4. video     → { "type": "video", "videoUrl": null, "videoCaption": "PLATZHALTER: [genaue Beschreibung des Videos]", "width": "full" }
   - videoUrl IMMER null
   - videoCaption: Beschreibung des Video-Inhalts

5. divider   → { "type": "divider", "width": "full" }
   - Visueller Trenner zwischen Abschnitten

6. interactive → { "type": "interactive", "interactiveSubtype": "drag-order"|"hotspot"|"stability-sim", "width": "full",
                   "interactiveData": { "title": "...", "description": "PLATZHALTER: [was soll das Übung zeigen]", "items": [] } }
   - drag-order: Reihenfolge-Übung (z.B. Checkliste sortieren)
   - hotspot: Gefahrenpunkte auf Bild markieren
   - stability-sim: Stabilitätsdreieck-Simulation

═══════════════════════════════════════════════
LAYOUT-REGELN (width-Feld):
═══════════════════════════════════════════════
- "full"  = Block nimmt volle Breite ein (Standard)
- "half"  = Block nimmt halbe Breite ein (zwei half-Blöcke nebeneinander)

PFLICHT-LAYOUTMUSTER:
- Einleitungs-Richtext: full
- Theorie-Richtext (lang): full
- Bild + Callout nebeneinander: beide "half"
- Bild + Bild nebeneinander: beide "half"
- Callout + Callout nebeneinander (z.B. Verbote + Tipps): beide "half"
- Videos: immer "full"
- Divider: immer "full"
- Interaktive Übung: "full"

═══════════════════════════════════════════════
PFLICHT-STRUKTUR (10-14 Blöcke):
═══════════════════════════════════════════════

1.  [richtext, full]      — Einleitung: Was wird in diesem Abschnitt behandelt? Warum ist es wichtig?
2.  [richtext, full]      — Haupttheorie Teil 1: Detaillierter Fachinhalt mit h2/h3/ul
3.  [image, half]         — PLATZHALTER Bild: Beschreibe genau was abgebildet sein soll
4.  [callout warning/info, half] — Wichtiger Hinweis passend zum Bild
5.  [richtext, full]      — Haupttheorie Teil 2: Weitere Details, Regeln, Vorschriften (DGUV)
6.  [callout danger, half] — Verbot / Lebensgefahr-Hinweis
7.  [callout success, half] — Korrekte Vorgehensweise / So macht man es richtig
8.  [divider, full]       — Abschnittstrennlinie
9.  [image, half]         — PLATZHALTER Bild 2: anderer Blickwinkel / anderes Detail
10. [image, half]         — PLATZHALTER Bild 3: weiteres relevantes Bild
11. [interactive, full]   — PLATZHALTER Übung: drag-order oder hotspot mit Beschreibung
12. [video, full]         — PLATZHALTER Video: Beschreibe genau welches Video einzufügen ist
13. [richtext, full]      — Zusammenfassung: Wichtigste Punkte als ul-Liste, Wiederholung der Kernbotschaft

═══════════════════════════════════════════════
ABSOLUTE REGELN:
═══════════════════════════════════════════════
- Gib NUR das JSON-Array zurück — KEIN Text davor/danach, KEINE Markdown-Codeblöcke
- Sprache: DEUTSCH
- Felder sind DIREKT im Block-Objekt (NICHT in "data" verschachtelt)
- imageUrl und videoUrl: IMMER null
- Inhalt: fachlich korrekt, DGUV-konform, praxisnah
- Richtext: immer vollständige HTML-Tags, kein unvollständiger Text
- Das width-Feld: MUSS bei jedem Block vorhanden sein
`

// Extract text from uploaded files
export const extractTextFromFile = async (buffer: Buffer, mimetype: string): Promise<string> => {
    try {
        if (mimetype === "application/pdf") {
            const pdfData = await pdf(buffer);
            return pdfData.text || "";
        }

        if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const result = await mammoth.extractRawText({ buffer });
            return result.value || "";
        }

        if (mimetype === "text/plain") {
            return buffer.toString("utf-8");
        }

        return "";
    } catch (error) {
        console.error("File extraction error:", error);
        return "";
    }
};

// Generate topic content - now supports both markdown and blocks
export const generateTopicContent = async ({
                                               title,
                                               prompt = "Erstelle eine detaillierte Lektion basierend auf dem Titel und den Materialien.",
                                               files = [],
                                               language = "de",
                                               outputFormat = "markdown"
                                           }: GenerateContentParams): Promise<any> => {

    const imageFiles = files.filter(f => f.mimetype.startsWith('image/'));
    const docFiles = files.filter(f => !f.mimetype.startsWith('image/'));

    // Extract text from document files
    let docsText = "";
    for (const file of docFiles) {
        const text = await extractTextFromFile(file.buffer, file.mimetype);
        docsText += `\n--- INHALT AUS DATEI: ${file.originalname} ---\n${text}\n`;
    }

    // Build message content
    const userMessageContent: any[] = [
        {
            type: "text",
            text: `THEMA: "${title}"
            ANWEISUNG: ${prompt}
            
            UNBEDINGT ZU BEACHTENDE MATERIALIEN (TEXT):
            ${docsText || "Keine Textdateien bereitgestellt."}
            
            Analysiere sowohl den obigen Text als auch die beigefügten Bilder (falls vorhanden) und erstelle daraus ${outputFormat === "blocks" ? "ein strukturiertes JSON-Array von Content-Blöcken" : "das Lernmodul"}.`
        }
    ];

    // Add images for Vision analysis
    imageFiles.forEach(file => {
        userMessageContent.push({
            type: "image_url",
            image_url: { url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}` }
        });
    });

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: outputFormat === "blocks" ? BLOCKS_SYSTEM_PROMPT : EXPERT_SYSTEM_PROMPT
                },
                { role: "user", content: userMessageContent }
            ],
            temperature: 0.3,
            max_tokens: outputFormat === "blocks" ? 6000 : 2500
        });

        let generatedContent = completion.choices[0]?.message?.content || "";

        // Detect image refusal (Vision model sometimes refuses images)
        const refusalPatterns = ["tut mir leid", "kann bei diesem bild nicht", "ich kann nicht", "unable to", "i cannot", "sorry, i"];
        const isRefusal = refusalPatterns.some(p => generatedContent.toLowerCase().includes(p));

        if (outputFormat === "blocks" && isRefusal && imageFiles.length > 0) {
            console.warn("Vision model refused images, retrying without images...");
            // Retry without images
            const textOnlyContent = userMessageContent.filter((c: any) => c.type === "text");
            const retryCompletion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: BLOCKS_SYSTEM_PROMPT },
                    { role: "user", content: textOnlyContent }
                ],
                temperature: 0.3,
                max_tokens: 6000
            });
            generatedContent = retryCompletion.choices[0]?.message?.content || "";
        }

        // If blocks format requested, parse JSON and add IDs
        if (outputFormat === "blocks") {
            try {
                // Remove markdown code fences if present
                const jsonContent = generatedContent
                    .replace(/```json\n?/g, "")
                    .replace(/```\n?/g, "")
                    .trim();

                const blocks = JSON.parse(jsonContent);

                // Add IDs and order to each block - support flat and legacy nested format
                const blocksWithMeta = blocks.map((block: any, index: number) => {
                    const base = { id: nanoid(8), type: block.type, order: index };
                    if (block.data && typeof block.data === 'object') {
                        // Legacy nested format - flatten
                        return { ...base, ...block.data };
                    }
                    // Flat format - spread directly
                    const { type: _t, ...rest } = block;
                    return { ...base, ...rest };
                });

                return {
                    blocks: blocksWithMeta,
                    blocksGenerated: blocksWithMeta.length
                };
            } catch (parseError) {
                console.error("JSON parse error:", parseError);
                console.log("Generated content:", generatedContent);

                // Fallback: return a richtext block with raw content + error info
                return {
                    blocks: [{
                        id: nanoid(8),
                        type: "richtext",
                        order: 0,
                        width: "full",
                        richtextData: `<p><strong>⚠️ KI-generierter Inhalt (Fallback — JSON-Parsing fehlgeschlagen):</strong></p><pre>${generatedContent.slice(0, 3000)}</pre>`
                    }],
                    blocksGenerated: 1,
                    parseError: true,
                    rawContent: generatedContent.slice(0, 500)
                };
            }
        }

        // Markdown format (legacy)
        return {
            content: generatedContent
        };

    } catch (error: any) {
        console.error("OpenAI Error:", error);
        throw new Error(`Generierung fehlgeschlagen: ${error.message}`);
    }
};

// Enhance existing content (legacy function - keep for backward compatibility)
export const enhanceTopicContent = async (
    existingContent: string,
    instructions: string
): Promise<string> => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Du bist ein Experte für die Verbesserung von Bildungsinhalten."
                },
                {
                    role: "user",
                    content: `Verbessere folgenden Inhalt basierend auf diesen Anweisungen:\n\nInhalt:\n${existingContent}\n\nAnweisungen:\n${instructions}`
                }
            ],
            temperature: 0.4,
            max_tokens: 2000
        });

        return completion.choices[0]?.message?.content || existingContent;
    } catch (error: any) {
        console.error("Enhancement error:", error);
        throw new Error(`Verbesserung fehlgeschlagen: ${error.message}`);
    }
};

// Course Assistant Chat - context-aware chat for specific topic/chapter
export const generateCourseAssistantResponse = async (
    userMessage: string,
    conversationHistory: ChatMessage[],
    context: {
        courseTitle: string;
        chapterTitle: string;
        topicTitle?: string;
        topicContent?: string;
    },
    language: string = "de"
): Promise<string> => {
    try {
        const languageInstructions: Record<string, string> = {
            de: "Antworte ausschließlich auf Deutsch.",
            en: "Respond exclusively in English.",
            pl: "Odpowiadaj wyłącznie po polsku.",
            uk: "Відповідай виключно українською мовою.",
        };
        const languageInstruction = languageInstructions[language] || languageInstructions["de"];

        const systemPrompt = `Du bist ein hilfreicher Assistent auf einer E-Learning-Plattform für Flurförderzeug-Fahrer.

Aktueller Kontext:
- Kurs: ${context.courseTitle}
- Kapitel: ${context.chapterTitle}
${context.topicTitle ? `- Thema: ${context.topicTitle}` : ""}
${context.topicContent ? `\nInhalt des aktuellen Kapitels:\n${context.topicContent}` : ""}

REGELN:
1. Beantworte NUR Fragen zum aktuellen Kapitel/Thema
2. Wenn die Frage außerhalb des Themenbereichs liegt, weise höflich darauf hin
3. ${languageInstruction}
4. Sei hilfsbereit, präzise und fachlich korrekt
5. Zitiere bei Bedarf BHP-Vorschriften, DGUV-Normen und andere Regelwerke
6. Helfe nicht bei Themen außerhalb des Flurförderzeug-Kurses`;

        const messages: any[] = [
            { role: "system", content: systemPrompt }
        ];

        const recentHistory = conversationHistory.slice(-8);
        recentHistory.forEach(msg => {
            messages.push({ role: msg.role, content: msg.content });
        });

        messages.push({ role: "user", content: userMessage });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.5,
            max_tokens: 600
        });

        return completion.choices[0]?.message?.content || "Sorry, I could not generate a response. Please try again.";
    } catch (error: any) {
        console.error("Course Assistant Error:", error);
        throw new Error(`Assistent-Fehler: ${error.message}`);
    }
};


export const generateChatResponse = async (
    userMessage: string,
    conversationHistory: ChatMessage[] = []
): Promise<string> => {
    try {
        const SITE_SYSTEM_PROMPT = `Jesteś asystentem strony STAPLERO — centrum szkoleniowego wózków widłowych (Gabelstapler).
Firma działa w Niemczech (Görlitz/Zgorzelec, Berlin, München) na granicy polsko-niemieckiej.
Odpowiadasz WYŁĄCZNIE na pytania związane z ofertą STAPLERO.

=== KONTAKT ===
Telefon: +49 176 22067783
Email: info@staplero.de
Formularz kontaktowy: dostępny na stronie głównej (sekcja #contact)
Lokalizacje: Berlin, Görlitz/Zgorzelec, München

=== OFERTA KURSÓW ===

1. KURS PRAKTYCZNY (Theorie & Praxis) — dostępny, można rezerwować
   Strona: /practical-course
   Cena: 249,99 € netto + 19% VAT
   Czas: 2 dni intensywnie
   Dzień 1: Teoria + egzamin pisemny
   Dzień 2: Praktyka + egzamin jazdy
   W cenie: teoria, praktyka, egzamin, oficjalny Staplerschein (DGUV)
   Opcja: STAPLERO ProCard (karta plastikowa) — dopłata 14,99 € netto/os.
   Języki: DE, PL, UK, RU, EN (zależy od lokalizacji)
   Wymagania: min. 18 lat, sprawność fizyczna i psychiczna, dokument tożsamości, obuwie ochronne, zdjęcie paszportowe
   Rejestracja: online na stronie, płatność online (gotówka tylko po uzgodnieniu)
   Anulowanie: bezpłatnie do 7 dni przed kursem
   Certyfikat: cyfrowy PDF + Apple Wallet + Google Wallet, opcjonalnie ProCard

2. KURS TEORII ONLINE — coming soon (€49/miesiąc)
3. KURS TEORII STACJONARNY — coming soon (€99/os.)

=== SZKOLENIA INHOUSE (B2B) ===
Szkolenia u klienta — w całych Niemczech, indywidualna wycena.
Wymagane info do wyceny: liczba pracowników, lokalizacja, typ urządzenia, doświadczenie uczestników.
Języki: DE, PL, UK, RU + rumuński (dopłata tłumacz 179,99 € netto/dzień)
Czas: standard 2 dni (1 dzień przy ≥6 mies. doświadczenia; 3 dni dla wózków wysokiego składowania)
Firma zapewnia: salę na teorię + teren + sprawny wózek + palety euro
Instruktorzy przywożą wszystkie materiały szkoleniowe.

=== CERTYFIKAT ===
Oficjalny Staplerschein zgodny z DGUV Vorschrift 68 i DGUV Grundsatz 308-001.
Ważny w całych Niemczech.
Format cyfrowy: PDF do pobrania, Apple Wallet, Google Wallet.
Karta plastikowa ProCard: opcjonalnie, 14,99 € dopłata.
NIE przyjmują bonów edukacyjnych (Bildungsgutschein) ani voucherów z Jobcenter.

=== FAQ — NAJCZĘSTSZE PYTANIA ===
P: Kiedy jest egzamin/szkolenie?
O: Terminy dostępne na /practical-course. Można też napisać na info@staplero.de lub zadzwonić.

P: Jak długo trwa kurs?
O: 2 dni. Dzień 1: teoria, dzień 2: praktyka i egzamin.

P: Gdzie odbywa się egzamin?
O: W wybranej lokalizacji kursu (Berlin, Görlitz, München).

P: Co zabrać na kurs?
O: Dokument tożsamości ze zdjęciem (dowód/paszport), zdjęcie paszportowe, obuwie ochronne.

P: Czy certyfikat jest uznawany w całych Niemczech?
O: Tak, DGUV Vorschrift 68 — uznawany w całych Niemczech.

P: Czy karta plastikowa jest obowiązkowa?
O: Nie, certyfikat cyfrowy w pełni wystarczy. ProCard to opcja za 14,99 €.

P: Czy można kurs po polsku/ukraińsku?
O: Tak, zależy od lokalizacji. Przy rejestracji wybierz język.

P: Czy można anulować?
O: Tak, bezpłatnie do 7 dni przed kursem.

P: Jaki poziom języka niemieckiego potrzebny?
O: Wystarczy A2/B1 — jeśli rozumiesz proste polecenia i możesz podążać za lekcją.

P: Czy współpracują z Jobcenter / przyjmują bony edukacyjne?
O: Nie.

P: Czy mogę dostać pytania egzaminacyjne?
O: Nie, to oficjalny egzamin. Do przygotowania służy kurs teorii online.

P: Czy dodatkowe kwalifikacje są możliwe?
O: Tak — wózki wysokiego składowania (Schubmaststapler), elektryczne wózki paletowe itp. Zapytaj o szczegóły.

=== ZASADY ODPOWIEDZI ===
- Odpowiadaj w języku pytania (PL/DE/EN/UK)
- Krótko i konkretnie — 2-4 zdania, nie więcej
- Jeśli pytanie ZUPEŁNIE nie dotyczy STAPLERO → odpowiedz: "Mogę pomagać tylko w sprawach związanych ze szkoleniami STAPLERO. Czy masz pytanie o nasze kursy lub certyfikaty?"
- Nie wymyślaj konkretnych dat ani cen których nie znasz

=== LINKI — KRYTYCZNE ZASADY ===
Linki ZAWSZE w formacie: [etykieta](url) — BEZ żadnego tekstu przed ani po nawiasach.

POPRAWNIE:
Terminy znajdziesz tutaj: [Kurs praktyczny](/practical-course)
Napisz do nas: [info@staplero.de](mailto:info@staplero.de)
Zadzwoń: [+49 176 22067783](tel:+4917622067783)
Formularz: [Kontakt](#contact)

NIEPOPRAWNIE (tak NIE rób):
"stronie: Zobacz dostępne terminy/practical-course" ← BŁĄD, brak nawiasów kwadratowych
"info@staplero.demailto:info@staplero.de" ← BŁĄD, tekst zlany z url
"napisz na adres info@staplero.de" ← BŁĄD, email jako plain text

ZAWSZE gdy podajesz link, email lub telefon — użyj formatu [etykieta](url). Nigdy samego URL.`;

        const messages: any[] = [
            { role: "system", content: SITE_SYSTEM_PROMPT }
        ];

        conversationHistory.slice(-8).forEach(msg => {
            messages.push({ role: msg.role, content: msg.content });
        });

        messages.push({ role: "user", content: userMessage });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.3,
            max_tokens: 300,
        });

        return completion.choices[0]?.message?.content ||
            "Entschuldigung, ich konnte keine Antwort generieren. Bitte versuchen Sie es erneut.";

    } catch (error: any) {
        console.error("OpenAI Chat Error:", error);
        throw new Error(`Chat-Generierung fehlgeschlagen: ${error.message}`);
    }
};