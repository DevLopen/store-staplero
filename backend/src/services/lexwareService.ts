import axios from "axios";

const LEXWARE_API_URL = "https://api.lexware.io/v1";
const LEXWARE_API_KEY = process.env.LEXWARE_API_KEY || "your-api-key-here";
const LEXWARE_ORG_ID = process.env.LEXWARE_ORG_ID || "your-organization-id";

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
    status: string;
}

/**
 * Konfiguracja danych firmy (do uzupełnienia)
 */
const COMPANY_DATA = {
    name: process.env.COMPANY_NAME || "STAPLERO GmbH",
    address: process.env.COMPANY_ADDRESS || "Jakobstraße 13",
    city: process.env.COMPANY_CITY || "Görlitz",
    postalCode: process.env.COMPANY_POSTAL_CODE || "02826",
    country: process.env.COMPANY_COUNTRY || "DE",
    taxNumber: process.env.COMPANY_TAX_NUMBER || "DE363749650",
    bankAccount: process.env.COMPANY_BANK_ACCOUNT || "DE89 3704 0044 0532 0130 00",
};

/**
 * Generuj numer faktury
 */
const generateInvoiceNumber = (): string => {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const prefix = process.env.INVOICE_PREFIX || "INV";
    return `${prefix}-${year}-${timestamp}`;
};

/**
 * Stwórz fakturę w Lexware
 */
export const createInvoice = async (
    invoiceData: InvoiceData
): Promise<LexwareInvoiceResponse> => {
    try {
        const invoiceNumber = generateInvoiceNumber();

        // Przygotuj pozycje faktury
        const lineItems = invoiceData.items.map((item) => ({
            type: "service", // lub "product"
            name: item.name,
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            netAmount: item.unitPrice * item.quantity,
            grossAmount: item.unitPrice * item.quantity * (1 + item.vatRate / 100),
        }));

        // Payload dla Lexware API
        const payload = {
            organizationId: LEXWARE_ORG_ID,
            invoiceNumber: invoiceNumber,
            invoiceDate: new Date().toISOString().split("T")[0],
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0], // 14 dni termin płatności

            // Dane klienta
            customer: {
                name: invoiceData.customerName,
                email: invoiceData.customerEmail,
                address: {
                    street: invoiceData.customerAddress || "",
                    city: invoiceData.customerCity || "",
                    postalCode: invoiceData.customerPostalCode || "",
                    country: "DE",
                },
            },

            // Dane firmy
            supplier: {
                name: COMPANY_DATA.name,
                address: {
                    street: COMPANY_DATA.address,
                    city: COMPANY_DATA.city,
                    postalCode: COMPANY_DATA.postalCode,
                    country: COMPANY_DATA.country,
                },
                taxNumber: COMPANY_DATA.taxNumber,
                bankAccount: COMPANY_DATA.bankAccount,
            },

            // Pozycje faktury
            lineItems: lineItems,

            // Podsumowanie
            currency: invoiceData.currency,
            totalNet: lineItems.reduce((sum, item) => sum + item.netAmount, 0),
            totalGross: invoiceData.totalAmount,
            totalVat: invoiceData.totalAmount - lineItems.reduce((sum, item) => sum + item.netAmount, 0),

            // Metadane
            metadata: {
                orderNumber: invoiceData.orderNumber,
                source: "STAPLERO",
            },
        };

        // Wywołaj API Lexware
        const response = await axios.post(
            `${LEXWARE_API_URL}/invoices`,
            payload,
            {
                headers: {
                    "Authorization": `Bearer ${LEXWARE_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return {
            id: response.data.id,
            invoiceNumber: response.data.invoiceNumber || invoiceNumber,
            pdfUrl: response.data.pdfUrl,
            status: response.data.status || "created",
        };
    } catch (error: any) {
        console.error("Lexware API Error:", error.response?.data || error.message);
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
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error("Lexware API Error:", error.response?.data || error.message);
        throw new Error(`Failed to get invoice: ${error.message}`);
    }
};

/**
 * Pobierz PDF faktury
 */
export const getInvoicePDF = async (invoiceId: string): Promise<Buffer> => {
    try {
        const response = await axios.get(
            `${LEXWARE_API_URL}/invoices/${invoiceId}/pdf`,
            {
                headers: {
                    "Authorization": `Bearer ${LEXWARE_API_KEY}`,
                },
                responseType: "arraybuffer",
            }
        );

        return Buffer.from(response.data);
    } catch (error: any) {
        console.error("Lexware API Error:", error.response?.data || error.message);
        throw new Error(`Failed to get invoice PDF: ${error.message}`);
    }
};

/**
 * Anuluj fakturę
 */
export const cancelInvoice = async (invoiceId: string): Promise<void> => {
    try {
        await axios.delete(
            `${LEXWARE_API_URL}/invoices/${invoiceId}`,
            {
                headers: {
                    "Authorization": `Bearer ${LEXWARE_API_KEY}`,
                },
            }
        );
    } catch (error: any) {
        console.error("Lexware API Error:", error.response?.data || error.message);
        throw new Error(`Failed to cancel invoice: ${error.message}`);
    }
};

export default {
    createInvoice,
    getInvoice,
    getInvoicePDF,
    cancelInvoice,
};