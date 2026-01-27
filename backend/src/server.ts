import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cron from "node-cron";

import authRoutes from "./routes/auth";
import orderRoutes from "./routes/orderRoutes";
import progressRoutes from "./routes/progressRoutes";
import courseRoutes from "./routes/courseRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import aiRoutes from "./routes/aiRoutes";
import checkoutRoutes from "./routes/checkout";
import webhookRoutes from "./routes/webhooks";
import locationRoutes from "./routes/location.routes";

// Import services
import orderService from "./services/order.service";

dotenv.config();

const app = express();

app.use("/api/webhooks", webhookRoutes);

// Profesjonalna konfiguracja CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",") // np. "http://localhost:8081,https://moja-domena.com"
    : ["http://localhost:8080"]; // fallback dev

app.use(cors({
    origin: (origin, callback) => {
        // Pozwól jeśli brak origin (np. Postman) lub origin w liście dozwolonych
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Unauthorized origin ${origin}`));
        }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/locations", locationRoutes);

// Connect MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/stapler-dashboard";
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/**
 * Setup cron jobs for automated tasks
 */
const setupCronJobs = () => {
    // Expire old courses - runs every day at 00:00
    cron.schedule("0 0 * * *", async () => {
        console.log("🔄 Running course expiration check...");
        try {
            await orderService.expireOldCourses();
            console.log("✅ Course expiration check completed");
        } catch (err) {
            console.error("❌ Course expiration check failed:", err);
        }
    });

    // Send expiry reminders - runs every day at 09:00
    cron.schedule("0 9 * * *", async () => {
        console.log("📧 Sending course expiry reminders...");
        try {
            await orderService.sendExpiryReminders();
            console.log("✅ Expiry reminders sent");
        } catch (err) {
            console.error("❌ Failed to send expiry reminders:", err);
        }
    });

    console.log("⏰ Cron jobs scheduled");
};

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received, closing server...");
    mongoose.connection.close();
    process.exit(0);
});

export default app;
