import { Request, Response } from "express";
import practicalCourseService from "../services/practicalCourse.service";
import Location from "../models/Location";

/**
 * GET /api/admin/practical-courses/participants
 * Pobierz listę wszystkich uczestników z filtrowaniem
 */
export const getAllParticipants = async (req: Request, res: Response) => {
    try {
        const { locationId, dateId, startDate, status } = req.query;

        const filters: any = {};
        if (locationId) filters.locationId = locationId as string;
        if (dateId) filters.dateId = dateId as string;
        if (startDate) filters.startDate = startDate as string;
        if (status) filters.status = status as string;

        const participants = await practicalCourseService.getAllParticipants(filters);

        res.json({
            success: true,
            count: participants.length,
            participants,
        });
    } catch (error: any) {
        console.error("Get all participants error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get participants",
            error: error.message,
        });
    }
};

/**
 * GET /api/admin/practical-courses/participants/location/:locationId
 * Pobierz uczestników dla danej lokalizacji
 */
export const getParticipantsByLocation = async (req: Request, res: Response) => {
    try {
        const { locationId } = req.params;

        const participants = await practicalCourseService.getParticipantsByLocation(locationId);

        res.json({
            success: true,
            count: participants.length,
            locationId,
            participants,
        });
    } catch (error: any) {
        console.error("Get participants by location error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get participants",
            error: error.message,
        });
    }
};

/**
 * GET /api/admin/practical-courses/participants/date/:locationId/:dateId
 * Pobierz uczestników dla konkretnego terminu
 */
export const getParticipantsByDate = async (req: Request, res: Response) => {
    try {
        const { locationId, dateId } = req.params;

        const participants = await practicalCourseService.getParticipantsByDate(
            locationId,
            dateId
        );

        const count = await practicalCourseService.getParticipantsCount(
            locationId,
            dateId
        );

        res.json({
            success: true,
            count,
            locationId,
            dateId,
            participants,
        });
    } catch (error: any) {
        console.error("Get participants by date error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get participants",
            error: error.message,
        });
    }
};

/**
 * GET /api/admin/practical-courses/locations-with-participants
 * Pobierz wszystkie lokalizacje z liczbą uczestników dla każdego terminu
 */
export const getLocationsWithParticipants = async (req: Request, res: Response) => {
    try {
        const locations = await Location.find({ isActive: true });

        const locationsWithCounts = await Promise.all(
            locations.map(async (location) => {
                const datesWithCounts = await Promise.all(
                    location.dates.map(async (date) => {
                        const participantsCount = await practicalCourseService.getParticipantsCount(
                            location._id.toString(),
                            date.id
                        );

                        return {
                            id: date.id,
                            startDate: date.startDate,
                            endDate: date.endDate,
                            time: date.time,
                            availableSpots: date.availableSpots,
                            participantsCount,
                            totalSpots: date.availableSpots + participantsCount,
                        };
                    })
                );

                return {
                    _id: location._id,
                    city: location.city,
                    address: location.address,
                    price: location.price,
                    dates: datesWithCounts,
                };
            })
        );

        res.json({
            success: true,
            locations: locationsWithCounts,
        });
    } catch (error: any) {
        console.error("Get locations with participants error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get locations",
            error: error.message,
        });
    }
};

/**
 * POST /api/admin/practical-courses/participants/:orderNumber/cancel
 * Anuluj uczestnika (np. przy storno)
 */
export const cancelParticipant = async (req: Request, res: Response) => {
    try {
        const { orderNumber } = req.params;

        await practicalCourseService.cancelParticipant(orderNumber);

        res.json({
            success: true,
            message: "Participant cancelled successfully",
        });
    } catch (error: any) {
        console.error("Cancel participant error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel participant",
            error: error.message,
        });
    }
};

/**
 * GET /api/admin/practical-courses/stats
 * Statystyki uczestników
 */
export const getParticipantsStats = async (req: Request, res: Response) => {
    try {
        const allParticipants = await practicalCourseService.getAllParticipants();

        const confirmed = allParticipants.filter(p => p.status === "confirmed").length;
        const cancelled = allParticipants.filter(p => p.status === "cancelled").length;
        const completed = allParticipants.filter(p => p.status === "completed").length;
        const withPlasticCard = allParticipants.filter(p => p.wantsPlasticCard && p.status === "confirmed").length;

        // Grupuj po lokalizacjach
        const byLocation: any = {};
        allParticipants.forEach(p => {
            if (p.status !== "cancelled") {
                if (!byLocation[p.locationName]) {
                    byLocation[p.locationName] = 0;
                }
                byLocation[p.locationName]++;
            }
        });

        res.json({
            success: true,
            stats: {
                total: allParticipants.length,
                confirmed,
                cancelled,
                completed,
                withPlasticCard,
                byLocation,
            },
        });
    } catch (error: any) {
        console.error("Get stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get stats",
            error: error.message,
        });
    }
};

export default {
    getAllParticipants,
    getParticipantsByLocation,
    getParticipantsByDate,
    getLocationsWithParticipants,
    cancelParticipant,
    getParticipantsStats,
};