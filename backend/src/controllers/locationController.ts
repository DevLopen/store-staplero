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
        const location = new Location(req.body);
        await location.save();
        res.status(201).json(location);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateLocation = async (req: Request, res: Response) => {
    try {
        const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(location);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteLocation = async (req: Request, res: Response) => {
    try {
        await Location.findByIdAndDelete(req.params.id);
        res.json({ message: "Location deleted" });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};