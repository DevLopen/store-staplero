import { useState, useEffect, useCallback } from "react";
import { Search, Eye, ShoppingBag, ChevronLeft, ChevronRight, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
const fmtEur  = (n: number) => n.toFixed(2) + " €";

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
                                    {["Bestellung", "Kunde", "Datum", "Betrag", "Status", "Aktionen"].map(h => (
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
                                            <p className="text-sm font-medium">{o.userName || o.user?.name}</p>
                                            <p className="text-xs text-muted-foreground">{o.userEmail || o.user?.email}</p>
                                            {o.customerInfo?.address && (
                                                <p className="text-xs text-muted-foreground">
                                                    {o.customerInfo.address}, {o.customerInfo.postalCode} {o.customerInfo.city}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {fmtDate(o.createdAt)}
                                        </td>
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
                <Dialog open onOpenChange={() => setDetail(null)}>
                    <DialogContent className="max-w-lg">
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
                                    ["Zahlungsmethode", detail.paymentMethod || "–"],
                                ].map(([l, v]) => (
                                    <div key={l} className="bg-muted/30 rounded-lg p-3">
                                        <p className="text-xs text-muted-foreground mb-1">{l}</p>
                                        <p className="font-semibold">{v}</p>
                                    </div>
                                ))}

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
                                    {detail.items.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                                            <span>{item.name || item.courseName}</span>
                                            <span className="font-semibold">{fmtEur(item.price || 0)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default AdminOrders;