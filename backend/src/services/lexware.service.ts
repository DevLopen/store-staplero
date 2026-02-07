import axios from "axios";

const LEXWARE_API_URL = "https://api.lexoffice.io/v1";
const LEXWARE_API_KEY = process.env.LEXWARE_API_KEY || "";

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

/**
 * Formatuj datę do formatu ISO 8601 wymaganego przez Lexware
 * Format: yyyy-MM-ddTHH:mm:ss.SSSXXX (np. 2023-02-21T00:00:00.000+01:00)
 */
const formatDateForLexware = (date: Date): string => {
    // Pobierz offset strefy czasowej
    const offset = -date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset >= 0 ? '+' : '-';

    const pad = (num: number) => String(num).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetSign}${pad(offsetHours)}:${pad(offsetMinutes)}`;
};

/**
 * Oblicz cenę netto z brutto
 */
const calculateNetPrice = (grossPrice: number, taxRate: number): number => {
    return Math.round((grossPrice / (1 + taxRate / 100)) * 100) / 100;
};

/**
 * Utwórz lub pobierz kontakt
 */
const createOrGetContact = async (contactData: {
    name: string;
    email: string;
    address?: string;
    city?: string;
    postalCode?: string;
}): Promise<string> => {
    try {
        // Sprawdź czy kontakt już istnieje
        const searchResponse = await axios.get(
            `${LEXWARE_API_URL}/contacts`,
            {
                headers: {
                    "Authorization": `Bearer ${LEXWARE_API_KEY}`,
                    "Accept": "application/json"
                },
                params: {
                    email: contactData.email
                }
            }
        );

        if (searchResponse.data.content && searchResponse.data.content.length > 0) {
            console.log(`Kontakt istnieje: ${searchResponse.data.content[0].id}`);
            return searchResponse.data.content[0].id;
        }

        // Utwórz nowy kontakt
        const contactPayload = {
            version: 0,
            roles: {
                customer: {}
            },
            company: {
                name: contactData.name,
                street: contactData.address || "",
                city: contactData.city || "",
                zip: contactData.postalCode || "",
                countryCode: "DE"
            },
            emailAddresses: {
                business: [contactData.email]
            }
        };

        console.log("Tworzenie kontaktu:", JSON.stringify(contactPayload, null, 2));

        const createResponse = await axios.post(
            `${LEXWARE_API_URL}/contacts`,
            contactPayload,
            {
                headers: {
                    "Authorization": `Bearer ${LEXWARE_API_KEY}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }
        );

        const contactId = createResponse.data.id ||
            createResponse.headers.location?.split('/').pop();

        console.log(`Kontakt utworzony: ${contactId}`);
        return contactId!;

    } catch (error: any) {
        console.error("Błąd tworzenia/pobierania kontaktu:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Stwórz fakturę w Lexware
 */
export const createInvoice = async (
    invoiceData: InvoiceData
): Promise<LexwareInvoiceResponse> => {
    try {
        if (!LEXWARE_API_KEY) {
            throw new Error("LEXWARE_API_KEY not configured");
        }

        // 2. Przygotuj pozycje faktury według formatu Lexware
        const lineItems = invoiceData.items.map((item) => {
            const netPrice = calculateNetPrice(item.unitPrice, item.vatRate);
            const grossAmount = Math.round(item.unitPrice * 100) / 100;

            return {
                type: "custom",
                name: item.name,
                description: item.name,
                quantity: item.quantity,
                unitName: "Stück",
                unitPrice: {
                    currency: invoiceData.currency,
                    netAmount: netPrice,
                    grossAmount: grossAmount,
                    taxRatePercentage: item.vatRate
                }
            };
        });

        // 3. Przygotuj daty w formacie ISO 8601
        const now = new Date();
        const voucherDate = formatDateForLexware(now);

        console.log("Voucher Date:", voucherDate);

        // 4. Przygotuj payload faktury
        const invoicePayload = {
            voucherDate: voucherDate,
            address: {
                name: invoiceData.customerName,
                street: invoiceData.customerAddress || "",
                zip: invoiceData.customerPostalCode || "",
                city: invoiceData.customerCity || "",
                countryCode: "DE"
            },
            lineItems: lineItems,
            totalPrice: {
                currency: invoiceData.currency
            },
            shippingConditions: {
                shippingDate: voucherDate,
                shippingType: "delivery"
            },
            taxConditions: {
                taxType: "net"
            },
            title: `Rechnung ${invoiceData.orderNumber}`,
            introduction: "Vielen Dank für Ihre Bestellung.",
            remark: `Bestellnummer: ${invoiceData.orderNumber}`
        };

        console.log("Lexware Invoice Payload:", JSON.stringify(invoicePayload, null, 2));

        // 5. Utwórz fakturę
        const response = await axios.post(
            `${LEXWARE_API_URL}/invoices`,
            invoicePayload,
            {
                headers: {
                    "Authorization": `Bearer ${LEXWARE_API_KEY}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }
        );

        const invoiceId = response.data.id ||
            response.headers.location?.split('/').pop();

        if (!invoiceId) {
            throw new Error("Failed to get invoice ID from Lexware response");
        }

        console.log(`✅ Faktura utworzona: ${invoiceId}`);

        // 6. Poczekaj chwilę, aby Lexware wygenerował fakturę
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 7. Pobierz szczegóły faktury (aby uzyskać numer)
        let invoiceNumber = invoiceData.orderNumber;

        try {
            const invoiceDetails = await axios.get(
                `${LEXWARE_API_URL}/invoices/${invoiceId}`,
                {
                    headers: {
                        "Authorization": `Bearer ${LEXWARE_API_KEY}`,
                        "Accept": "application/json"
                    }
                }
            );

            invoiceNumber = invoiceDetails.data.voucherNumber || invoiceNumber;
            console.log(`✅ Numer faktury: ${invoiceNumber}`);

        } catch (detailsError: any) {
            console.warn("⚠️ Nie udało się pobrać szczegółów faktury:", detailsError.response?.data || detailsError.message);
        }

        return {
            id: invoiceId,
            invoiceNumber: invoiceNumber,
            pdfUrl: `${LEXWARE_API_URL}/invoices/${invoiceId}/document`,
            status: "created"
        };

    } catch (error: any) {
        if (error.response) {
            console.error("❌ Lexware API Error:", JSON.stringify(error.response.data, null, 2));
            throw new Error(`Failed to create invoice: ${error.response.data.message || error.message}`);
        }
        throw new Error(`Failed to create invoice: ${error.message}`);
    }
};

/**
 * Pobierz fakturę z Lexware
 */
export const getInvoice = async (invoiceId: string): Promise<any> => {
    try {
        const response = await axios.get(
            `${LEXWARE_API_URL}/invoices/${invoiceId}`,
            {
                headers: {
                    "Authorization": `Bearer ${LEXWARE_API_KEY}`,
                    "Accept": "application/json"
                }
            }
        );

        return response.data;
    } catch (error: any) {
        console.error("❌ Lexware API Error:", error.response?.data || error.message);
        throw new Error(`Failed to get invoice: ${error.message}`);
    }
};

/**
 * Pobierz PDF faktury - z retry logic
 */
export const getInvoicePDF = async (invoiceId: string, maxRetries: number = 3): Promise<Buffer> => {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📄 Próba pobrania PDF faktury ${invoiceId} (próba ${attempt}/${maxRetries})...`);

            const response = await axios.get(
                `${LEXWARE_API_URL}/invoices/${invoiceId}/document`,
                {
                    headers: {
                        "Authorization": `Bearer ${LEXWARE_API_KEY}`,
                        "Accept": "application/pdf"
                    },
                    responseType: "arraybuffer",
                    timeout: 30000 // 30 sekund timeout
                }
            );

            if (!response.data || response.data.byteLength === 0) {
                throw new Error("PDF is empty");
            }

            console.log(`✅ PDF pobrany pomyślnie: ${response.data.byteLength} bytes`);
            return Buffer.from(response.data);

        } catch (error: any) {
            lastError = error;
            console.error(`❌ Próba ${attempt} nie powiodła się:`, error.response?.data || error.message);

            // Jeśli to nie ostatnia próba, czekamy przed kolejną
            if (attempt < maxRetries) {
                const waitTime = attempt * 2000; // 2s, 4s, 6s...
                console.log(`⏳ Czekam ${waitTime}ms przed kolejną próbą...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    // Wszystkie próby się nie powiodły
    console.error(`❌ Nie udało się pobrać PDF po ${maxRetries} próbach`);
    throw new Error(`Failed to get invoice PDF after ${maxRetries} attempts: ${lastError.message}`);
};

export default {
    createInvoice,
    getInvoice,
    getInvoicePDF
};