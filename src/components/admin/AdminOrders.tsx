import { Avatar, Tile } from "@/pages/admin/adminUi";
import { useState, useEffect, useCallback } from "react";
import { Search, Eye, ShoppingBag, ChevronLeft, ChevronRight, RefreshCw, Filter, Users, CheckCircle, AlertTriangle, Loader2, Mail, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_LABELS: Record<string, string> = {
    pending:   "Ausstehend",
    paid:      "Bezahlt",
    completed: "Abgeschlossen",
    cancelled: "Storniert",
};
const STATUS_COLORS: Record<string, string> = {
    pending:   "bg-yellow-100 text-yellow-700",
    paid:      "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
};

const fmtDate = (s: string) => new Date(s).toLocaleDateString("de-DE");

// Miejsca (OrderSeat) zamówienia
const SEAT_STATUS: Record<string, { label: string; cls: string }> = {
    open:    { label: "Frei",        cls: "bg-muted text-muted-foreground" },
    invited: { label: "Eingeladen",  cls: "bg-yellow-100 text-yellow-700" },
    claimed: { label: "Belegt",      cls: "bg-green-100 text-green-700" },
    revoked: { label: "Widerrufen",  cls: "bg-red-100 text-red-700" },
    expired: { label: "Abgelaufen",  cls: "bg-red-100 text-red-700" },
};
type Seat = {
    id: string; seatIndex: number; kind: "online" | "practical"; status: string;
    email: string | null; firstName: string | null; lastName: string | null;
    expiresAt: string | null; claimedByUserId: string | null;
};
const fmtEur  = (n: number) => n.toFixed(2) + " €";
const fmtDateTime = (s: string) => new Date(s).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
const SEAT_ERR: Record<string, string> = {
    SEAT_STATE: "Der Platz ist nicht mehr belegt. Bitte neu laden.",
    ORDER_NOT_PAID: "Nur bei bezahlten Bestellungen möglich.",
    NOT_FOUND: "Nicht gefunden.",
};

const AdminOrders = () => {
    const [orders,      setOrders]      = useState<any[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [search,      setSearch]      = useState("");
    const [status,      setStatus]      = useState("");
    const [page,        setPage]        = useState(1);
    const [totalPages,  setTotalPages]  = useState(1);
    const [total,       setTotal]       = useState(0);
    const [detail,      setDetail]      = useState<any | null>(null);
    const [updating,    setUpdating]    = useState<string | null>(null);
    const [syncing,     setSyncing]     = useState(false);
    const [syncMsg,     setSyncMsg]     = useState<{ ok: boolean; text: string } | null>(null);
    const [resending,   setResending]   = useState(false);
    const [resendMsg,   setResendMsg]   = useState<{ ok: boolean; text: string } | null>(null);
    const [seats,       setSeats]       = useState<Seat[] | null>(null);
    const [seatsError,  setSeatsError]  = useState(false);
    const [confirm,     setConfirm]     = useState<{ kind: "revoke" } | { kind: "reset"; seat: Seat } | null>(null);
    const [acting,      setActing]      = useState(false);
    const [actionMsg,   setActionMsg]   = useState<{ ok: boolean; text: string } | null>(null);

    const authH = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const fetch_ = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({
                page: String(page), limit: "20",
                ...(search && { search }),
                ...(status && { status }),
            });
            const res = await fetch(`${API}/orders?${p}`, { headers: authH() });
            if (res.ok) {
                const d = await res.json();
                setOrders(d.orders || []);
                setTotal(d.total || 0);
                setTotalPages(d.totalPages || 1);
            }
        } catch {} finally { setLoading(false); }
    }, [page, search, status]);

    useEffect(() => { fetch_(); }, [fetch_]);

    // Miejsca ładujemy przy otwarciu szczegółów zamówienia
    const detailId = detail ? String(detail._id || detail.id) : null;
    const [seatsReload, setSeatsReload] = useState(0);
    useEffect(() => {
        setSeats(null);
        setSeatsError(false);
        if (!detailId) return;
        let cancelled = false;
        fetch(`${API}/orders/${detailId}/seats`, { headers: authH() })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((d) => { if (!cancelled) setSeats(d.seats || []); })
            .catch(() => { if (!cancelled) setSeatsError(true); });
        return () => { cancelled = true; };
    }, [detailId, seatsReload]);
    useEffect(() => { setActionMsg(null); setConfirm(null); }, [detailId]);

    const patchOrder = (id: string, patch: Record<string, any>) => {
        setOrders((prev) => prev.map((o) => (String(o._id || o.id) === id ? { ...o, ...patch } : o)));
        setDetail((d: any) => (d && String(d._id || d.id) === id ? { ...d, ...patch } : d));
    };

    // Zugang entziehen / belegten Platz freigeben (Erstattungen macht der Inhaber selbst in Stripe)
    const runConfirmed = async () => {
        if (!confirm || !detailId) return;
        setActing(true);
        setActionMsg(null);
        try {
            const url = confirm.kind === "revoke"
                ? `${API}/orders/${detailId}/revoke-access`
                : `${API}/orders/${detailId}/seats/${confirm.seat.id}/reset`;
            const res = await fetch(url, { method: "POST", headers: authH() });
            const d = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(SEAT_ERR[d.code] || d.message || "Aktion fehlgeschlagen");
            if (confirm.kind === "revoke") {
                patchOrder(detailId, { status: "cancelled", accessRevokedAt: d.accessRevokedAt, accessRevokedBy: d.accessRevokedBy ?? "admin" });
                const r = d.result || {};
                setActionMsg({ ok: true, text: `Zugänge entzogen: ${r.seatsRevoked ?? 0} Plätze widerrufen, ${r.accessesRevoked ?? 0} Online-Zugänge beendet, ${r.participantsCancelled ?? 0} Teilnehmer storniert.` });
            } else {
                setActionMsg({ ok: true, text: `Platz ${confirm.seat.seatIndex + 1} ist wieder frei. Der Käufer kann jetzt eine andere Person einladen.` });
            }
            setSeatsReload((n) => n + 1);
            setConfirm(null);
        } catch (e: any) {
            setActionMsg({ ok: false, text: e.message });
        } finally {
            setActing(false);
        }
    };

    useEffect(() => { setPage(1); }, [search, status]);

    const updateStatus = async (id: string, newStatus: string) => {
        setUpdating(id);
        try {
            await fetch(`${API}/orders/${id}/status`, {
                method: "PUT",
                headers: authH(),
                body: JSON.stringify({ status: newStatus }),
            });
            setOrders(prev => prev.map(o => o._id === id || o.id === id ? { ...o, status: newStatus } : o));
        } catch {} finally { setUpdating(null); }
    };

    // Dopisuje brakujących uczestników do opłaconego zamówienia (idempotentne) i odświeża listę
    const syncParticipants = async (order: any) => {
        setSyncing(true); setSyncMsg(null);
        try {
            const res = await fetch(`${API}/orders/${order._id || order.id}/sync-participants`, {
                method: "POST", headers: authH(),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.message || "Fehler");
            setSyncMsg({ ok: true, text: d.message });

            const p = new URLSearchParams({ page: String(page), limit: "20", ...(search && { search }), ...(status && { status }) });
            const listRes = await fetch(`${API}/orders?${p}`, { headers: authH() });
            if (listRes.ok) {
                const list = await listRes.json();
                setOrders(list.orders || []);
                const fresh = (list.orders || []).find((o: any) => (o._id || o.id) === (order._id || order.id));
                if (fresh) setDetail(fresh);
            }
        } catch (e: any) {
            setSyncMsg({ ok: false, text: e.message });
        } finally { setSyncing(false); }
    };

    // Ponownie wysyła klientowi mail z informacjami o kursie (termin, dojazd / dostęp online)
    const resendConfirmation = async (order: any) => {
        setResending(true); setResendMsg(null);
        try {
            const id = order._id || order.id;
            const res = await fetch(`${API}/orders/${id}/resend-confirmation`, { method: "POST", headers: authH() });
            const d = await res.json();
            if (!res.ok) throw new Error(d.message || "Fehler");
            setResendMsg({ ok: true, text: d.message });
            const patch = { confirmationEmailSentAt: d.confirmationEmailSentAt, confirmationEmailError: undefined };
            setDetail((prev: any) => (prev ? { ...prev, ...patch } : prev));
            setOrders(prev => prev.map(o => (o._id || o.id) === id ? { ...o, ...patch } : o));
        } catch (e: any) {
            setResendMsg({ ok: false, text: e.message });
        } finally { setResending(false); }
    };

    // Kontrola zapisu uczestników: ile powinno być vs ile faktycznie jest w kursie
    const participantsBadge = (o: any) => {
        if (o.type !== "practical") return <span className="text-xs text-muted-foreground">–</span>;
        const expected = o.expectedParticipants || 0;
        const registered = o.registeredParticipants || 0;
        const isPaid = o.status === "paid" || o.status === "completed";
        const missing = isPaid && registered < expected;
        return (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                missing ? "bg-red-100 text-red-700" : "bg-muted text-foreground"
            }`}>
                <Users className="w-3 h-3" />
                {isPaid ? `${registered}/${expected}` : expected}
            </span>
        );
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold">Bestellungen</h2>
                    <p className="text-sm text-muted-foreground">{total} gesamt</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetch_}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Aktualisieren
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text" placeholder="Name, E-Mail oder Bestellnr. suchen…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <Select value={status || "all"} onValueChange={v => setStatus(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-44">
                        <Filter className="w-3.5 h-3.5 mr-2" />
                        <SelectValue placeholder="Alle Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alle Status</SelectItem>
                        <SelectItem value="pending">Ausstehend</SelectItem>
                        <SelectItem value="paid">Bezahlt</SelectItem>
                        <SelectItem value="completed">Abgeschlossen</SelectItem>
                        <SelectItem value="cancelled">Storniert</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Keine Bestellungen gefunden</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    {["Bestellung", "Kunde", "Datum", "Teilnehmer", "Betrag", "Status", "Aktionen"].map(h => (
                                        <th key={h} className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {orders.map(o => (
                                    <tr key={o._id || o.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                        <td className="px-4 py-3 font-mono text-sm font-semibold">
                                            #{o.orderNumber || o.id}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-start gap-2.5"><Avatar name={o.userName || o.user?.name || "?"} />
                                            <div><p className="text-sm font-medium">{o.userName || o.user?.name}</p>
                                            <p className="text-xs text-muted-foreground">{o.userEmail || o.user?.email}</p>
                                            {o.customerInfo?.address && (
                                                <p className="text-xs text-muted-foreground">
                                                    {o.customerInfo.address}, {o.customerInfo.postalCode} {o.customerInfo.city}
                                                </p>
                                            )}
                                        </div></div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {fmtDate(o.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">{participantsBadge(o)}</td>
                                        <td className="px-4 py-3 font-semibold text-sm">
                                            {fmtEur(o.totalAmount || o.total || 0)}
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[o.status] || "bg-muted text-muted-foreground"}`}>
                                                    {STATUS_LABELS[o.status] || o.status}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                                        onClick={() => setDetail(o)}>
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                                <Select
                                                    value={o.status}
                                                    onValueChange={v => updateStatus(o._id || o.id, v)}>
                                                    <SelectTrigger className="h-7 w-32 text-xs" disabled={updating === (o._id || o.id)}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                                                            <SelectItem key={v} value={v}>{l}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Seite {page} von {totalPages} · {total} Bestellungen</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p-1)} disabled={page <= 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={page >= totalPages}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Order detail dialog */}
            {detail && (
                <Dialog open onOpenChange={() => { setDetail(null); setSyncMsg(null); setResendMsg(null); }}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Bestellung #{detail.orderNumber || detail.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ["Kunde", detail.userName || detail.user?.name || "–"],
                                    ["E-Mail", detail.userEmail || detail.user?.email || "–"],
                                    ["Telefon", detail.customerInfo?.phone || "–"],
                                    ["Datum", fmtDate(detail.createdAt)],
                                    ["Betrag", fmtEur(detail.totalAmount || detail.total || 0)],
                                    ["Status", STATUS_LABELS[detail.status] || detail.status],
                                    ["Bezahlt am", detail.paidAt ? fmtDate(detail.paidAt) : "–"],
                                    ["Rechnung", detail.invoiceNumber || "–"],
                                ].map(([l, v]) => (
                                    <div key={l} className="bg-muted/30 rounded-lg p-3">
                                        <p className="text-xs text-muted-foreground mb-1">{l}</p>
                                        <p className="font-semibold">{v}</p>
                                    </div>
                                ))}

                                {(detail.status === "paid" || detail.status === "completed") && (
                                    <div className="bg-muted/30 rounded-lg p-3 col-span-2 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Kursdetails an Kunden (Termin, Uhrzeit, Anfahrt)</p>
                                            {detail.confirmationEmailSentAt ? (
                                                <p className="font-semibold">
                                                    Gesendet am {new Date(detail.confirmationEmailSentAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                                                </p>
                                            ) : detail.confirmationEmailError ? (
                                                <p className="font-semibold text-red-700">Fehlgeschlagen: {detail.confirmationEmailError}</p>
                                            ) : (
                                                <p className="font-semibold text-muted-foreground">Keine Angabe (Bestellung vor dem Update)</p>
                                            )}
                                            {resendMsg && (
                                                <p className={`text-xs mt-1 ${resendMsg.ok ? "text-green-700" : "text-red-700"}`}>{resendMsg.text}</p>
                                            )}
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => resendConfirmation(detail)} disabled={resending}>
                                            {resending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 mr-1.5" />}
                                            {detail.confirmationEmailSentAt ? "Kursdetails erneut senden" : "Kursdetails per E-Mail senden"}
                                        </Button>
                                    </div>
                                )}

                                {detail.accessRevokedAt && (
                                    <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                                        <p className="text-xs text-muted-foreground mb-1">Zugang entzogen</p>
                                        <p className="font-semibold">{fmtDateTime(detail.accessRevokedAt)}{detail.accessRevokedBy ? ` · ${detail.accessRevokedBy}` : ""}</p>
                                    </div>
                                )}

                                {actionMsg && (
                                    <p className={`col-span-2 text-xs rounded-lg px-3 py-2 ${actionMsg.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{actionMsg.text}</p>
                                )}

                                {(detail.customerInfo?.address || detail.customerInfo?.city) && (
                                    <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                                        <p className="text-xs text-muted-foreground mb-1">Adresse</p>
                                        <p className="font-semibold">
                                            {[
                                                detail.customerInfo?.address,
                                                detail.customerInfo?.postalCode && detail.customerInfo?.city
                                                    ? `${detail.customerInfo.postalCode} ${detail.customerInfo.city}`
                                                    : detail.customerInfo?.city,
                                            ].filter(Boolean).join(", ")}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {detail.items?.length > 0 && (
                                <div>
                                    <p className="font-semibold mb-2">Artikel</p>
                                    {detail.items.map((item: any, i: number) => {
                                        const qty = item.quantity || 1;
                                        return (
                                            <div key={i} className="flex justify-between gap-3 text-sm py-1.5 border-b border-border last:border-0">
                                                <span>
                                                    {item.name || item.courseName}
                                                    {qty > 1 && <span className="text-muted-foreground"> × {qty}</span>}
                                                </span>
                                                <span className="font-semibold whitespace-nowrap">
                                                    {qty > 1 && (
                                                        <span className="text-xs text-muted-foreground font-normal mr-2">
                                                            {qty} × {fmtEur(item.price || 0)}
                                                        </span>
                                                    )}
                                                    {fmtEur((item.price || 0) * qty)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {detail.type === "practical" && detail.practicalCourseDetails && (
                                <div className="bg-muted/30 rounded-lg p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Termin</p>
                                    <p className="font-semibold">
                                        {detail.practicalCourseDetails.locationName}
                                        {detail.practicalCourseDetails.locationAddress && (
                                            <span className="font-normal text-muted-foreground"> · {detail.practicalCourseDetails.locationAddress}</span>
                                        )}
                                    </p>
                                    <p>
                                        {fmtDate(detail.practicalCourseDetails.startDate)}
                                        {detail.practicalCourseDetails.endDate !== detail.practicalCourseDetails.startDate &&
                                            ` – ${fmtDate(detail.practicalCourseDetails.endDate)}`}
                                        {detail.practicalCourseDetails.time && ` · ${detail.practicalCourseDetails.time}`}
                                    </p>
                                </div>
                            )}

                            {/* ── Plätze (OrderSeat) ── */}
                            <div>
                                <p className="font-semibold mb-2 flex items-center gap-2">
                                    <Ticket className="w-4 h-4" />
                                    Plätze{seats && seats.length > 0 && ` (${seats.filter((s) => s.status === "claimed").length}/${seats.length} belegt)`}
                                </p>
                                {detail.buyerParticipates === false && (
                                    <p className="text-xs text-muted-foreground mb-2">Käufer nimmt nicht selbst teil.</p>
                                )}
                                {seatsError ? (
                                    <p className="text-xs text-red-700">Plätze konnten nicht geladen werden.</p>
                                ) : seats === null ? (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Lädt …</p>
                                ) : seats.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        {detail.status === "pending" ? "Plätze entstehen nach der Zahlung." : "Keine Plätze (Bestellung vor dem Update)."}
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-border rounded-lg border border-border">
                                        {seats.map((s) => {
                                            const st = SEAT_STATUS[s.status] || { label: s.status, cls: "bg-muted text-muted-foreground" };
                                            const name = [s.firstName, s.lastName].filter(Boolean).join(" ");
                                            return (
                                                <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
                                                    <span className="w-14 shrink-0 text-xs text-muted-foreground">Platz {s.seatIndex + 1}</span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate font-medium">
                                                            {name || <span className="text-muted-foreground font-normal">Ohne Namen</span>}
                                                            {s.claimedByUserId && s.claimedByUserId === String(detail.userId) && (
                                                                <span className="text-xs text-muted-foreground font-normal"> (Käufer)</span>
                                                            )}
                                                        </span>
                                                        <span className="block truncate text-xs text-muted-foreground">
                                                            {s.email || "Keine E-Mail"} · {s.kind === "online" ? "Online" : "Praxis"}
                                                            {s.expiresAt && ` · bis ${fmtDate(s.expiresAt)}`}
                                                        </span>
                                                    </span>
                                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                                                    {s.status === "claimed" && detail.status === "paid" && (
                                                        <Button size="sm" variant="outline" className="shrink-0 h-7 px-2.5 text-xs"
                                                                onClick={() => setConfirm({ kind: "reset", seat: s })}
                                                                aria-label={`Platz ${s.seatIndex + 1} freigeben`}>
                                                            Freigeben
                                                        </Button>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>

                            {detail.type === "practical" && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Teilnehmer ({detail.registeredParticipants}/{detail.expectedParticipants} eingetragen)
                                        </p>
                                        {(detail.status === "paid" || detail.status === "completed") &&
                                            detail.registeredParticipants < detail.expectedParticipants && (
                                            <Button size="sm" variant="outline" onClick={() => syncParticipants(detail)} disabled={syncing}>
                                                {syncing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                                                Fehlende eintragen
                                            </Button>
                                        )}
                                    </div>
                                    {syncMsg && (
                                        <p className={`text-xs rounded-lg px-3 py-2 mb-2 ${syncMsg.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {syncMsg.text}
                                        </p>
                                    )}
                                    {detail.status === "pending" && (
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Die Teilnehmer werden nach erfolgreicher Zahlung automatisch in den Kurs eingetragen.
                                        </p>
                                    )}
                                    {(detail.participants || []).map((p: any) => {
                                        const isPaid = detail.status === "paid" || detail.status === "completed";
                                        return (
                                            <div key={p.seatIndex} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                                                <span>
                                                    {p.firstName} {p.lastName}
                                                    {p.isBuyer && <span className="text-xs text-muted-foreground"> (Käufer)</span>}
                                                </span>
                                                {p.registered ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Im Kurs eingetragen
                                                    </span>
                                                ) : isPaid ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                                        <AlertTriangle className="w-3.5 h-3.5" /> Nicht eingetragen
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Ausstehend</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── Zugang entziehen ── */}
                            {["paid", "expired", "cancelled"].includes(detail.status) && !!detail.paidAt && !detail.accessRevokedAt && (
                                <div className="rounded-lg border border-red-200 p-3 flex flex-wrap items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold">Zugang entziehen</p>
                                        <p className="text-xs text-muted-foreground">Alle Plätze und Einladungen ungültig, Online-Zugänge beendet, Teilnehmer storniert. Zum Beispiel nach einer Erstattung in Stripe.</p>
                                    </div>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => setConfirm({ kind: "revoke" })}>
                                        Zugang entziehen
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o && !acting) setConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirm?.kind === "reset" ? `Platz ${confirm.seat.seatIndex + 1} freigeben?` : "Alle Zugänge entziehen?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm?.kind === "reset" ? (
                                <><strong>{[confirm.seat.firstName, confirm.seat.lastName].filter(Boolean).join(" ") || confirm.seat.email || "Diese Person"}</strong> verliert den Zugang aus diesem Platz. Der Platz ist danach wieder offen und der Käufer kann eine andere Person einladen.{confirm.seat.kind === "practical" ? " Name auf der Teilnehmerliste bleibt, bis der Käufer ihn ändert." : ""}</>
                            ) : (
                                <>Bestellung <strong>#{detail?.orderNumber}</strong>: alle Plätze werden widerrufen, offene Einladungen funktionieren nicht mehr, Online-Zugänge enden sofort und Teilnehmer werden storniert. Die Bestellung erhält den Status „Storniert“. Das lässt sich nicht automatisch rückgängig machen.</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={acting}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); runConfirmed(); }}
                            disabled={acting}
                            className="bg-red-600 hover:bg-red-500 text-white">
                            {acting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {confirm?.kind === "reset" ? "Platz freigeben" : "Zugang entziehen"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminOrders;