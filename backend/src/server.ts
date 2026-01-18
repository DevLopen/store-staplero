import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth";
import orderRoutes from "./routes/orderRoutes";
import progressRoutes from "./routes/progressRoutes";
import courseRoutes from "./routes/courseRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import aiRoutes from "./routes/aiRoutes";

dotenv.config();

const app = express();

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

// Connect MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/stapler-dashboard";
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
