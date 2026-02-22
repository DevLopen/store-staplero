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

// Podstawowy prompt ekspercki
const EXPERT_SYSTEM_PROMPT = `
Du bist ein hochqualifizierter Dozent für Flurförderzeuge bei STAPLERO.

QUELLEN-PRIORITÄT:
1. Deine Hauptquelle sind die vom Nutzer hochgeladenen Dokumente und Bilder
2. Verwende primär die Informationen aus diesen Materialien
3. Nutze dein Expertenwissen nur, um Lücken zu füllen

QUALITÄTS-STANDARDS:
1. RECHTLICHER FOKUS: Nutze konkrete deutsche Rechtsgrundlagen (DGUV Vorschrift 68, BetrSichV)
2. TECHNISCHE TIEFE: Erkläre physikalische Grundsätze
3. PRAXISBEZUG: Gib konkrete Beispiele aus dem Arbeitsalltag
4. STRUKTURIERT: Gliedere Inhalte logisch
`;

const BLOCKS_SYSTEM_PROMPT = `
Du bist ein Experte für die Erstellung von Lerninhalten für Gabelstapler-Schulungen.

AUFGABE:
Erstelle strukturierte Lernblöcke basierend auf den hochgeladenen Materialien und dem angegebenen Thema.

VERFÜGBARE BLOCK-TYPEN:
1. "richtext" - Textblöcke mit HTML-Formatierung
2. "callout" - Hervorgehobene Hinweise (styles: "info", "warning", "danger", "success")
3. "divider" - Trennlinien zwischen Abschnitten
4. "interactive" - Interaktive Übungen (subtypes: "stability_simulator", "drag_order", "hotspot")

WICHTIG - DU MUSST ECHTE INHALTE GENERIEREN:
- Extrahiere konkrete Informationen aus den hochgeladenen Dokumenten
- Schreibe ausführliche, lehrreiche Texte (mindestens 3-4 Sätze pro richtext-Block)
- Nutze HTML-Tags: <h2>, <h3>, <p>, <strong>, <em>, <ul>, <li>
- Füge konkrete Zahlen, Beispiele und rechtliche Grundlagen hinzu
- Strukturiere didaktisch: Einleitung → Hauptinhalt → Praxis → Sicherheit

OUTPUT FORMAT - NUR REINES JSON:
Gib AUSSCHLIESSLICH ein JSON-Array zurück, OHNE Markdown-Backticks, OHNE zusätzlichen Text.

BEISPIEL (mit echtem Inhalt):
[
  {
    "type": "richtext",
    "data": {
      "html": "<h2>Grundlagen der Standsicherheit</h2><p>Die Standsicherheit eines Gabelstaplers wird durch den Lastschwerpunkt bestimmt. Nach DGUV Vorschrift 68 muss die Last so aufgenommen werden, dass das Kippmoment das Standmoment nicht überschreitet.</p><p><strong>Wichtig:</strong> Der Standsicherheitswinkel beträgt bei Frontstaplern etwa 4-6 Grad. Bei einer 2000 kg Last reduziert sich die Standsicherheit bei 4m Hubhöhe um 30%.</p>"
    }
  },
  {
    "type": "callout",
    "data": {
      "style": "warning",
      "title": "Sicherheitshinweis",
      "content": "Nach DGUV Grundsatz 308-001 ist das Fahren mit angehobener Last über 50cm nur in Ausnahmefällen erlaubt."
    }
  },
  {
    "type": "richtext",
    "data": {
      "html": "<h3>Praktische Maßnahmen</h3><ul><li>Lastschwerpunkt vor jeder Aufnahme prüfen</li><li>Traglastdiagramm am Stapler beachten</li><li>Bei unsicheren Lasten nur 20cm anheben</li></ul>"
    }
  },
  {
    "type": "interactive",
    "data": {
      "subtype": "stability_simulator",
      "title": "Übung: Standsicherheit testen",
      "description": "Passen Sie Last und Höhe an und beobachten Sie die Kippgefahr"
    }
  }
]

REGELN:
- NUR das JSON-Array, KEINE Markdown-Backticks (\`\`\`json)
- Mindestens 4-6 Blöcke pro Thema
- Jeder richtext-Block: minimum 100 Wörter
- Nutze die hochgeladenen Dokumente als Hauptquelle
- Füge praktische Beispiele und Zahlen ein
- Callouts für Sicherheitshinweise
- Interactive Blocks für praktisches Lernen
`;

// Wyciąganie tekstu z plików
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

// Główna funkcja generowania treści
export const generateTopicContent = async ({
    title,
    prompt = "Erstelle eine detaillierte Lektion basierend auf dem Titel und den Materialien.",
    files = [],
    language = "de",
    outputFormat = "markdown"
}: GenerateContentParams): Promise<any> => {

    console.log("=== AI GENERATION START ===");
    console.log("Title:", title);
    console.log("Prompt:", prompt);
    console.log("Files:", files.length);
    console.log("Output format:", outputFormat);

    const imageFiles = files.filter(f => f.mimetype.startsWith('image/'));
    const docFiles = files.filter(f => !f.mimetype.startsWith('image/'));

    // Wyciągnij tekst z dokumentów
    let docsText = "";
    for (const file of docFiles) {
        const text = await extractTextFromFile(file.buffer, file.mimetype);
        docsText += `\n--- INHALT AUS DATEI: ${file.originalname} ---\n${text}\n`;
    }

    console.log("Extracted text length:", docsText.length);

    // Buduj treść wiadomości dla OpenAI
    const userPromptText = `THEMA: "${title}"
ANWEISUNG: ${prompt}

MATERIALIEN AUS DOKUMENTEN:
${docsText || "Keine Textdateien bereitgestellt."}

${outputFormat === "blocks" ? 
"Erstelle daraus ein JSON-Array von Lernblöcken wie im System-Prompt beschrieben. WICHTIG: Gib NUR das JSON-Array zurück, OHNE Markdown-Backticks!" :
"Erstelle daraus ein umfassendes Lernmodul in Markdown-Format."
}`;

    const userMessageContent: any[] = [
        {
            type: "text",
            text: userPromptText
        }
    ];

    // Dodaj obrazy
    imageFiles.forEach(file => {
        userMessageContent.push({
            type: "image_url",
            image_url: { url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}` }
        });
    });

    console.log("Calling OpenAI API...");

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
            max_tokens: 4000 // Zwiększone dla dłuższych treści
        });

        let generatedContent = completion.choices[0]?.message?.content || "";
        console.log("OpenAI response length:", generatedContent.length);
        console.log("OpenAI response (first 500 chars):", generatedContent.substring(0, 500));

        // Jeśli format bloków
        if (outputFormat === "blocks") {
            try {
                // Usuń markdown code fences jeśli są
                let jsonContent = generatedContent
                    .replace(/```json\n?/g, "")
                    .replace(/```\n?/g, "")
                    .trim();

                console.log("Cleaned JSON (first 500 chars):", jsonContent.substring(0, 500));

                const blocks = JSON.parse(jsonContent);
                
                if (!Array.isArray(blocks)) {
                    throw new Error("Response is not an array");
                }

                if (blocks.length === 0) {
                    throw new Error("Empty blocks array returned");
                }

                // Dodaj ID i order do każdego bloku
                const blocksWithMeta = blocks.map((block: any, index: number) => {
                    // Walidacja struktury bloku
                    if (!block.type || !block.data) {
                        console.warn("Invalid block structure:", block);
                        return null;
                    }

                    // Sprawdź czy richtext ma content
                    if (block.type === "richtext" && (!block.data.html || block.data.html.trim().length < 10)) {
                        console.warn("Empty richtext block:", block);
                        return null;
                    }

                    return {
                        id: nanoid(8),
                        type: block.type,
                        order: index,
                        data: block.data,
                        width: "full" // domyślnie pełna szerokość
                    };
                }).filter(Boolean); // Usuń null

                console.log("Valid blocks generated:", blocksWithMeta.length);

                if (blocksWithMeta.length === 0) {
                    throw new Error("No valid blocks after validation");
                }

                return {
                    blocks: blocksWithMeta,
                    blocksGenerated: blocksWithMeta.length
                };
            } catch (parseError: any) {
                console.error("JSON parse error:", parseError);
                console.log("Failed to parse content:", generatedContent);
                
                // Fallback: zwróć pojedynczy blok z wygenerowaną treścią
                console.log("Creating fallback richtext block");
                return {
                    blocks: [{
                        id: nanoid(8),
                        type: "richtext",
                        order: 0,
                        width: "full",
                        data: {
                            html: `<div class="ai-generated"><h2>${title}</h2><div>${generatedContent.replace(/\n/g, '<br/>')}</div></div>`
                        }
                    }],
                    blocksGenerated: 1,
                    warning: "AI returned invalid JSON, created fallback block"
                };
            }
        }

        // Format markdown (legacy)
        return {
            content: generatedContent
        };

    } catch (error: any) {
        console.error("OpenAI Error:", error);
        throw new Error(`Generierung fehlgeschlagen: ${error.message}`);
    }
};

// Funkcja do ulepszania treści (legacy)
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

// Chat function
export const generateChatResponse = async (
    userMessage: string,
    conversationHistory: ChatMessage[] = []
): Promise<string> => {
    try {
        const messages: any[] = [
            { role: "system", content: "Du bist ein hilfreicher Assistent für Flurförderzeug-Schulungen." }
        ];

        const recentHistory = conversationHistory.slice(-10);
        recentHistory.forEach(msg => {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        });

        messages.push({
            role: "user",
            content: userMessage
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
            presence_penalty: 0.6,
            frequency_penalty: 0.3
        });

        return completion.choices[0]?.message?.content ||
            "Entschuldigung, ich konnte keine Antwort generieren. Bitte versuchen Sie es erneut.";

    } catch (error: any) {
        console.error("OpenAI Chat Error:", error);
        throw new Error(`Chat-Generierung fehlgeschlagen: ${error.message}`);
    }
};
