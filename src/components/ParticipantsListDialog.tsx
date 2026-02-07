import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Users,
    Mail,
    Phone,
    X,
    Download,
    Search,
    Award,
    CheckCircle
} from "lucide-react";

interface Participant {
    _id: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    orderNumber: string;
    paidAt: string;
    wantsPlasticCard: boolean;
    invoiceNumber?: string;
}

interface ParticipantsListDialogProps {
    open: boolean;
    onClose: () => void;
    locationId: string;
    dateId: string;
    locationName: string;
    dateInfo: string;
}

export const ParticipantsListDialog = ({
                                           open,
                                           onClose,
                                           locationId,
                                           dateId,
                                           locationName,
                                           dateInfo
                                       }: ParticipantsListDialogProps) => {
    const { toast } = useToast();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    useEffect(() => {
        if (open) {
            fetchParticipants();
            setSearchTerm(""); // Reset search when opening
        }
    }, [open, locationId, dateId]);

    useEffect(() => {
        filterParticipants();
    }, [participants, searchTerm]);

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_URL}/admin/practical-courses/participants/date/${locationId}/${dateId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!res.ok) throw new Error("Fehler beim Laden der Teilnehmer");

            const data = await res.json();
            // Filtruj tylko potwierdzonych (status === "confirmed")
            const confirmedOnly = (data.participants || []).filter(
                (p: any) => p.status === "confirmed"
            );
            setParticipants(confirmedOnly);
        } catch (error: any) {
            toast({
                title: "Fehler",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filterParticipants = () => {
        if (!searchTerm) {
            setFilteredParticipants(participants);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = participants.filter(
            (p) =>
                p.userName.toLowerCase().includes(term) ||
                p.userEmail.toLowerCase().includes(term) ||
                p.orderNumber.toLowerCase().includes(term) ||
                (p.userPhone && p.userPhone.includes(term))
        );

        setFilteredParticipants(filtered);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(16);
        doc.text("Teilnehmerliste", 14, 20);

        doc.setFontSize(10);
        doc.text(`Standort: ${locationName}`, 14, 28);
        doc.text(`Termin: ${dateInfo}`, 14, 34);
        doc.text(`Erstellt am: ${new Date().toLocaleDateString("de-DE")}`, 14, 40);
        doc.text(`Anzahl Teilnehmer: ${filteredParticipants.length}`, 14, 46);

        // Table
        const tableData = filteredParticipants.map((p, index) => [
            index + 1,
            p.userName,
            p.userEmail,
            p.userPhone || "-",
            new Date(p.paidAt).toLocaleDateString("de-DE"),
            p.wantsPlasticCard ? "Ja" : "Nein",
            p.orderNumber
        ]);

        autoTable(doc, {
            startY: 52,
            head: [["Nr.", "Name", "E-Mail", "Telefon", "Bezahlt am", "Plastikkarte", "Best.-Nr."]],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 35 },
                2: { cellWidth: 45 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25 },
                5: { cellWidth: 20 },
                6: { cellWidth: 30 }
            },
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(
                `Seite ${i} von ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: "center" }
            );
        }

        // Save
        const filename = `teilnehmer_${locationName.replace(/\s/g, "_")}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);

        toast({
            title: "PDF erstellt",
            description: "Die Teilnehmerliste wurde heruntergeladen",
        });
    };

    const exportToCSV = () => {
        const headers = [
            "Nr.",
            "Name",
            "E-Mail",
            "Telefon",
            "Bestellnummer",
            "Bezahlt am",
            "Plastikkarte",
            "Rechnungsnummer",
        ];

        const rows = filteredParticipants.map((p, index) => [
            index + 1,
            p.userName,
            p.userEmail,
            p.userPhone || "-",
            p.orderNumber,
            new Date(p.paidAt).toLocaleDateString("de-DE"),
            p.wantsPlasticCard ? "Ja" : "Nein",
            p.invoiceNumber || "-",
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map((row) => row.join(";")),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `teilnehmer_${locationName.replace(/\s/g, "_")}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast({
            title: "CSV erstellt",
            description: "Die Teilnehmerliste wurde heruntergeladen",
        });
    };

    const withCardCount = participants.filter(p => p.wantsPlasticCard).length;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-6">
                        <div>
                            <DialogTitle className="text-xl">Teilnehmerliste</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">{locationName}</p>
                            <p className="text-sm text-muted-foreground">{dateInfo}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="absolute right-4 top-4"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                        <p className="mt-4 text-muted-foreground">Lade Teilnehmer...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-2xl font-bold">{participants.length}</p>
                                            <p className="text-xs text-muted-foreground">Teilnehmer</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-blue-600">{withCardCount}</p>
                                            <p className="text-xs text-muted-foreground">Mit Plastikkarte</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Search & Export */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Suche nach Name, E-Mail, Telefon oder Bestellnummer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={exportToPDF} variant="outline" className="flex-1 md:flex-none">
                                    <Download className="w-4 h-4 mr-2" />
                                    PDF
                                </Button>
                                <Button onClick={exportToCSV} variant="outline" className="flex-1 md:flex-none">
                                    <Download className="w-4 h-4 mr-2" />
                                    CSV
                                </Button>
                            </div>
                        </div>

                        {/* Participants List */}
                        {filteredParticipants.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">
                                        {searchTerm
                                            ? "Keine Teilnehmer gefunden"
                                            : "Noch keine bezahlten Teilnehmer für diesen Termin"}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {/* Desktop View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                                                Nr.
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                                                Name
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                                                Kontakt
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                                                Bestellnummer
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                                                Bezahlt am
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">
                                                Plastikkarte
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredParticipants.map((participant, index) => (
                                            <tr key={participant._id} className="border-b border-border hover:bg-muted/30">
                                                <td className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                                                    {index + 1}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-sm">{participant.userName}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="space-y-1">
                                                        <p className="text-xs flex items-center gap-1">
                                                            <Mail className="w-3 h-3 text-muted-foreground" />
                                                            {participant.userEmail}
                                                        </p>
                                                        {participant.userPhone && (
                                                            <p className="text-xs flex items-center gap-1">
                                                                <Phone className="w-3 h-3 text-muted-foreground" />
                                                                {participant.userPhone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                            <span className="text-sm font-mono text-muted-foreground">
                              {participant.orderNumber}
                            </span>
                                                </td>
                                                <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground">
                              {new Date(participant.paidAt).toLocaleDateString("de-DE")}
                            </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {participant.wantsPlasticCard ? (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <Award className="w-3 h-3 mr-1" />
                                                            Ja
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Nein</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View */}
                                <div className="md:hidden space-y-3">
                                    {filteredParticipants.map((participant, index) => (
                                        <Card key={participant._id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-muted-foreground">
                                #{index + 1}
                              </span>
                                                            {participant.wantsPlasticCard && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <Award className="w-3 h-3 mr-1" />
                                                                    Plastikkarte
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="font-semibold text-base">{participant.userName}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-sm break-all">{participant.userEmail}</span>
                                                    </div>

                                                    {participant.userPhone && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                            <span className="text-sm">{participant.userPhone}</span>
                                                        </div>
                                                    )}

                                                    <div className="pt-2 mt-2 border-t border-border space-y-1">
                                                        <p className="text-xs text-muted-foreground">
                                                            Best.-Nr.: <span className="font-mono">{participant.orderNumber}</span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Bezahlt: {new Date(participant.paidAt).toLocaleDateString("de-DE")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ParticipantsListDialog;