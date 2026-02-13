// backend/src/controllers/location.controller.ts
import { Request, Response } from "express";
import Location from "../models/Location";

export const getAllLocations = async (req: Request, res: Response) => {
    try {
        const locations = await Location.find({ isActive: true });
        res.json(locations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createLocation = async (req: Request, res: Response) => {
    try {
        // ✅ Validate and sanitize dates
        if (req.body.dates && Array.isArray(req.body.dates)) {
            req.body.dates = req.body.dates.map((date: any) => ({
                ...date,
                availableSpots: Math.max(0, parseInt(date.availableSpots) || 0)
            }));
        }

        const location = new Location(req.body);
        await location.save();
        res.status(201).json(location);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((e: any) => e.message);
            return res.status(400).json({
                message: 'Validation failed',
                errors
            });
        }
        res.status(400).json({ message: error.message });
    }
};

export const updateLocation = async (req: Request, res: Response) => {
    try {
        // ✅ Validate and sanitize dates
        if (req.body.dates && Array.isArray(req.body.dates)) {
            req.body.dates = req.body.dates.map((date: any) => {
                const spots = parseInt(date.availableSpots);
                return {
                    ...date,
                    availableSpots: isNaN(spots) ? 0 : Math.max(0, spots)
                };
            });
        }

        const location = await Location.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
                context: 'query' // ✅ Important for custom validators
            }
        );

        if (!location) {
            return res.status(404).json({ message: "Location not found" });
        }

        res.json(location);
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((e: any) => e.message);
            return res.status(400).json({
                message: 'Validation failed',
                errors
            });
        }
        res.status(400).json({ message: error.message });
    }
};

export const deleteLocation = async (req: Request, res: Response) => {
    try {
        const location = await Location.findByIdAndDelete(req.params.id);
        if (!location) {
            return res.status(404).json({ message: "Location not found" });
        }
        res.json({ message: "Location deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// ✅ NEW: Get location with available dates only
export const getLocationWithAvailableDates = async (req: Request, res: Response) => {
    try {
        const location = await Location.findById(req.params.id);
        if (!location || !location.isActive) {
            return res.status(404).json({ message: "Location not found" });
        }

        // Filter to only available dates
        const availableDates = location.dates.filter(date => date.availableSpots > 0);

        res.json({
            ...location.toObject(),
            dates: availableDates
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ NEW: Check date availability
export const checkDateAvailability = async (req: Request, res: Response) => {
    try {
        const { locationId, dateId } = req.params;
        const location = await Location.findById(locationId);

        if (!location) {
            return res.status(404).json({ message: "Location not found" });
        }

        const date = location.dates.find(d => d.id === dateId);

        if (!date) {
            return res.status(404).json({ message: "Date not found" });
        }

        res.json({
            available: date.availableSpots > 0,
            availableSpots: date.availableSpots
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};