import { Request, Response } from "express";
import User from "../models/User";
import Course from "../models/Course";
import LearningCourse from "../models/LearningCourse";
import QuestionBank from "../models/QuestionBank";
import stripeService from "../services/stripe.service";
import orderService from "../services/order.service";
import emailService from "../services/email.service";
import bcrypt from "bcryptjs";
import { signAuthToken, verifyAuthToken } from "../config/jwt";
import { calculateGrossPrice, PRICING } from "../config/pricing.config";
import Location from "../models/Location";
import Product from "../models/Product";
import { findDateIndex } from "../services/practicalCourse.service";
import OrderSeat from "../models/OrderSeat";
import { practicalParticipantCount, seatDisplayStatus } from "../services/orderSeat.service";
import { resolveName } from "../utils/name";
import { normalizeEmail, findUserByEmail } from "../utils/email";
import { validSeatEmail } from "../services/seatInvite.service";

/** Kurs, do którego zakup daje dostęp (UserCourse.courseId): stary kurs, nowy kurs v2 (tylko opublikowany) albo katalog pytań. */
async function findSellableCourse(id: string): Promise<{ _id: string; title: string } | null> {
    if (!/^[a-f0-9]{24}$/i.test(id)) return null;
    const old = await Course.findById(id).select("title").lean();
    if (old) return { _id: String(old._id), title: (old as any).title };
    const v2 = await LearningCourse.findOne({ _id: id, published: { $exists: true } }).select("published.title").lean();
    if (v2) return { _id: String(v2._id), title: (v2 as any).published?.title?.de || "Online-Kurs" };
    const bank = await QuestionBank.findById(id).select("title").lean();
    if (bank) return { _id: String(bank._id), title: (bank as any).title?.de || "Fragenkatalog" };
    return null;
}

interface CheckoutRequest {
    // User details — imię i nazwisko jako osobne pola (`name` tylko dla wstecznej zgodności)
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;

    // Adres do faktury, jeśli inny niż powyższy adres konta
    billingAddressDifferent?: boolean;
    billingAddress?: {
        isCompany?: boolean;
        name?: string;
        company?: string;
        vatId?: string;
        address: string;
        city: string;
        postalCode: string;
    };

    // Order details
    type: "online" | "practical";

    // Produkt z panelu (Produkty). To on jest źródłem prawdy dla ceny — cena przysłana
    // z przeglądarki (`price`, `practicalCourse.basePrice`) jest tylko WERYFIKOWANA.
    productId?: string;
    language?: string; // język strony (de/en/uk/pl) — język maili po zakupie

    // Cena netto widoczna dla klienta w chwili wejścia do checkoutu (do weryfikacji).
    price?: number;

    // For online courses
    courseId?: string;
    // Liczba dostępów online w jednym zamówieniu (1–6). Brak = 1 (stare linki).
    quantity?: number;

    // „Ich nehme selbst teil”. false = kupujący nie dostaje dostępu, wszystkie miejsca są dla innych.
    // Brak = true (dotychczasowe zachowanie).
    buyerParticipates?: boolean;

    // Opcjonalne e-maile osób na miejscach innych niż miejsce kupującego (seatIndex jak w OrderSeat:
    // online 0..n-1, praktyka = kolejność uczestników). Puste = miejsce zostaje wolne.
    seatInvites?: { seatIndex: number; email?: string }[]; // język zaproszeń = język zamówienia

    // For practical courses
    practicalCourse?: {
        locationId: string;
        locationName: string;
        locationAddress: string;
        dateId: string;        // ID terminu z Location.dates[].id
        startDate: string;
        endDate: string;
        time: string;
        availableSpots: number;
        basePrice: number;
        price: number;
        // Dodatkowe osoby zapisywane razem z główną osobą kupującą (max 5)
        additionalParticipants?: { firstName?: string; lastName?: string; name?: string }[];
    };
}

const MAX_ADDITIONAL_PARTICIPANTS = 5;
// Maksymalna liczba miejsc w jednym zamówieniu (decyzja właściciela): kurs praktyczny i dostępy online
const MAX_SEATS_PER_ORDER = 1 + MAX_ADDITIONAL_PARTICIPANTS;
const PRICE_TOLERANCE = 0.01; // różnice zaokrągleń netto (€)

const priceChangedResponse = (res: Response) =>
    res.status(409).json({
        code: "PRICE_CHANGED",
        message: "Der Preis hat sich geändert. Bitte laden Sie die Seite neu und starten Sie die Buchung erneut.",
    });

const pricesMatch = (a: number, b: number) => Math.abs(a - b) <= PRICE_TOLERANCE;

/** Aktualna cena netto produktu: promocyjna (jeśli aktywna) albo regularna. */
const productNetPrice = (product: { price: number; promoPrice?: number; isPromoActive: boolean }): number =>
    product.isPromoActive && product.promoPrice != null ? product.promoPrice : product.price;

/**
 * Zalogowany użytkownik wysyła token (Bearer) — wtedy nie wymagamy ponownie hasła.
 * Akceptujemy oba formaty payloadu: `id` (login) i `_id` (starsze tokeny z checkoutu).
 */
const getUserFromAuthHeader = async (req: Request) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return null;
    try {
        const decoded = verifyAuthToken(header.split(" ")[1]);
        const id = decoded.id || decoded._id;
        return id ? await User.findById(id) : null;
    } catch {
        return null;
    }
};

/**
 * Create checkout session (auto-register user if needed)
 */
export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const data: CheckoutRequest = req.body;
        // e-mail zawsze w jednej postaci (trim + małe litery), tak jak w rejestracji i logowaniu
        if (data && typeof data.email === "string") data.email = normalizeEmail(data.email);

        // Validate required fields (imię i nazwisko są wymagane tylko przy zakładaniu nowego konta —
        // sprawdzane niżej, po ustaleniu czy użytkownik już istnieje)
        const authedUser = await getUserFromAuthHeader(req);

        if (!data.type || (!authedUser && (!data.email || !data.password))) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (data.type !== "online" && data.type !== "practical") {
            return res.status(400).json({ message: "Invalid order type" });
        }

        // Tylko jawne `false` wyłącza udział kupującego
        if (data.buyerParticipates != null && typeof data.buyerParticipates !== "boolean") {
            return res.status(400).json({ message: "Invalid buyerParticipates" });
        }
        const buyerParticipates = data.buyerParticipates !== false;

        // Liczba dostępów online: liczba całkowita 1–6. Cena = cena jednostkowa × liczba, liczona tutaj.
        let onlineQuantity = 1;
        if (data.type === "online" && data.quantity != null) {
            if (typeof data.quantity !== "number" || !Number.isInteger(data.quantity) ||
                data.quantity < 1 || data.quantity > MAX_SEATS_PER_ORDER) {
                return res.status(400).json({
                    code: "INVALID_QUANTITY",
                    message: `Bitte wählen Sie 1 bis ${MAX_SEATS_PER_ORDER} Zugänge.`,
                });
            }
            onlineQuantity = data.quantity;
        }

        if (data.billingAddressDifferent) {
            const ba = data.billingAddress;
            if (!ba || !ba.address?.trim() || !ba.city?.trim() || !ba.postalCode?.trim()) {
                return res.status(400).json({ message: "Rechnungsadresse ist unvollständig" });
            }
            if (ba.isCompany) {
                if (!ba.company?.trim()) {
                    return res.status(400).json({ message: "Firmenname ist erforderlich" });
                }
            } else if (!ba.name?.trim()) {
                return res.status(400).json({ message: "Name ist für die Rechnungsadresse erforderlich" });
            }
        }

        // ── Opcjonalne e-maile osób (zaproszenia po płatności): format i duplikaty sprawdzamy przed
        // założeniem konta, żeby błąd w polu e-mail nie tworzył konta „po drodze” ──
        const seatInvites: { seatIndex: number; email: string }[] = [];
        if (data.seatInvites != null) {
            if (!Array.isArray(data.seatInvites) || data.seatInvites.length > MAX_SEATS_PER_ORDER) {
                return res.status(400).json({ code: "INVALID_SEAT_INVITES", message: "Ungültige E-Mail-Angaben" });
            }
            const seen = new Set<string>();
            // Kupujący, który sam uczestniczy, ma już swoje miejsce — jego adres nie może pojawić się drugi raz
            const buyerEmail = normalizeEmail(authedUser?.email || data.email);
            if (buyerParticipates && buyerEmail) seen.add(buyerEmail);
            for (const raw of data.seatInvites) {
                if (!raw || typeof raw !== "object") continue;
                const rawEmail = typeof raw.email === "string" ? raw.email.trim() : "";
                if (!rawEmail) continue; // puste pole = miejsce zostaje wolne
                const seatIndex = Number(raw.seatIndex);
                if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= MAX_SEATS_PER_ORDER) {
                    return res.status(400).json({ code: "INVALID_SEAT_INVITES", message: "Ungültige E-Mail-Angaben" });
                }
                const email = validSeatEmail(rawEmail);
                if (!email) {
                    return res.status(400).json({ code: "INVALID_SEAT_EMAIL", seatIndex, message: `Bitte prüfen Sie die E-Mail-Adresse für Platz ${seatIndex + 1}.` });
                }
                if (seen.has(email) || seatInvites.some((i) => i.seatIndex === seatIndex)) {
                    return res.status(400).json({ code: "DUPLICATE_SEAT_EMAIL", seatIndex, message: `Die E-Mail-Adresse für Platz ${seatIndex + 1} ist in dieser Bestellung schon eingetragen.` });
                }
                seen.add(email);
                seatInvites.push({ seatIndex, email });
            }
        }

        const buyerName = resolveName({ firstName: data.firstName, lastName: data.lastName, name: data.name });

        let user = authedUser ?? await findUserByEmail(data.email);
        let isNewUser = false;

        // Create user if doesn't exist
        if (!user) {
            if (!buyerName.firstName || !buyerName.lastName) {
                return res.status(400).json({ message: "Vorname und Nachname sind für ein neues Konto erforderlich" });
            }
            user = new User({
                name: buyerName.name,
                firstName: buyerName.firstName,
                lastName: buyerName.lastName,
                email: data.email,
                password: data.password,
                phone: data.phone,
                address: data.address,
                city: data.city,
                postalCode: data.postalCode,
                language: ["de", "en", "uk", "pl"].includes(String(data.language)) ? data.language : undefined,
                isAdmin: false,
                purchasedCourses: [],
            });
            await user.save();
            isNewUser = true;

            // Send welcome email — nie blokuje zakupu, jeśli wysyłka się nie uda
            emailService.sendWelcomeEmail(user.email, user.name, user.language).catch((err) =>
                console.error("❌ Welcome email failed:", err.message)
            );
        } else {
            // Sprawdź hasło dla istniejącego konta (pomijamy, gdy użytkownik jest już zalogowany)
            const isPasswordCorrect = authedUser ? true : await bcrypt.compare(data.password, user.password);
            if (!isPasswordCorrect) {
                return res.status(401).json({
                    message: "Ein Konto mit dieser E-Mail-Adresse existiert bereits. Bitte geben Sie das richtige Passwort ein.",
                    existingAccount: true,
                });
            }
            // Zaktualizuj dane usera TYLKO jeśli faktycznie podano nową wartość —
            // przy logowaniu do checkoutu z pustym formularzem (np. "mam już konto")
            // nie chcemy nadpisywać zapisanych danych pustymi polami.
            if (buyerName.name) {
                user.name = buyerName.name;
                user.firstName = buyerName.firstName;
                user.lastName = buyerName.lastName;
            }
            if (data.phone) user.phone = data.phone;
            if (data.address) user.address = data.address;
            if (data.city) user.city = data.city;
            if (data.postalCode) user.postalCode = data.postalCode;
            await user.save();
        }

        // Prepare order items
        let items: any[] = [];
        let totalAmount = 0;
        let practicalCourseDetails = null;

        if (data.type === "online") {
            if (!data.courseId) {
                return res.status(400).json({ message: "Course ID required for online course" });
            }

            const course = await findSellableCourse(String(data.courseId));
            if (!course) {
                return res.status(404).json({ message: "Course not found" });
            }

            // Cena kursu online pochodzi z Produktu w panelu (z uwzględnieniem promocji).
            // Bez productId (stary link) stosujemy domyślną cenę globalną z PRICING.
            let netPrice: number;
            if (data.productId) {
                const product = await Product.findById(data.productId).lean();
                if (!product || product.status !== "active" || product.type !== "online" ||
                    product.courseId !== course._id.toString()) {
                    return res.status(400).json({ message: "Produkt nicht verfügbar" });
                }
                netPrice = productNetPrice(product);
            } else {
                netPrice = PRICING.ONLINE_COURSE_MONTHLY_NET;
            }
            if (data.price != null && !pricesMatch(data.price, netPrice)) {
                return priceChangedResponse(res);
            }
            const coursePrice = calculateGrossPrice(netPrice); // cena JEDNOSTKOWA brutto
            items.push({
                priceId: process.env.STRIPE_PRICE_ONLINE_COURSE,
                courseId: course._id.toString(),
                courseName: course.title,
                price: coursePrice,
                quantity: onlineQuantity,
                type: "online",
            });
            totalAmount = Math.round(coursePrice * onlineQuantity * 100) / 100;
        }

        if (data.type === "practical") {
            // 1. Sprawdź czy obiekt istnieje i przypisz go do stałej
            const pc = data.practicalCourse;

            if (!pc) {
                return res.status(400).json({ message: "Practical course details required" });
            }

            // ── Dodatkowi uczestnicy (max 5, tylko dla kursów praktycznych) ────────
            if (pc.additionalParticipants != null && !Array.isArray(pc.additionalParticipants)) {
                return res.status(400).json({ message: "Invalid participants" });
            }
            const additionalParticipants = (pc.additionalParticipants || [])
                .map((p) => (p ? resolveName(p) : null))
                .filter((p): p is { firstName: string; lastName: string; name: string } => !!p && !!p.name);

            // Każdy uczestnik musi mieć imię ORAZ nazwisko (lista uczestników, certyfikat)
            if (additionalParticipants.some((p) => !p.firstName || !p.lastName)) {
                return res.status(400).json({
                    message: "Vor- und Nachname sind für alle Teilnehmer erforderlich",
                });
            }
            if (additionalParticipants.some((p) => p.firstName.length > 100 || p.lastName.length > 100)) {
                return res.status(400).json({ message: "Name zu lang" });
            }

            // Kupujący uczestniczy → on jest Teilnehmer 1, a lista to pozostałe osoby (max 5).
            // Nie uczestniczy → lista to wszyscy uczestnicy (min. 1, max 6).
            if (!buyerParticipates && additionalParticipants.length === 0) {
                return res.status(400).json({
                    message: "Bitte geben Sie Vor- und Nachname für Teilnehmer 1 an",
                });
            }
            const totalParticipants = (buyerParticipates ? 1 : 0) + additionalParticipants.length;
            if (totalParticipants > MAX_SEATS_PER_ORDER) {
                return res.status(400).json({
                    message: `Maximal ${MAX_SEATS_PER_ORDER} Teilnehmer pro Buchung erlaubt`,
                });
            }

            // Liczbę wolnych miejsc weryfikujemy w bazie — wartość z przeglądarki (pc.availableSpots)
            // może być nieaktualna albo podmieniona.
            if (!pc.locationId || !pc.dateId) {
                return res.status(400).json({ message: "Standort und Termin sind erforderlich" });
            }
            const location = await Location.findById(pc.locationId);
            if (!location) {
                return res.status(404).json({ message: "Standort nicht gefunden" });
            }
            const dateIdx = findDateIndex(location, pc.dateId);
            if (dateIdx === -1) {
                return res.status(404).json({ message: "Termin nicht gefunden" });
            }
            if (totalParticipants > location.dates[dateIdx].availableSpots) {
                return res.status(400).json({
                    message: "Nicht genügend freie Plätze für die gewählte Teilnehmerzahl",
                });
            }

            // Cena netto za osobę: z Produktu w panelu (promocja uwzględniona); dla starego linku
            // bez productId — z ceny lokalizacji. Wartość z przeglądarki tylko weryfikujemy.
            let courseNet: number;
            let linkedCourseId: string | undefined;
            let linkedAccessDays: number | undefined;
            if (data.productId) {
                const product = await Product.findById(data.productId).lean();
                if (!product || product.status !== "active" || product.type !== "normal") {
                    return res.status(400).json({ message: "Produkt nicht verfügbar" });
                }
                if (product.locationIds?.length && !product.locationIds.includes(pc.locationId)) {
                    return res.status(400).json({ message: "Standort gehört nicht zu diesem Produkt" });
                }
                courseNet = productNetPrice(product);
                // termin przypisany do innych szkoleń nie może być kupiony w tym produkcie (terminy bez przypisania działają jak dotąd)
                const pids = location.dates[dateIdx]?.productIds;
                if (pids?.length && !pids.includes(String(product._id))) {
                    return res.status(400).json({ message: "Termin gehört nicht zu diesem Produkt" });
                }
                // Pakiet z dostępem online — kurs bierzemy z produktu, nie z żądania
                if (product.includesOnlineAccess && product.linkedCourseId) {
                    linkedCourseId = product.linkedCourseId;
                    linkedAccessDays = product.onlineAccessDays || undefined;
                }
            } else {
                courseNet = location.price;
            }
            if (!pricesMatch(pc.basePrice, courseNet)) {
                return priceChangedResponse(res);
            }

            const date = location.dates[dateIdx];
            const VAT_RATE = 1.19;

            // Cena JEDNOSTKOWA (za jedną osobę) — mnożymy przez quantity, nie przez cenę
            const courseUnitGross = Math.round(courseNet * VAT_RATE * 100) / 100;

            items = [];
            items.push({
                courseName: `Praktischer Staplerführerschein - ${location.city}`,
                price: courseUnitGross,
                quantity: totalParticipants,
                type: "practical",
            });

            totalAmount = Math.round(courseUnitGross * totalParticipants * 100) / 100;

            // Pakiet: cena już zawiera dostęp online, więc dodatkowa pozycja ma cenę 0 —
            // służy wyłącznie do nadania dostępu do kursu (courseId) po opłaceniu.
            if (linkedCourseId) {
                const linkedCourse = await findSellableCourse(linkedCourseId);
                if (linkedCourse) {
                    items.push({
                        courseId: linkedCourse._id.toString(),
                        courseName: `${linkedCourse.title} (Online-Zugang)`,
                        price: 0,
                        // jeden dostęp online na uczestnika (cena 0 — zawarta w cenie kursu)
                        quantity: totalParticipants,
                        type: "online",
                        accessDays: linkedAccessDays,
                    });
                }
            }

            // Dane terminu z bazy (nie z przeglądarki) — spójne z dateId
            practicalCourseDetails = {
                locationId: location._id.toString(),
                locationName: location.city,
                locationAddress: location.address,
                dateId: date.id,
                startDate: date.startDate,
                endDate: date.endDate,
                time: date.time,
                availableSpots: date.availableSpots,
                additionalParticipants,
            };
        }

        // Zakres miejsc znamy dopiero teraz (liczba osób / dostępów)
        const seatTotal = data.type === "online"
            ? onlineQuantity
            : (buyerParticipates ? 1 : 0) + (practicalCourseDetails?.additionalParticipants.length || 0);
        if (seatInvites.some((i) => i.seatIndex < (buyerParticipates ? 1 : 0) || i.seatIndex >= seatTotal)) {
            return res.status(400).json({ code: "INVALID_SEAT_INVITES", message: "Ungültige E-Mail-Angaben" });
        }

        // Create order
        const order = await orderService.createOrder({
            seatInvites: seatInvites.length ? seatInvites : undefined,
            userId: user._id.toString(),
            productId: data.productId && /^[a-f0-9]{24}$/i.test(String(data.productId)) ? String(data.productId) : undefined,
            language: ["de", "en", "uk", "pl"].includes(String(data.language)) ? String(data.language) : undefined,
            buyerParticipates,
            type: data.type,
            items,
            totalAmount,
            status: "pending",
            userDetails: {
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                city: user.city,
                postalCode: user.postalCode,
            },
            billingAddressDifferent: !!data.billingAddressDifferent,
            billingAddress: data.billingAddressDifferent ? data.billingAddress : undefined,
            practicalCourseDetails: practicalCourseDetails || undefined,
        });

        // Create Stripe checkout session
        const stripeItems = items.map((item) => ({
            name: item.courseName,
            price: item.price,
            quantity: item.quantity ?? 1,
        }));

        const session = await stripeService.createCheckoutSession({
            orderNumber: order.orderNumber,
            orderId: String(order._id),
            userId: user._id.toString(),
            userEmail: user.email,
            type: data.type,
            items: stripeItems,
            totalAmount,
            metadata: {
                courseId: data.courseId || "",
                quantity: String(items[0]?.quantity ?? 1),
                ...(practicalCourseDetails && {
                    locationId: practicalCourseDetails.locationId,
                    startDate: practicalCourseDetails.startDate,
                    endDate: practicalCourseDetails.endDate,
                    time: practicalCourseDetails.time,
                    participants: String((buyerParticipates ? 1 : 0) + practicalCourseDetails.additionalParticipants.length),
                }),
            },
        });

        // Save session ID to order
        order.stripeSessionId = session.id;
        await order.save();

        // Generate JWT token for auto-login
        const token = signAuthToken(
            { id: user._id, _id: user._id, email: user.email, isAdmin: user.isAdmin },
            "30d"
        );

        res.json({
            success: true,
            sessionId: session.id,
            sessionUrl: session.url,
            orderNumber: order.orderNumber,
            token,
            isNewUser,
        });
    } catch (err: any) {
        console.error("Checkout error:", err);
        res.status(500).json({ message: "Checkout failed", error: err.message });
    }
};

/**
 * Verify checkout session after payment
 */
export const verifyCheckoutSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const session = await stripeService.retrieveCheckoutSession(sessionId);

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        const order = await orderService.findOrderBySessionId(sessionId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Miejsca: ile jest, ile jeszcze bez e-maila (strona sukcesu: „x von y Plätzen sind noch offen”).
        // Webhook mógł jeszcze nie dojść — wtedy liczymy z danych zamówienia.
        const buyerIn = order.buyerParticipates !== false;
        const onlineItem = order.items.find((i) => !!i.courseId);
        let seats: { total: number; open: number; withEmail: number };
        const seatDocs = order.status === "paid" ? await OrderSeat.find({ orderId: String(order._id) }).select("status expiresAt email").lean() : [];
        if (seatDocs.length) {
            const st = seatDocs.map((s: any) => seatDisplayStatus(s));
            seats = { total: seatDocs.length, open: st.filter((x) => x === "open").length, withEmail: st.filter((x) => x === "invited").length };
        } else {
            const total = order.type === "online" ? Math.max(1, onlineItem?.quantity || 1) : practicalParticipantCount(order);
            const withEmail = (order.seatInvites || []).length;
            seats = { total, open: Math.max(0, total - (buyerIn ? 1 : 0) - withEmail), withEmail };
        }

        res.json({
            success: true,
            status: session.payment_status,
            seats: { ...seats, buyerParticipates: buyerIn },
            order: {
                language: order.language,
                paidAt: order.paidAt,
                expiresAt: order.expiresAt,
                orderNumber: order.orderNumber,
                type: order.type,
                totalAmount: order.totalAmount,
                status: order.status,
                items: order.items,
                practicalCourseDetails: order.practicalCourseDetails,
            },
        });
    } catch (err: any) {
        console.error("Verify session error:", err);
        res.status(500).json({ message: "Verification failed", error: err.message });
    }
};

export default {
    createCheckoutSession,
    verifyCheckoutSession,
};