import { Request, Response } from "express";
import NotifyRequest from "../models/NotifyRequest";
import Product from "../models/Product";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

export const createNotifyRequest = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { email, locationId, locationCity } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Bitte geben Sie eine gültige E-Mail-Adresse ein" });
    }

    const product = await Product.findOne({ slug, status: "active" }).lean();
    if (!product) return res.status(404).json({ message: "Produkt nicht gefunden" });

    const normalizedEmail = String(email).trim().toLowerCase();

    // Zapobiegaj duplikatom tego samego zgłoszenia
    const existing = await NotifyRequest.findOne({
      productId: product._id.toString(),
      email: normalizedEmail,
      locationId: locationId || undefined,
    });

    if (existing) {
      return res.json({ success: true, alreadyExists: true });
    }

    await NotifyRequest.create({
      email: normalizedEmail,
      productId: product._id.toString(),
      productTitle: product.title?.de || product.title?.en || product.slug,
      locationId: locationId || undefined,
      locationCity: locationCity || undefined,
    });

    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const adminListNotifyRequests = async (_req: Request, res: Response) => {
  try {
    const requests = await NotifyRequest.find({}).sort({ createdAt: -1 }).lean();
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const adminDeleteNotifyRequest = async (req: Request, res: Response) => {
  try {
    await NotifyRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Gelöscht" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const adminMarkNotifyRequestDone = async (req: Request, res: Response) => {
  try {
    const request = await NotifyRequest.findByIdAndUpdate(
      req.params.id,
      { notified: true },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: "Nicht gefunden" });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
