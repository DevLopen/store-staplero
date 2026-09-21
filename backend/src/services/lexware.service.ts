import axios from "axios";

// ✅ Nowy URL API (zmiana z lexoffice.io na lexware.io od maja 2025)
const LEXWARE_API_URL = "https://api.lexware.io/v1";
const LEXWARE_API_KEY = process.env.LEXWARE_API_KEY || "";

// ✅ Opcjonalne ID szablonu faktury — ustaw w .env jako LEXWARE_PRINT_LAYOUT_ID
// Jeśli puste, Lexware użyje domyślnego szablonu organizacji.
// Aby poznać dostępne szablony i ich ID, wywołaj jednorazowo: getPrintLayouts()
const LEXWARE_PRINT_LAYOUT_ID = process.env.LEXWARE_PRINT_LAYOUT_ID || "";

interface InvoiceItem {
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number; // np. 19 dla 19%
}

interface InvoiceData {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerAddress?: string;
    customerCity?: string;
    customerPostalCode?: string;
    // USt-IdNr. klienta firmowego — jeśli podana, drukowana jest jako dodatkowa
    // linia adresu na fakturze (Lexware nie ma osobnego pola na fakturze bez
    // pełnej integracji Kontaktów, więc dopisujemy ją do "supplement").
    customerVatId?: string;
    items: InvoiceItem[];
    totalAmount: number;
    currency: string;
}

interface LexwareInvoiceResponse {
    id: string;
    invoiceNumber: string;
    pdfUrl?: string;
    status?: string;
}

export interface PrintLayout {
    id: string;
    name: string;
    default: boolean;
}

/**
 * Formatuj datę do formatu ISO 8601 wymaganego przez Lexware
 * Format: yyyy-MM-ddTHH:mm:ss.SSSXXX (np. 2023-02-21T00:00:00.000+01:00)
 */
const formatDateForLexware = (date: Date): string => {
    const offset = -date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset >= 0 ? "+" : "-";
    const pad = (num: number) => String(num).padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetSign}${pad(offsetHours)}:${pad(offsetMinutes)}`;
};

/**
 * Oblicz cenę netto z brutto
 * Zaokrąglenie do 4 miejsc po przecinku — Lexware wymaga dokładności w unitPrice
 */
const calculateNetPrice = (grossPrice: number, taxRate: number): number => {
    return Math.round((grossPrice / (1 + taxRate / 100)) * 10000) / 10000;
};

/**
 * Pobierz listę dostępnych szablonów druku (print layouts) z Lexware.
 *
 * Wywołaj tę funkcję JEDNORAZOWO aby poznać ID swoich szablonów,
 * następnie ustaw wybrany ID w .env jako LEXWARE_PRINT_LAYOUT_ID.
 *
 * Możesz to zrobić np. przez tymczasowy endpoint:
 *
 *   router.get("/admin/print-layouts", async (req, res) => {
 *     const layouts = await lexwareService.getPrintLayouts();
 *     res.json(layouts);
 *   });
 *
 * Albo przez skrypt:
 *   npx ts-node -e "require('./lexware.service').getPrintLayouts()"
 *
 * Przykładowy wynik:
 *   [
 *     { id: "28c212c4-b6dd-11ee-b80a-dbc65f4ceccf", name: "STAPLERO Rechnung", default: true },
 *     { id: "91fa3bc1-c9ae-22ff-a91b-eac44g5defgh", name: "Standard", default: false }
 *   ]
 */
export const getPrintLayouts = async (): Promise<PrintLayout[]> => {
    if (!LEXWARE_API_KEY) {
        throw new Error("LEXWARE_API_KEY not configured");
    }

    try {
        const response = await axios.get(
            `${LEXWARE_API_URL}/print-layouts`,
            {
                headers: {
                    Authorization: `Bearer ${LEXWARE_API_KEY}`,
                    Accept: "application/json",
                },
            }
        );

        const layouts: PrintLayout[] = response.data.map((layout: any) => ({
            id: layout.id,
            name: layout.name,
            default: layout.default ?? false,
        }));

        console.log("🎨 Dostępne szablony faktur:");
        layouts.forEach((l) =>
            console.log(
                `  - "${l.name}" | ID: ${l.id}${l.default ? " ✅ (domyślny)" : ""}`
            )
        );

        return layouts;
    } catch (error: any) {
        console.error(
            "❌ Błąd pobierania print layouts:",
            error.response?.data || error.message
        );
        throw new Error(`Failed to get print layouts: ${error.message}`);
    }
};

/**
 * Stwórz fakturę w Lexware i od razu ją sfinalizuj (?finalize=true)
 *
 * === SZABLON PDF ===
 * Opcja A — Zmienna środowiskowa (zalecane):
 *   Ustaw LEXWARE_PRINT_LAYOUT_ID=<uuid> w pliku .env
 *   ID szablonu pobierzesz wywołując: getPrintLayouts()
 *
 * Opcja B — Bez konfiguracji:
 *   Jeśli LEXWARE_PRINT_LAYOUT_ID nie jest ustawione,
 *   Lexware automatycznie użyje domyślnego szablonu organizacji.
 *   Domyślny szablon ustawisz w Lexware: Einstellungen → Drucklayouts
 *
 * WAŻNE: Tylko sfinalizowane faktury (status "open") mają wygenerowany PDF.
 * Faktury w statusie "draft" zwracają 409 przy próbie pobrania pliku.
 */
export const createInvoice = async (
    invoiceData: InvoiceData
): Promise<LexwareInvoiceResponse> => {
    try {
        if (!LEXWARE_API_KEY) {
            throw new Error("LEXWARE_API_KEY not configured");
        }

        // 1. Przygotuj pozycje faktury według formatu Lexware
        const lineItems = invoiceData.items.map((item) => {
            const netAmount = calculateNetPrice(item.unitPrice, item.vatRate);
            const grossAmount = Math.round(item.unitPrice * 10000) / 10000;

            return {
                type: "custom",
                name: item.name,
                description: item.name,
                quantity: item.quantity,
                unitName: "Stück",
                unitPrice: {
                    currency: invoiceData.currency,
                    netAmount: netAmount,
                    grossAmount: grossAmount,
                    taxRatePercentage: item.vatRate,
                },
            };
        });

        // 2. Przygotuj daty w formacie ISO 8601
        const now = new Date();
        const voucherDate = formatDateForLexware(now);

        console.log("📅 Voucher Date:", voucherDate);

        // 3. Przygotuj payload faktury
        const invoicePayload: Record<string, any> = {
            voucherDate: voucherDate,
            address: {
                name: invoiceData.customerName,
                ...(invoiceData.customerVatId ? { supplement: `USt-IdNr.: ${invoiceData.customerVatId}` } : {}),
                street: invoiceData.customerAddress || "",
                zip: invoiceData.customerPostalCode || "",
                city: invoiceData.customerCity || "",
                countryCode: "DE",
            },
            lineItems: lineItems,
            totalPrice: {
                currency: invoiceData.currency,
            },
            // shippingConditions jest wymagane dla faktur
            shippingConditions: {
                shippingDate: voucherDate,
                shippingType: "delivery",
            },
            // taxType "net" = Lexware oblicza VAT automatycznie z netAmount
            taxConditions: {
                taxType: "net",
            },
            title: `${invoiceData.orderNumber}`,
            introduction: "Vielen Dank für Ihre Bestellung.",
            remark: `Bestellnummer: ${invoiceData.orderNumber}`,
        };

        // ✅ Ustaw szablon PDF
        if (LEXWARE_PRINT_LAYOUT_ID) {
            invoicePayload.printLayoutId = LEXWARE_PRINT_LAYOUT_ID;
            console.log(`🎨 Używam szablonu printLayoutId: ${LEXWARE_PRINT_LAYOUT_ID}`);
        } else {
            console.log(
                "🎨 LEXWARE_PRINT_LAYOUT_ID nie ustawione — używam domyślnego szablonu organizacji."
            );
        }

        console.log(
            "📋 Lexware Invoice Payload:",
            JSON.stringify(invoicePayload, null, 2)
        );

        // 4. ✅ Utwórz fakturę z ?finalize=true
        //    BEZ finalize=true faktura jest w statusie "draft" i NIE ma pliku PDF!
        const response = await axios.post(
            `${LEXWARE_API_URL}/invoices?finalize=true`,
            invoicePayload,
            {
                headers: {
                    Authorization: `Bearer ${LEXWARE_API_KEY}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        // ID może być w body lub w nagłówku Location
        const invoiceId =
            response.data.id ||
            response.headers.location?.split("/").pop();

        if (!invoiceId) {
            throw new Error("Failed to get invoice ID from Lexware response");
        }

        console.log(`✅ Faktura utworzona i sfinalizowana: ${invoiceId}`);

        // 5. Poczekaj — Lexware potrzebuje czasu na wygenerowanie PDF
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 6. Pobierz szczegóły faktury, aby uzyskać numer (voucherNumber)
        let invoiceNumber = invoiceData.orderNumber;

        try {
            const invoiceDetails = await axios.get(
                `${LEXWARE_API_URL}/invoices/${invoiceId}`,
                {
                    headers: {
                        Authorization: `Bearer ${LEXWARE_API_KEY}`,
                        Accept: "application/json",
                    },
                }
            );

            invoiceNumber = invoiceDetails.data.voucherNumber || invoiceNumber;
            console.log(`✅ Numer faktury: ${invoiceNumber}`);
        } catch (detailsError: any) {
            console.warn(
                "⚠️ Nie udało się pobrać szczegółów faktury:",
                detailsError.response?.data || detailsError.message
            );
        }

        return {
            id: invoiceId,
            invoiceNumber: invoiceNumber,
            // ✅ Nowy endpoint /file zamiast deprecated /document
            pdfUrl: `${LEXWARE_API_URL}/invoices/${invoiceId}/file`,
            status: "open",
        };
    } catch (error: any) {
        if (error.response) {
            console.error(
                "❌ Lexware API Error:",
                JSON.stringify(error.response.data, null, 2)
            );
            throw new Error(
                `Failed to create invoice: ${
                    error.response.data?.message ||
                    error.response.data?.IssueList?.[0]?.i18nKey ||
                    error.message
                }`
            );
        }
        throw new Error(`Failed to create invoice: ${error.message}`);
    }
};

/**
 * Pobierz szczegóły faktury z Lexware
 */
export const getInvoice = async (invoiceId: string): Promise<any> => {
    try {
        const response = await axios.get(
            `${LEXWARE_API_URL}/invoices/${invoiceId}`,
            {
                headers: {
                    Authorization: `Bearer ${LEXWARE_API_KEY}`,
                    Accept: "application/json",
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error(
            "❌ Lexware API Error:",
            error.response?.data || error.message
        );
        throw new Error(`Failed to get invoice: ${error.message}`);
    }
};

/**
 * Pobierz PDF faktury — używa nowego endpointu /file (nie deprecated /document)
 *
 * WAŻNE: Działa tylko dla sfinalizowanych faktur (status "open").
 * Faktury w statusie "draft" zwracają HTTP 409.
 */
export const getInvoicePDF = async (
    invoiceId: string,
    maxRetries: number = 5
): Promise<Buffer> => {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(
                `📄 Próba pobrania PDF faktury ${invoiceId} (próba ${attempt}/${maxRetries})...`
            );

            // ✅ Nowy endpoint /file zamiast deprecated /document
            const response = await axios.get(
                `${LEXWARE_API_URL}/invoices/${invoiceId}/file`,
                {
                    headers: {
                        Authorization: `Bearer ${LEXWARE_API_KEY}`,
                        Accept: "application/pdf",
                    },
                    responseType: "arraybuffer",
                    timeout: 30000,
                }
            );

            if (!response.data || response.data.byteLength === 0) {
                throw new Error("PDF is empty");
            }

            console.log(
                `✅ PDF pobrany pomyślnie: ${response.data.byteLength} bytes`
            );
            return Buffer.from(response.data);
        } catch (error: any) {
            lastError = error;
            const statusCode = error.response?.status;

            console.error(
                `❌ Próba ${attempt} nie powiodła się (HTTP ${statusCode}):`,
                error.response?.data || error.message
            );

            // HTTP 409 = faktura jest w statusie draft — nie ma sensu retry
            if (statusCode === 409) {
                throw new Error(
                    `Invoice ${invoiceId} is in draft status. PDF is only available for finalized invoices (use finalize=true).`
                );
            }

            // Błędy 4xx (oprócz 429 rate limit) — nie próbuj ponownie
            if (
                statusCode &&
                statusCode >= 400 &&
                statusCode < 500 &&
                statusCode !== 429
            ) {
                throw new Error(
                    `Failed to get invoice PDF (HTTP ${statusCode}): ${error.message}`
                );
            }

            // Dla błędów 5xx lub rate limit — czekaj przed kolejną próbą
            if (attempt < maxRetries) {
                const waitTime = attempt * 2000; // 2s, 4s, 6s, 8s...
                console.log(`⏳ Czekam ${waitTime}ms przed kolejną próbą...`);
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
        }
    }

    throw new Error(
        `Failed to get invoice PDF after ${maxRetries} attempts: ${lastError.message}`
    );
};

export default {
    createInvoice,
    getInvoice,
    getInvoicePDF,
    getPrintLayouts,
};