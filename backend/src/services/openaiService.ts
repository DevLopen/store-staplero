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
Jesteś ekspertem dydaktycznym tworzącym materiały szkoleniowe dla operatorów wózków widłowych na platformie e-learningowej w Polsce.

WAŻNE - FORMAT WYJŚCIOWY:
Zwróć tablicę JSON bloków treści. Każdy blok to obiekt z polami bezpośrednio na poziomie obiektu (NIE zagnieżdżone w "data").

Dostępne typy bloków i ich pola:
1. richtext - pole: richtextData (string HTML z pełną treścią merytoryczną)
2. video - pole: videoUrl (null = placeholder), videoCaption (opis co wstawić)  
3. image - pole: imageUrl (null = placeholder), imageCaption (opis co wstawić)
4. callout - pola: calloutStyle (info/warning/danger/success), calloutTitle, calloutText
5. divider - brak dodatkowych pól
6. interactive - pola: interactiveSubtype (stability-sim/drag-order/hotspot), interactiveData (obiekt)

ZASADY TWORZENIA TREŚCI:
- Bloki richtext MUSZĄ zawierać pełny, szczegółowy tekst merytoryczny w HTML (min. 3-5 paragrafów)
- Używaj tagów: h2, h3, p, strong, em, ul, li, ol - NIE div, NIE class
- Bloki image mają imageUrl: null i imageCaption opisujący DOKŁADNIE jakie zdjęcie wstawić
- Bloki video mają videoUrl: null i videoCaption opisujący JAKI film wstawić
- Pisz wyłącznie po POLSKU
- Twórz 6-10 bloków na temat
- Struktura: Wprowadzenie → Teoria z detalami → Ważne zasady (callout) → Placeholder zdjęcia → Placeholder wideo → Podsumowanie
- Treść musi być merytoryczna, szczegółowa, zgodna z przepisami BHP i DGUV

Przykładowy output (format który MUSISZ stosować):
[
  {
    "type": "richtext",
    "richtextData": "<h2>Stateczność wózka widłowego</h2><p>Stateczność wózka widłowego opiera się na <strong>trójkącie stabilizacji</strong> tworzonym przez dwa przednie koła napędowe i tylne koło skrętne. Ładunek umieszczony w rzucie pionowym poza tym trójkątem powoduje niebezpieczeństwo wywrotki.</p><h3>Czynniki wpływające na stateczność</h3><ul><li><strong>Ciężar ładunku</strong> — im cięższy, tym niżej należy go transportować</li><li><strong>Wysokość podniesienia</strong> — uniesione widły drastycznie podnoszą środek ciężkości</li><li><strong>Prędkość jazdy</strong> — na zakrętach siły odśrodkowe mogą wywrócić wózek</li></ul>"
  },
  {
    "type": "callout",
    "calloutStyle": "warning",
    "calloutTitle": "Zakaz przeciążania",
    "calloutText": "Nigdy nie przekraczaj maksymalnego udźwigu określonego w tabliczce znamionowej wózka. Przekroczenie udźwigu grozi wywrotką i wypadkiem śmiertelnym."
  },
  {
    "type": "image",
    "imageUrl": null,
    "imageCaption": "PLACEHOLDER: Wstaw zdjęcie/schemat trójkąta stabilizacji wózka widłowego z oznaczonymi punktami podparcia"
  },
  {
    "type": "video",
    "videoUrl": null,
    "videoCaption": "PLACEHOLDER: Wstaw film instruktażowy pokazujący prawidłowe techniki transportu ładunku wózkiem widłowym"
  }
]

ABSOLUTNE REGUŁY:
- Zwróć TYLKO tablicę JSON, bez żadnych dodatkowych tekstów ani znaczników markdown (\`\`\`json)
- Pola bloków są BEZPOŚREDNIO w obiekcie (NIE w zagnieżdżonym "data")
- Każdy blok richtext ma pełną, szczegółową treść HTML
- imageUrl i videoUrl dla placeholderów zawsze ustawione na null
- Treść po polsku, merytoryczna, zgodna z BHP
`;


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
            max_tokens: outputFormat === "blocks" ? 3000 : 2500
        });

        let generatedContent = completion.choices[0]?.message?.content || "";

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

                // Fallback: return a single richtext block with the content
                return {
                    blocks: [{
                        id: nanoid(8),
                        type: "richtext",
                        order: 0,
                        data: {
                            html: `<div class="ai-fallback"><p><strong>KI-generierter Inhalt (Fallback):</strong></p>${generatedContent.replace(/\n/g, '<br/>')}</div>`
                        }
                    }],
                    blocksGenerated: 1
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
        topicContent?: string; // richtext content for context
    }
): Promise<string> => {
    try {
        const systemPrompt = `Jesteś pomocnym asystentem kursanta na platformie e-learningowej dla operatorów wózków widłowych.

Kontekst bieżący:
- Kurs: ${context.courseTitle}
- Rozdział: ${context.chapterTitle}
${context.topicTitle ? `- Temat: ${context.topicTitle}` : ''}
${context.topicContent ? `\nTreść bieżącego rozdziału:\n${context.topicContent}` : ''}

ZASADY:
1. Odpowiadaj WYŁĄCZNIE na pytania dotyczące bieżącego rozdziału/tematu
2. Jeśli pytanie wykracza poza zakres, grzecznie poinformuj że możesz pomóc tylko w kontekście tego rozdziału
3. Odpowiadaj po polsku
4. Bądź pomocny, konkretny i merytoryczny
5. Cytuj przepisy BHP, DGUV i inne normy jeśli to istotne
6. Nie pomagaj z zagadnieniami spoza kursu na wózki widłowe`;

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

        return completion.choices[0]?.message?.content || "Przepraszam, nie udało mi się wygenerować odpowiedzi. Spróbuj ponownie.";
    } catch (error: any) {
        console.error("Course Assistant Error:", error);
        throw new Error(`Błąd asystenta: ${error.message}`);
    }
};


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