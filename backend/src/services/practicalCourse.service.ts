import PracticalCourseParticipant, { PracticalCourseParticipantDoc } from "../models/PracticalCourseParticipant";
import Location from "../models/Location";
import { OrderDoc } from "../models/Order";

/**
 * Dodaj uczestnika do kursu praktycznego po opłaceniu zamówienia
 */
export const addParticipantToCourse = async (
    order: OrderDoc,
    userId: string,
    userName: string,
    userEmail: string,
    userPhone?: string
): Promise<PracticalCourseParticipantDoc> => {

    if (order.type !== "practical" || !order.practicalCourseDetails) {
        throw new Error("Order is not a practical course");
    }

    const details = order.practicalCourseDetails;

    // Sprawdź czy uczestnik już nie jest zapisany (na wypadek duplikatu)
    const existing = await PracticalCourseParticipant.findOne({
        orderId: order._id.toString()
    });

    if (existing) {
        console.log(`Participant already exists for order ${order.orderNumber}`);
        return existing;
    }

    // Utwórz uczestnika
    const participant = new PracticalCourseParticipant({
        userId,
        userName,
        userEmail,
        userPhone,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paidAt: order.paidAt || new Date(),
        locationId: details.locationId,
        locationName: details.locationName,
        locationAddress: details.locationAddress,
        dateId: details.dateId || generateDateId(details.startDate, details.endDate),
        startDate: details.startDate,
        endDate: details.endDate,
        time: details.time,
        wantsPlasticCard: details.wantsPlasticCard,
        status: "confirmed",
        invoiceId: order.invoiceId,
        invoiceNumber: order.invoiceNumber,
    });

    await participant.save();
    console.log(`✅ Participant added: ${userName} for ${details.locationName} (${details.startDate})`);

    return participant;
};

/**
 * Generuj ID terminu z dat (jeśli nie ma w order)
 */
const generateDateId = (startDate: string, endDate: string): string => {
    return `${startDate}_${endDate}`.replace(/\-/g, '');
};

/**
 * Zmniejsz liczbę dostępnych miejsc dla danego terminu
 */
export const decreaseAvailableSpots = async (
    locationId: string,
    dateId: string
): Promise<void> => {
    try {
        const location = await Location.findById(locationId);

        if (!location) {
            console.error(`❌ Location not found: ${locationId}`);
            return;
        }

        const dateIndex = location.dates.findIndex(d => d.id === dateId);

        if (dateIndex === -1) {
            console.error(`❌ Date not found: ${dateId} in location ${locationId}`);
            return;
        }

        const currentSpots = location.dates[dateIndex].availableSpots;

        if (currentSpots > 0) {
            location.dates[dateIndex].availableSpots = currentSpots - 1;
            await location.save();

            console.log(`✅ Decreased spots for ${location.city} (${dateId}): ${currentSpots} → ${currentSpots - 1}`);
        } else {
            console.warn(`⚠️ No available spots for ${location.city} (${dateId})`);
        }
    } catch (error: any) {
        console.error(`❌ Failed to decrease available spots:`, error.message);
    }
};

/**
 * Pobierz listę uczestników dla danego terminu
 */
export const getParticipantsByDate = async (
    locationId: string,
    dateId: string
): Promise<PracticalCourseParticipantDoc[]> => {
    return await PracticalCourseParticipant.find({
        locationId,
        dateId,
        status: { $ne: "cancelled" }
    }).sort({ createdAt: 1 });
};

/**
 * Pobierz listę uczestników dla danej lokalizacji
 */
export const getParticipantsByLocation = async (
    locationId: string
): Promise<PracticalCourseParticipantDoc[]> => {
    return await PracticalCourseParticipant.find({
        locationId,
        status: { $ne: "cancelled" }
    }).sort({ startDate: 1, createdAt: 1 });
};

/**
 * Pobierz wszystkich uczestników (z filtrowaniem)
 */
export const getAllParticipants = async (filters?: {
    locationId?: string;
    dateId?: string;
    startDate?: string;
    status?: string;
}): Promise<PracticalCourseParticipantDoc[]> => {
    const query: any = {};

    if (filters?.locationId) query.locationId = filters.locationId;
    if (filters?.dateId) query.dateId = filters.dateId;
    if (filters?.startDate) query.startDate = filters.startDate;
    if (filters?.status) query.status = filters.status;

    return await PracticalCourseParticipant.find(query).sort({ startDate: 1, createdAt: 1 });
};

/**
 * Pobierz liczbę uczestników dla danego terminu
 */
export const getParticipantsCount = async (
    locationId: string,
    dateId: string
): Promise<number> => {
    return await PracticalCourseParticipant.countDocuments({
        locationId,
        dateId,
        status: { $ne: "cancelled" }
    });
};

/**
 * Anuluj uczestnictwo (np. przy storno)
 */
export const cancelParticipant = async (
    orderNumber: string
): Promise<void> => {
    const participant = await PracticalCourseParticipant.findOne({ orderNumber });

    if (participant && participant.status !== "cancelled") {
        participant.status = "cancelled";
        await participant.save();

        // Zwiększ z powrotem liczbę miejsc
        await increaseAvailableSpots(participant.locationId, participant.dateId);

        console.log(`✅ Participant cancelled: ${participant.userName} (${orderNumber})`);
    }
};

/**
 * Zwiększ liczbę dostępnych miejsc (przy anulowaniu)
 */
export const increaseAvailableSpots = async (
    locationId: string,
    dateId: string
): Promise<void> => {
    try {
        const location = await Location.findById(locationId);

        if (!location) return;

        const dateIndex = location.dates.findIndex(d => d.id === dateId);

        if (dateIndex !== -1) {
            location.dates[dateIndex].availableSpots += 1;
            await location.save();

            console.log(`✅ Increased spots for ${location.city} (${dateId})`);
        }
    } catch (error: any) {
        console.error(`❌ Failed to increase available spots:`, error.message);
    }
};

export default {
    addParticipantToCourse,
    decreaseAvailableSpots,
    getParticipantsByDate,
    getParticipantsByLocation,
    getAllParticipants,
    getParticipantsCount,
    cancelParticipant,
    increaseAvailableSpots,
};