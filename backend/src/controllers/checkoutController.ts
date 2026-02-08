import { Request, Response } from "express";
import User from "../models/User";
import Course from "../models/Course";
import stripeService from "../services/stripe.service";
import orderService from "../services/order.service";
import emailService from "../services/email.service";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { calculateGrossPrice, PRICING } from "../config/pricing.config";

interface CheckoutRequest {
    // User details
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;

    // Order details
    type: "online" | "practical";

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
        price: number;
        wantsPlasticCard: boolean;
    };
}

/**
 * Create checkout session (auto-register user if needed)
 */
export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const data: CheckoutRequest = req.body;

        // Validate required fields
        if (!data.name || !data.email || !data.password || !data.type) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        let user = await User.findOne({ email: data.email });
        let isNewUser = false;

        // Create user if doesn't exist
        if (!user) {
            user = new User({
                name: data.name,
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
            // Update user details if they changed
            user.name = data.name;
            user.phone = data.phone;
            user.address = data.address;
            user.city = data.city;
            user.postalCode = data.postalCode;
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

            // Cena online course z konfiguracji (NETTO + VAT)
            const coursePrice = PRICING.getOnlineCourseGross();
            items.push({
                priceId: process.env.STRIPE_PRICE_ONLINE_COURSE,
                courseId: course._id.toString(),
                courseName: course.title,
                price: coursePrice,
                type: "online",
            });
            totalAmount = coursePrice;
        }

        if (data.type === "practical") {
            if (!data.practicalCourse) {
                return res.status(400).json({ message: "Practical course details required" });
            }

            // 1. USTAL CENY NETTO (Stripe doliczy VAT sam, jeśli wyślesz mu Netto)
            // Zakładamy, że data.practicalCourse.price to suma netto (kurs + ewentualna karta)
            const totalNetPriceFromFrontend = data.practicalCourse.price;
            const cardNetPrice = 12.60; // 14.99 / 1.19

            let courseNetPrice = totalNetPriceFromFrontend;

            // 2. JEŚLI KLIENT CHCE KARTĘ, ODEJMIJ JĄ OD CENY GŁÓWNEJ
            if (data.practicalCourse.wantsPlasticCard) {
                courseNetPrice = totalNetPriceFromFrontend - cardNetPrice;
            }

            // 3. OBLICZ BRUTTO DLA BAZY DANYCH I LEXWARE
            const courseGrossPrice = calculateGrossPrice(courseNetPrice);
            const cardGrossPrice = PRICING.getPlasticCardGross(); // 14.99

            // 4. DODAJ DO ITEMS (Wysyłaj NETTO, bo Stripe dolicza VAT - widzieliśmy to po 17.84)
            items.push({
                courseName: `Praktischer Staplerführerschein - ${data.practicalCourse.locationName}`,
                price: courseNetPrice, // Wysyłamy czyste Netto kursu
                type: "practical",
            });

            if (data.practicalCourse.wantsPlasticCard) {
                items.push({
                    courseName: "Plastikkarte Staplerführerschein",
                    price: cardNetPrice, // Wysyłamy czyste Netto karty
                    type: "practical-addon",
                });
                totalAmount = courseGrossPrice + cardGrossPrice;
            } else {
                totalAmount = courseGrossPrice;
            }

            practicalCourseDetails = {
                locationId: data.practicalCourse.locationId,
                locationName: data.practicalCourse.locationName,
                locationAddress: data.practicalCourse.locationAddress,
                dateId: data.practicalCourse.dateId,
                startDate: data.practicalCourse.startDate,
                endDate: data.practicalCourse.endDate,
                time: data.practicalCourse.time,
                availableSpots: data.practicalCourse.availableSpots,
                wantsPlasticCard: data.practicalCourse.wantsPlasticCard,
                plasticCardPrice: data.practicalCourse.wantsPlasticCard ? cardGrossPrice : undefined,
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
                email: user.email,
                phone: user.phone,
                address: user.address,
                city: user.city,
                postalCode: user.postalCode,
            },
            practicalCourseDetails: practicalCourseDetails || undefined,
        });

        // Create Stripe checkout session
        const stripeItems = items.map((item) => ({
            name: item.courseName,
            price: item.price,
            quantity: 1,
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