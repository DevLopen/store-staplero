// backend/src/services/openaiService.ts
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
                                               prompt,
                                               fileContents = [],
                                               language = "de"
                                           }: GenerateContentParams): Promise<string> => {

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
            model: "gpt-4o-mini",
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
    if (mimeType === "text/plain") {
        return fileBuffer.toString("utf-8");
    }

    if (mimeType === "application/pdf") {
        return "[PDF content extraction not implemented yet]";
    }

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        return "[DOCX content extraction not implemented yet]";
    }

    throw new Error("Nieunterstütztes Dateiformat");
};