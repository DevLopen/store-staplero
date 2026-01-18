import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

interface GenerateContentParams {
    title: string;
    prompt: string;
    fileContents?: string[];
    language?: string;
}

export const generateTopicContent = async ({
                                               title,
                                               prompt,
                                               fileContents = [],
                                               language = "de"
                                           }: GenerateContentParams): Promise<string> => {

    // Połącz zawartość plików
    const filesContext = fileContents.length > 0
        ? `\n\nZawartość załączonych plików:\n${fileContents.join("\n\n---\n\n")}`
        : "";

    const systemPrompt = `Du bist ein Experte für Staplerschulungen und technische Dokumentation. 
Deine Aufgabe ist es, professionelle, gut strukturierte Lehrinhalte zu erstellen.

Formatierung:
- Verwende Markdown-Formatierung
- Beginne mit einer klaren Überschrift (# Titel)
- Strukturiere den Inhalt mit Unterüberschriften (## und ###)
- Verwende Aufzählungen für Listen
- Hebe wichtige Punkte **fett** hervor
- Füge praktische Beispiele hinzu

Stil:
- Schreibe klar und verständlich
- Verwende eine professionelle, aber zugängliche Sprache
- Fokussiere dich auf praktische Anwendung
- Füge Sicherheitshinweise hinzu wo relevant`;

    const userPrompt = `Erstelle einen Schulungsinhalt zum Thema: "${title}"

Anforderungen:
${prompt}
${filesContext}

Erstelle einen vollständigen, gut strukturierten Lehrinhalt in Markdown-Format.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Schneller und günstiger als gpt-4
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });

        return completion.choices[0]?.message?.content || "Fehler bei der Generierung";
    } catch (error: any) {
        console.error("OpenAI API Error:", error);
        throw new Error(`AI-Generierung fehlgeschlagen: ${error.message}`);
    }
};

export const enhanceTopicContent = async (
    existingContent: string,
    instructions: string
): Promise<string> => {
    const systemPrompt = `Du bist ein Experte für Staplerschulungen. 
Verbessere oder erweitere den bestehenden Inhalt basierend auf den Anweisungen.
Behalte die Markdown-Formatierung bei.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Bestehender Inhalt:\n${existingContent}\n\nAnweisungen: ${instructions}`
                }
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });

        return completion.choices[0]?.message?.content || existingContent;
    } catch (error: any) {
        console.error("OpenAI API Error:", error);
        throw new Error(`AI-Verbesserung fehlgeschlagen: ${error.message}`);
    }
};

export const extractTextFromFile = async (fileBuffer: Buffer, mimeType: string): Promise<string> => {
    // Podstawowa ekstrakcja tekstu z różnych formatów
    if (mimeType === "text/plain") {
        return fileBuffer.toString("utf-8");
    }

    if (mimeType === "application/pdf") {
        // TODO: Implementacja PDF parsing (użyj pdf-parse)
        // const pdfParse = require("pdf-parse");
        // const data = await pdfParse(fileBuffer);
        // return data.text;
        return "[PDF content extraction not implemented yet]";
    }

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // TODO: Implementacja DOCX parsing (użyj mammoth)
        // const mammoth = require("mammoth");
        // const result = await mammoth.extractRawText({ buffer: fileBuffer });
        // return result.value;
        return "[DOCX content extraction not implemented yet]";
    }

    throw new Error("Nieunterstütztes Dateiformat");
};