import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cron from "node-cron";

import authRoutes        from "./routes/auth";
import orderRoutes       from "./routes/orderRoutes";
import progressRoutes    from "./routes/progressRoutes";
import courseRoutes      from "./routes/courseRoutes";
import dashboardRoutes   from "./routes/dashboardRoutes";
import aiRoutes          from "./routes/aiRoutes";
import checkoutRoutes    from "./routes/checkout";
import webhookRoutes     from "./routes/webhooks";
import locationRoutes    from "./routes/location.routes";
import contactRoutes     from "./routes/contact.routes";
import chatRoutes        from "./routes/chatRoutes";
import practicalCourseRoutes from "./routes/practicalcourseRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import uploadRoutes      from "./routes/uploadRoutes";

import orderService from "./services/order.service";

const app = express();

// ── Webhooks need raw body ────────────────────────────────────────────────────
app.use("/api/webhooks", webhookRoutes);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()) : []),
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.trim()] : []),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else {
      console.error(`[CORS] Blocked origin: ${origin} | Allowed: ${allowedOrigins.join(", ")}`);
      cb(new Error(`CORS: Unauthorized origin ${origin}`));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));

// ── Static file serving for uploads ──────────────────────────────────────────
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(UPLOADS_DIR));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",                   authRoutes);
app.use("/api/dashboard",              dashboardRoutes);
app.use("/api/courses",                courseRoutes);
app.use("/api/orders",                 orderRoutes);
app.use("/api/progress",               progressRoutes);
app.use("/api/ai",                     aiRoutes);
app.use("/api/checkout",               checkoutRoutes);
app.use("/api/locations",              locationRoutes);
app.use("/api",                        contactRoutes);
app.use("/api/chat",                   chatRoutes);
app.use("/api/admin/practical-courses", practicalCourseRoutes);
app.use("/api/certificates",           certificateRoutes);
app.use("/api/upload",                 uploadRoutes);

// ── MongoDB ───────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/staplerschein";
mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// ── Cron jobs ─────────────────────────────────────────────────────────────────
cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running course expiration check...");
  try { await orderService.expireOldCourses(); }
  catch (err) { console.error("❌ Expiration check failed:", err); }
});

cron.schedule("0 9 * * *", async () => {
  console.log("📧 Sending expiry reminders...");
  try { await orderService.sendExpiryReminders(); }
  catch (err) { console.error("❌ Reminders failed:", err); }
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing...");
  mongoose.connection.close();
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;