// types/participants.ts
// Typy danych dla uczestników kursów praktycznych

/**
 * Status uczestnika kursu
 */
export type ParticipantStatus = "confirmed" | "cancelled" | "completed";

/**
 * Uczestnik kursu praktycznego
 */
export interface Participant {
    _id: string;

    // Dane użytkownika
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;

    // Dane zamówienia
    orderId: string;
    orderNumber: string;
    paidAt: string;

    // Dane kursu i lokalizacji
    locationId: string;
    locationName: string;
    locationAddress: string;

    // Dane terminu
    dateId: string;
    startDate: string;
    endDate: string;
    time: string;

    // Dodatki
    wantsPlasticCard: boolean;

    // Status
    status: ParticipantStatus;

    // Faktury (opcjonalne)
    invoiceId?: string;
    invoiceNumber?: string;

    // Timestamps
    createdAt: string;
    updatedAt?: string;
}

/**
 * Response z API dla listy uczestników
 */
export interface ParticipantsResponse {
    success: boolean;
    count: number;
    locationId: string;
    dateId: string;
    participants: Participant[];
}

/**
 * Filtry dla listy uczestników
 */
export interface ParticipantsFilters {
    searchTerm: string;
    status: ParticipantStatus | "all";
}

/**
 * Statystyki uczestników
 */
export interface ParticipantsStats {
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    withPlasticCard: number;
}

/**
 * Dane do eksportu
 */
export interface ExportData {
    participants: Participant[];
    locationName: string;
    dateInfo: string;
    exportDate: string;
}

/**
 * Props dla ParticipantsListDialog
 */
export interface ParticipantsListDialogProps {
    open: boolean;
    onClose: () => void;
    locationId: string;
    dateId: string;
    locationName: string;
    dateInfo: string;
}

/**
 * State dialogu uczestników
 */
export interface ParticipantsDialogState {
    open: boolean;
    locationId: string;
    dateId: string;
    locationName: string;
    dateInfo: string;
}

/**
 * Helper functions dla uczestników
 */

export const getStatusLabel = (status: ParticipantStatus): string => {
    const labels: Record<ParticipantStatus, string> = {
        confirmed: "Bestätigt",
        cancelled: "Storniert",
        completed: "Abgeschlossen"
    };
    return labels[status];
};

export const getStatusColor = (status: ParticipantStatus): string => {
    const colors: Record<ParticipantStatus, string> = {
        confirmed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
        completed: "bg-blue-100 text-blue-800"
    };
    return colors[status];
};

export const calculateStats = (participants: Participant[]): ParticipantsStats => {
    return {
        total: participants.length,
        confirmed: participants.filter(p => p.status === "confirmed").length,
        cancelled: participants.filter(p => p.status === "cancelled").length,
        completed: participants.filter(p => p.status === "completed").length,
        withPlasticCard: participants.filter(p => p.wantsPlasticCard && p.status === "confirmed").length,
    };
};

export const filterParticipants = (
    participants: Participant[],
    filters: ParticipantsFilters
): Participant[] => {
    let filtered = [...participants];

    // Filter by search term
    if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
            (p) =>
                p.userName.toLowerCase().includes(term) ||
                p.userEmail.toLowerCase().includes(term) ||
                p.orderNumber.toLowerCase().includes(term) ||
                (p.userPhone && p.userPhone.includes(term))
        );
    }

    // Filter by status
    if (filters.status !== "all") {
        filtered = filtered.filter((p) => p.status === filters.status);
    }

    return filtered;
};

export const formatDateInfo = (startDate: string, endDate: string, time: string): string => {
    const isSameDay = startDate === endDate;

    if (isSameDay) {
        return `${new Date(startDate).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })} • ${time}`;
    }

    return `${new Date(startDate).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    })} - ${new Date(endDate).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    })} • ${time}`;
};

export default {
    getStatusLabel,
    getStatusColor,
    calculateStats,
    filterParticipants,
    formatDateInfo
};