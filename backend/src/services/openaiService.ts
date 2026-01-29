import OpenAI from "openai";
import * as mammoth from "mammoth";
// Zmiana na bezpieczniejszy fork
const pdf = require("pdf-parse-fork");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

interface GenerateContentParams {
    title: string;
    prompt: string;
    files?: Express.Multer.File[];
    language?: string;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

// FAQ Knowledge Base - źródło wiedzy dla AI
const FAQ_KNOWLEDGE_BASE = `
# STAPLERO - Firma Schulungowa dla Operatorów Wózków Widłowych

## Informacje B2B (Firmy)

### Szkolenia Inhouse
- Prowadzimy szkolenia w całych Niemczech bezpośrednio w siedzibie klienta
- Zgodne z DGUV Vorschrift 68 i DGUV Grundsatz 308-001
- Szkolenie składa się z części teoretycznej z egzaminem pisemnym oraz części praktycznej z egzaminem jazdy
- Trenerzy przynoszą wszystkie niezbędne materiały szkoleniowe
- Wymagana jest odpowiednia powierzchnia do ćwiczeń praktycznych

### Koszty Szkoleń Inhouse
Szkolenia są planowane indywidualnie. Potrzebujemy następujących informacji:
- Liczba uczestników
- Miejsce szkolenia
- Rodzaj urządzenia (np. wózek czołowy, wózek z wysuwnym masztem, wózek elektryczny, wózek podnośnikowy)
- Doświadczenie uczestników
- Dla szkoleń w języku rumuńskim dodatkowa opłata za tłumacza: 179,99 € netto dziennie

### Języki Szkoleń
Dostępne języki (teoria i praktyka):
- Niemiecki
- Polski
- Ukraiński
- Rosyjski
- Rumuński (dodatkowa opłata za tłumacza: 179,99 € netto dziennie)

### Wymagania dla Uczestników
Uczestnicy potrzebują:
- Ważny dowód osobisty lub paszport
- Zdjęcie paszportowe (do legitymacji)
- Buty ochronne (obowiązkowe dla części praktycznej)

### Certyfikat
Po zdaniu egzaminu teoretycznego i praktycznego wszyscy uczestnicy otrzymują:
- Oficjalny niemiecki certyfikat operatora wózka widłowego
- Ważny zgodnie z DGUV Vorschrift 68 i DGUV Grundsatz 308-001
- Uznawany w całych Niemczech
- Opcjonalnie: STAPLERO ProCard - legitymacja w formacie karty (jak prawo jazdy): 14,99 € netto za osobę

### Wymagania dla Firmy
Dzień 1 (Teoria):
- Cichy pokój ze stołami i krzesłami
- Dobre oświetlenie
- Gniazdko elektryczne

Dzień 2 (Praktyka):
- Odpowiedni teren ćwiczeń (np. magazyn, plac zakładowy)
- Sprawny wózek widłowy
- Europalety i pojemniki siatkowe

### Czas Trwania Szkolenia
Standard (wózek widłowy): 2 dni
- Dzień 1: Teoria z egzaminem pisemnym
- Dzień 2: Praktyka z ćwiczeniami jazdy i egzaminem praktycznym

Skrócone warianty:
- 1 dzień: Dla uczestników z minimum 6-miesięcznym doświadczeniem praktycznym lub po ukończeniu naszego szkolenia teoretycznego online
- 2 dni praktyki: Gdy teoria została już ukończona online
- 3 dni (intensywnie): Na życzenie, np. dla wózków z wysuwnym masztem

Wózek niskopodnośnikowy (elektryczny/szybkobieżny): 1 dzień
- Szkolenie obejmuje teorię, praktykę i egzamin

## Informacje B2C (Osoby Prywatne)

### Terminy Szkoleń
- Wszystkie aktualne terminy są publikowane na stronie internetowej
- Wybierz "Theorie & Praxis – offline" na dole strony
- Następnie wybierz odpowiedni termin i lokalizację
- Rejestracja online

### Czas Trwania
Standardowo: 2 dni
- Dzień 1: Teoria
- Dzień 2: Praktyka i egzamin

Wariant elastyczny:
- Teoria online = szkolenie skrócone do 1 dnia LUB 2 dni praktyki

### Koszty
Szkolenie podstawowe (Poziom 1 - wózek czołowy):
- 249,99 € netto (+ 19% VAT)
- W cenie: teoria, praktyka, egzamin i oficjalny certyfikat DGUV

Dodatkowe koszty (opcjonalne):
- Kwalifikacje dodatkowe (np. wózek z wysuwnym masztem, wózek z miejscem dla operatora)
- STAPLERO ProCard (legitymacja w formacie karty): 14,99 € extra

### Języki
Język zależy od wybranej lokalizacji i wyboru podczas rejestracji.

Przykład:
- Berlin (po niemiecku): Szkolenie po niemiecku, zalecany poziom: min. B1
- Uczestnicy z poziomem A2 również mogą uczestniczyć, ale muszą zdać egzamin
- Berlin (po angielsku): Lekcje i pytania egzaminacyjne po angielsku

### Wymagania Językowe
A2 lub B1 wystarcza, jeśli potrafisz:
- Zrozumieć proste instrukcje
- Śledzić zajęcia
- W razie problemów językowych trener pomaga

### Wymagania
- Minimalny wiek: 18 lat
- Zdolność fizyczna i psychiczna
- Znajomość języka niemieckiego, angielskiego, polskiego, ukraińskiego lub rosyjskiego
- Doświadczenie nie jest wymagane

### Proces Rejestracji
1. Wybierz termin i język na stronie internetowej
2. Zarejestruj się online
3. Zapłać opłatę za szkolenie
4. Twoje miejsce jest zarezerwowane

### Płatności
- Płatność online przez stronę internetową
- Płatność gotówką tylko po wcześniejszym uzgodnieniu

### Anulowanie
- Bezpłatne anulowanie możliwe do 7 dni przed rozpoczęciem kursu

### Ważność Certyfikatu
- Ważny w całych Niemczech
- Zgodny z przepisami DGUV

### Jobcenter / Agencja Pracy
- NIE przyjmujemy bonów edukacyjnych
- Szkolenie należy opłacić prywatnie lub może zostać pokryte przez pracodawcę

### Pytania Egzaminacyjne
- Pytania egzaminacyjne są oficjalne i nie są wydawane wcześniej
- Można skorzystać z naszego szkolenia teoretycznego online do przygotowania

## Produkty i Usługi

### Szkolenia Online
- Online-Theorie: 69€
- Elastyczna nauka w dowolnym czasie
- Dostęp do materiałów szkoleniowych

### Szkolenia Praktyczne
- Praxis-Ausbildung: od 299€
- Profesjonalne ćwiczenia jazdy
- Egzamin praktyczny

### Usługi Dodatkowe
- Personalvermittlung (rekrutacja personelu) dla:
  - Produkcji
  - Magazynu
  - Logistyki

## Ważne Zasady
- Rozmowa tylko na temat STAPLERO i szkoleń wózkowych
- Nie udzielaj informacji spoza zakresu firmy
- Jeśli pytanie wykracza poza zakres, uprzejmie przekieruj do kontaktu bezpośredniego
- Zawsze bądź pomocny, profesjonalny i konkretny
`;

// System prompt dla chat bota
const CHAT_SYSTEM_PROMPT = `Du bist der offizielle STAPLERO AI-Assistent - ein freundlicher, professioneller Chatbot für Staplerschulungen.

WICHTIGE REGELN:
1. Du darfst NUR über STAPLERO und Staplerschulungen sprechen
2. Bei Fragen außerhalb dieses Themas: höflich ablehnen und zum Thema zurückführen
3

KNOWLEDGE BASE:
${FAQ_KNOWLEDGE_BASE}

Beispiel-Antworten:
- "Unsere Inhouse-Schulungen finden deutschlandweit direkt bei Ihnen vor Ort statt..."
- "Das tut mir leid, aber ich kann nur Fragen zu STAPLERO-Schulungen beantworten. Haben Sie Fragen zu unseren Kursen?"
- "Gerne! Für ein individuelles Angebot benötigen wir..."
`;

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
4. GRAFIK-MANDAT: Wenn es sinnvoll ist, füge am Ende einen Platzhalter für DALL-E ein: [GENERATE_IMAGE: Beschreibung einer fachlichen Situation].

STRUKTUR:
# [Titel des Moduls]
## Rechtliche Grundlagen & Normen
## Kernkompetenzen
## Gefahrenanalyse & Prävention
## STAPLERO Experten-Check
`;

export const generateChatResponse = async (
    userMessage: string,
    conversationHistory: ChatMessage[] = []
): Promise<string> => {
    try {
        // Przygotuj historię konwersacji
        const messages: any[] = [
            { role: "system", content: CHAT_SYSTEM_PROMPT }
        ];

        // Dodaj ostatnie 10 wiadomości z historii (aby nie przekroczyć limitu tokenów)
        const recentHistory = conversationHistory.slice(-10);
        recentHistory.forEach(msg => {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        });

        // Dodaj aktualną wiadomość użytkownika
        messages.push({
            role: "user",
            content: userMessage
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.7,
            max_tokens: 500, // Krótsze odpowiedzi dla chatu
            presence_penalty: 0.6, // Unikaj powtórzeń
            frequency_penalty: 0.3
        });

        return completion.choices[0]?.message?.content ||
            "Entschuldigung, ich konnte keine Antwort generieren. Bitte versuchen Sie es erneut.";

    } catch (error: any) {
        console.error("OpenAI Chat Error:", error);
        throw new Error(`Chat-Generierung fehlgeschlagen: ${error.message}`);
    }
};

// Pozostałe funkcje z oryginalnego pliku
export const generateTopicContent = async ({
                                               title,
                                               prompt = "Erstelle eine detaillierte Lektion basierend auf dem Titel und den Materialien.",
                                               files = [],
                                               language = "de"
                                           }: GenerateContentParams): Promise<string> => {

    const imageFiles = files.filter(f => f.mimetype.startsWith('image/'));
    const docFiles = files.filter(f => !f.mimetype.startsWith('image/'));

    // WYCIĄGANIE TEKSTU Z PLIKÓW
    let docsText = "";
    for (const file of docFiles) {
        const text = await extractTextFromFile(file.buffer, file.mimetype);
        docsText += `\n--- INHALT AUS DATEI: ${file.originalname} ---\n${text}\n`;
    }

    // BUDOWANIE WIADOMOŚCI - tutaj dodajemy docsText!
    const userMessageContent: any[] = [
        {
            type: "text",
            text: `THEMA: "${title}"
            ANWEISUNG: ${prompt}
            
            UNBEDINGT ZU BEACHTENDE MATERIALIEN (TEXT):
            ${docsText || "Keine Textdateien bereitgestellt."}
            
            Analysiere sowohl den obigen Text als auch die beigefügten Bilder (falls vorhanden) und erstelle daraus das Lernmodul.`
        }
    ];

    // Dodanie zdjęć do analizy Vision
    imageFiles.forEach(file => {
        userMessageContent.push({
            type: "image_url",
            image_url: { url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}` }
        });
    });

    try {
        // KROK A: Generowanie treści i promptu dla grafiki
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: EXPERT_SYSTEM_PROMPT }, // Stała tożsamość
                { role: "user", content: userMessageContent }
            ],
            temperature: 0.3,
            max_tokens: 2500
        });

        let finalContent = completion.choices[0]?.message?.content || "";

        // // KROK B: Automatyczne generowanie grafiki DALL-E 3
        // const imageTagMatch = finalContent.match(/\[GENERATE_IMAGE: (.*?)\]/);
        //
        // if (imageTagMatch) {
        //     const imageDescription = imageTagMatch[1];
        //     const imageResponse = await openai.images.generate({
        //         model: "dall-e-3",
        //         prompt: `Professional, clean educational illustration for a forklift safety course: ${imageDescription}`,
        //         n: 1,
        //         size: "1024x1024"
        //     });
        //
        //     // Sprawdzenie czy dane istnieją i czy tablica nie jest pusta
        //     if (imageResponse.data && imageResponse.data.length > 0) {
        //         const imageUrl = imageResponse.data[0].url;
        //
        //         if (imageUrl) {
        //             finalContent = finalContent.replace(imageTagMatch[0], `\n\n![Illustration](${imageUrl})\n\n`);
        //         }
        //     } else {
        //         // Jeśli grafika się nie wygenerowała, usuwamy tag promptu, by nie "śmiecił" w tekście
        //         finalContent = finalContent.replace(imageTagMatch[0], "");
        //         console.error("OpenAI Image Error: No data received");
        //     }
        // }

        return finalContent;
    } catch (error: any) {
        console.error("OpenAI Multimodal Error:", error);
        throw new Error(`Generowanie nie powiodło się: ${error.message}`);
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
    if (!fileBuffer || fileBuffer.length === 0) return "";

    try {
        if (mimeType === "text/plain") {
            return fileBuffer.toString("utf-8");
        }
        if (mimeType === "application/pdf") {
            // pdf-parse zwraca Promise, który rozwiązuje się do obiektu z polem text
            const data = await pdf(fileBuffer);
            return data.text || "";
        }
        if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            // mammoth wymaga obiektu z buforem
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            return result.value || "";
        }
        return "";
    } catch (error) {
        console.error("Błąd ekstrakcji tekstu z pliku:", mimeType, error);
        return ""; // Zwracamy pusty tekst, by nie przerywać pracy AI
    }
};