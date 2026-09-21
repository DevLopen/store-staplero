import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Props {
    participantId: string;
    participantName: string;
    onRemoved: () => void;
    label?: string;
}

/**
 * Usuwa kursanta z listy terminu (status "cancelled"): miejsce wraca do puli, a wpis
 * zostaje w archiwum jako "Storniert". Płatność nie jest zwracana automatycznie.
 */
const RemoveParticipantButton = ({ participantId, participantName, onRemoved, label }: Props) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const remove = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/admin/practical-courses/participants/${participantId}/cancel`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Fehler beim Entfernen");
            toast({ title: "Kursant entfernt", description: `${participantName} wurde von der Liste genommen. Der Platz ist wieder frei.` });
            setOpen(false);
            onRemoved();
        } catch (e: any) {
            toast({ title: "Fehler", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button size="sm" variant="outline"
                    className="text-xs h-7 px-2.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setOpen(true)}
                    aria-label={`${participantName} entfernen`}>
                <Trash2 className="w-3 h-3 mr-1" />
                {label ?? "Entfernen"}
            </Button>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kursant entfernen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{participantName}</strong> wird von der Teilnehmerliste genommen und der Platz wird wieder freigegeben.
                            Der Eintrag bleibt im Archiv als „Storniert" sichtbar. Eine Zahlung wird dabei nicht automatisch erstattet.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); remove(); }}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-500 text-white">
                            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Entfernen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default RemoveParticipantButton;
