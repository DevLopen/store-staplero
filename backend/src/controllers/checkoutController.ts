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
        basePrice: number;
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
            // POPRAWKA: Sprawdź hasło dla istniejącego konta
            const isPasswordCorrect = await bcrypt.compare(data.password, user.password);
            if (!isPasswordCorrect) {
                return res.status(401).json({
                    message: "Ein Konto mit dieser E-Mail-Adresse existiert bereits. Bitte geben Sie das richtige Passwort ein.",
                    existingAccount: true,
                });
            }
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
            // 1. Sprawdź czy obiekt istnieje i przypisz go do stałej
            const pc = data.practicalCourse;

            if (!pc) {
                return res.status(400).json({ message: "Practical course details required" });
            }

            // Teraz używaj stałej 'pc' zamiast 'data.practicalCourse'
            const COURSE_NET = pc.basePrice;
            const CARD_NET = 14.99;
            const VAT_RATE = 1.19;

            const courseGross = Math.round(COURSE_NET * VAT_RATE * 100) / 100;
            const cardGross = Math.round(CARD_NET * VAT_RATE * 100) / 100;

            items = [];
            items.push({
                courseName: `Praktischer Staplerführerschein - ${pc.locationName}`,
                price: courseGross,
                type: "practical",
            });

            if (pc.wantsPlasticCard) {
                items.push({
                    courseName: "Plastikkarte Staplerführerschein",
                    price: cardGross,
                    type: "practical-addon",
                });
                totalAmount = Math.round((courseGross + cardGross) * 100) / 100;
            } else {
                totalAmount = courseGross;
            }

            practicalCourseDetails = {
                locationId: pc.locationId,
                locationName: pc.locationName,
                locationAddress: pc.locationAddress,
                dateId: pc.dateId,
                startDate: pc.startDate,
                endDate: pc.endDate,
                time: pc.time,
                availableSpots: pc.availableSpots,
                wantsPlasticCard: pc.wantsPlasticCard,
                plasticCardPrice: pc.wantsPlasticCard ? cardGross : undefined,
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