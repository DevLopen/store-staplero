import { Request, Response } from "express";
import User from "../models/User";
import Course from "../models/Course";
import stripeService from "../services/stripe.service";
import orderService from "../services/order.service";
import emailService from "../services/email.service";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { calculateGrossPrice, PRICING } from "../config/pricing.config";
import Location from "../models/Location";
import Product from "../models/Product";
import { findDateIndex } from "../services/practicalCourse.service";
import { resolveName } from "../utils/name";

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

    // Cena netto widoczna dla klienta w chwili wejścia do checkoutu (do weryfikacji).
    price?: number;

    // For online courses
    courseId?: string;

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
 * Create checkout session (auto-register user if needed)
 */
export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const data: CheckoutRequest = req.body;

        // Validate required fields (imię i nazwisko są wymagane tylko przy zakładaniu nowego konta —
        // sprawdzane niżej, po ustaleniu czy użytkownik już istnieje)
        if (!data.email || !data.password || !data.type) {
            return res.status(400).json({ message: "Missing required fields" });
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
                if (!ba.vatId?.trim()) {
                    return res.status(400).json({ message: "USt-IdNr. ist für Firmenkunden erforderlich" });
                }
            } else if (!ba.name?.trim()) {
                return res.status(400).json({ message: "Name ist für die Rechnungsadresse erforderlich" });
            }
        }

        const buyerName = resolveName({ firstName: data.firstName, lastName: data.lastName, name: data.name });

        let user = await User.findOne({ email: data.email });
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
                isAdmin: false,
                purchasedCourses: [],
            });
            await user.save();
            isNewUser = true;

            // Send welcome email
            await emailService.sendWelcomeEmail(user.email, user.name);
        } else {
            // POPRAWKA: Sprawdź hasło dla istniejącego konta
            const isPasswordCorrect = await bcrypt.compare(data.password, user.password);
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

            const course = await Course.findById(data.courseId);
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
            const coursePrice = calculateGrossPrice(netPrice);
            items.push({
                priceId: process.env.STRIPE_PRICE_ONLINE_COURSE,
                courseId: course._id.toString(),
                courseName: course.title,
                price: coursePrice,
                quantity: 1,
                type: "online",
            });
            totalAmount = coursePrice;
        }

        if (data.type === "practical") {
            // 1. Sprawdź czy obiekt istnieje i przypisz go do stałej
            const pc = data.practicalCourse;

            if (!pc) {
                return res.status(400).json({ message: "Practical course details required" });
            }

            // ── Dodatkowi uczestnicy (max 5, tylko dla kursów praktycznych) ────────
            const additionalParticipants = (pc.additionalParticipants || [])
                .map((p) => (p ? resolveName(p) : null))
                .filter((p): p is { firstName: string; lastName: string; name: string } => !!p && !!p.name);

            // Każdy dodatkowy uczestnik musi mieć imię ORAZ nazwisko
            if (additionalParticipants.some((p) => !p.firstName || !p.lastName)) {
                return res.status(400).json({
                    message: "Vor- und Nachname sind für alle weiteren Teilnehmer erforderlich",
                });
            }

            if (additionalParticipants.length > MAX_ADDITIONAL_PARTICIPANTS) {
                return res.status(400).json({
                    message: `Maximal ${MAX_ADDITIONAL_PARTICIPANTS} zusätzliche Teilnehmer pro Buchung erlaubt`,
                });
            }

            const totalParticipants = 1 + additionalParticipants.length;

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
            if (data.productId) {
                const product = await Product.findById(data.productId).lean();
                if (!product || product.status !== "active" || product.type !== "normal") {
                    return res.status(400).json({ message: "Produkt nicht verfügbar" });
                }
                if (product.locationIds?.length && !product.locationIds.includes(pc.locationId)) {
                    return res.status(400).json({ message: "Standort gehört nicht zu diesem Produkt" });
                }
                courseNet = productNetPrice(product);
                // Pakiet z dostępem online — kurs bierzemy z produktu, nie z żądania
                if (product.includesOnlineAccess && product.linkedCourseId) {
                    linkedCourseId = product.linkedCourseId;
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
                const linkedCourse = await Course.findById(linkedCourseId);
                if (linkedCourse) {
                    items.push({
                        courseId: linkedCourse._id.toString(),
                        courseName: `${linkedCourse.title} (Online-Zugang)`,
                        price: 0,
                        quantity: 1,
                        type: "online",
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

        // Create order
        const order = await orderService.createOrder({
            userId: user._id.toString(),
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
            userId: user._id.toString(),
            userEmail: user.email,
            type: data.type,
            items: stripeItems,
            totalAmount,
            metadata: {
                courseId: data.courseId || "",
                ...(practicalCourseDetails && {
                    locationId: practicalCourseDetails.locationId,
                    startDate: practicalCourseDetails.startDate,
                    endDate: practicalCourseDetails.endDate,
                    time: practicalCourseDetails.time,
                    participants: String(1 + practicalCourseDetails.additionalParticipants.length),
                }),
            },
        });

        // Save session ID to order
        order.stripeSessionId = session.id;
        await order.save();

        // Generate JWT token for auto-login
        const token = jwt.sign(
            { _id: user._id, email: user.email, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "30d" }
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

        res.json({
            success: true,
            status: session.payment_status,
            order: {
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