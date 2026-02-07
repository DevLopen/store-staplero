/**
 * Skrypt testowy dla systemu fakturowania
 * Uruchom: ts-node scripts/testInvoiceSystem.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/Order";
import User from "../models/User";

// Załaduj zmienne środowiskowe PRZED importem serwisów
dotenv.config();

// Importuj serwisy DOPIERO PO załadowaniu zmiennych
import lexwareService from "../services/lexware.service";
import emailService from "../services/email.service";

const COLORS = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
};

const log = {
    success: (msg: string) => console.log(`${COLORS.green}✅ ${msg}${COLORS.reset}`),
    error: (msg: string) => console.log(`${COLORS.red}❌ ${msg}${COLORS.reset}`),
    warning: (msg: string) => console.log(`${COLORS.yellow}⚠️  ${msg}${COLORS.reset}`),
    info: (msg: string) => console.log(`${COLORS.blue}ℹ️  ${msg}${COLORS.reset}`),
    step: (msg: string) => console.log(`${COLORS.cyan}🔹 ${msg}${COLORS.reset}`),
};

async function testInvoiceSystem() {
    console.log("\n" + "=".repeat(60));
    console.log("🧪 TEST SYSTEMU FAKTUROWANIA");
    console.log("=".repeat(60) + "\n");

    try {
        // 1. Połącz z MongoDB
        log.step("Łączenie z MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/staplero");
        log.success("Połączono z MongoDB");

        // 2. Sprawdź konfigurację
        log.step("Sprawdzanie konfiguracji...");
        const config = checkConfiguration();

        // 3. Utwórz testowego użytkownika
        log.step("Tworzenie testowego użytkownika...");
        const testUser = await createTestUser();
        log.success(`Użytkownik utworzony: ${testUser.email}`);

        // 4. Utwórz testowe zamówienie
        log.step("Tworzenie testowego zamówienia...");
        const testOrder = await createTestOrder(testUser._id.toString());
        log.success(`Zamówienie utworzone: ${testOrder.orderNumber}`);

        let invoice = null;

        // 5. Testuj Lexware API (tylko jeśli skonfigurowane)
        if (config.hasLexware) {
            log.step("Testowanie Lexware API...");
            invoice = await testLexwareAPI(testOrder);

            if (invoice) {
                log.success(`Faktura utworzona: ${invoice.invoiceNumber}`);

                // 6. Zaktualizuj zamówienie
                log.step("Aktualizacja zamówienia...");
                testOrder.invoiceId = invoice.id;
                testOrder.invoiceNumber = invoice.invoiceNumber;
                testOrder.invoicePdfUrl = invoice.pdfUrl;
                testOrder.invoiceCreatedAt = new Date();
                await testOrder.save();
                log.success("Zamówienie zaktualizowane");

                // 7. Testuj email (tylko jeśli skonfigurowane)
                // if (config.hasResend) {
                //     log.step("Testowanie wysyłki emaila...");
                //     await testEmailService(testUser, testOrder, invoice);
                // }
            }
        } else {
            log.warning("Lexware API nie skonfigurowane - pominięto testy API");
        }

        // 8. Podsumowanie
        console.log("\n" + "=".repeat(60));
        log.success("WSZYSTKIE TESTY ZAKOŃCZONE POMYŚLNIE!");
        console.log("=".repeat(60) + "\n");

        // Wyświetl szczegóły
        displayTestResults(testOrder, invoice);

        // Cleanup
        log.step("Czyszczenie testowych danych...");
        await cleanupTestData(testUser._id.toString());
        log.success("Dane testowe usunięte");

    } catch (error: any) {
        log.error(`Test nie powiódł się: ${error.message}`);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        log.info("Połączenie z MongoDB zamknięte");
        process.exit(0);
    }
}

function checkConfiguration() {
    const required = {
        MONGODB_URI: process.env.MONGODB_URI,
        LEXWARE_API_KEY: process.env.LEXWARE_API_KEY,
        LEXWARE_ORG_ID: process.env.LEXWARE_ORG_ID,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        COMPANY_NAME: process.env.COMPANY_NAME,
    };

    const missing: string[] = [];

    for (const [key, value] of Object.entries(required)) {
        if (!value) {
            missing.push(key);
        }
    }

    const hasLexware = !!(process.env.LEXWARE_API_KEY && process.env.LEXWARE_ORG_ID);
    const hasResend = !!process.env.RESEND_API_KEY;

    if (missing.length > 0) {
        log.warning(`Brakujące zmienne: ${missing.join(", ")}`);
        log.warning("Test będzie kontynuowany z dostępnymi danymi");
    } else {
        log.success("Wszystkie wymagane zmienne są ustawione");
    }

    return { hasLexware, hasResend };
}

async function createTestUser() {
    // Usuń starego użytkownika testowego jeśli istnieje
    await User.deleteOne({ email: "test-invoice@staplero.de" });

    const user = new User({
        name: "Test Invoice User",
        email: "test-invoice@staplero.de",
        password: "test123456",
        phone: "+49 170 1234567",
        address: "Teststraße 123",
        city: "Berlin",
        postalCode: "10115",
        isAdmin: false,
        purchasedCourses: [],
    });

    await user.save();
    return user;
}

async function createTestOrder(userId: string) {
    const orderNumber = `TEST-${Date.now()}`;

    const order = new Order({
        userId,
        orderNumber,
        type: "online",
        items: [
            {
                courseName: "Staplerführerschein Online-Kurs",
                price: 64.99,
                type: "online",
            },
        ],
        totalAmount: 64.99,
        status: "paid",
        paymentIntentId: "pi_test_123456",
        paidAt: new Date(),
        userDetails: {
            name: "Test Invoice User",
            email: "test-invoice@staplero.de",
            phone: "+49 170 1234567",
            address: "Teststraße 123",
            city: "Berlin",
            postalCode: "10115",
        },
    });

    await order.save();
    return order;
}

async function testLexwareAPI(order: any) {
    try {
        const invoice = await lexwareService.createInvoice({
            orderNumber: order.orderNumber,
            customerName: order.userDetails.name,
            customerEmail: order.userDetails.email,
            customerAddress: order.userDetails.address,
            customerCity: order.userDetails.city,
            customerPostalCode: order.userDetails.postalCode,
            items: order.items.map((item: any) => ({
                name: item.courseName,
                quantity: 1,
                unitPrice: item.price,
                vatRate: 19,
            })),
            totalAmount: order.totalAmount,
            currency: "EUR",
        });

        log.success("Lexware API działa poprawnie!");
        return invoice;
    } catch (error: any) {
        log.error(`Błąd Lexware API: ${error.message}`);
        log.error(`Błąd Lexware API: ${error}`);
        return null;
    }
}

function displayTestResults(order: any, invoice: any) {
    console.log("\n📊 WYNIKI TESTÓW:\n");
    console.log(`Zamówienie:    ${order.orderNumber}`);
    console.log(`Status:        ${order.status}`);
    console.log(`Kwota:         ${order.totalAmount} EUR`);

    if (invoice) {
        console.log(`\nFaktura:       ${invoice.invoiceNumber}`);
        console.log(`ID Lexware:    ${invoice.id}`);
        console.log(`PDF URL:       ${invoice.pdfUrl || "Brak"}`);
    } else {
        console.log("\nFaktura:       Nie utworzono (brak konfiguracji lub błąd)");
    }

    console.log("\n");
}

async function cleanupTestData(userId: string) {
    await Order.deleteMany({ orderNumber: { $regex: /^TEST-/ } });
    await User.deleteOne({ _id: userId });
}

// Uruchom test
if (require.main === module) {
    testInvoiceSystem();
}

export default testInvoiceSystem;