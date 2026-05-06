import { useState, useEffect, useCallback } from "react";
import {
    Award, Search, Download, ShieldOff, ShieldCheck,
    Loader2, ChevronLeft, ChevronRight, RefreshCw,
    CheckCircle, XCircle, Filter, Users, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Certificate {
    _id: string;
    verificationCode: string;
    type: "online" | "practical";
    userName: string;
    userEmail: string;
    courseName: string;
    trainingDate: string;
    trainingLocation?: string;
    issuedAt: string;
    score?: number;
    revokedAt?: string;
    revokedReason?: string;
    instructorName?: string;
}

interface Stats {
    total: number;
    online: number;
    practical: number;
    revoked: number;
    thisMonth: number;
}

const AdminCertificates = () => {
    const [certs, setCerts] = useState<Certificate[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<"" | "online" | "practical">("");
    const [revokedFilter, setRevokedFilter] = useState<"" | "false" | "true">("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [revokeModal, setRevokeModal] = useState<Certificate | null>(null);
    const [revokeReason, setRevokeReason] = useState("");

    const authHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/certificates/admin/stats`, { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch {}
    };

    const fetchCerts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "15",
                ...(search && { search }),
                ...(typeFilter && { type: typeFilter }),
                ...(revokedFilter && { revoked: revokedFilter }),
            });
            const res = await fetch(`${API_URL}/certificates/admin/all?${params}`, {
                headers: authHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setCerts(data.certificates);
                setTotalPages(data.pagination.pages);
                setTotal(data.pagination.total);
            }
        } catch {} finally {
            setLoading(false);
        }
    }, [page, search, typeFilter, revokedFilter]);

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { fetchCerts(); }, [fetchCerts]);

    const handleDownload = async (certId: string, code: string) => {
        setActionLoading(`dl-${certId}`);
        try {
            const res = await fetch(`${API_URL}/certificates/admin/${certId}/download`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Staplerschein-${code}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert("Download fehlgeschlagen");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevoke = async () => {
        if (!revokeModal) return;
        setActionLoading(`rev-${revokeModal._id}`);
        try {
            const res = await fetch(`${API_URL}/certificates/admin/${revokeModal._id}/revoke`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ reason: revokeReason }),
            });
            if (res.ok) {
                setRevokeModal(null);
                setRevokeReason("");
                fetchCerts();
                fetchStats();
            }
        } catch {} finally {
            setActionLoading(null);
        }
    };

    const handleRestore = async (certId: string) => {
        if (!confirm("Zertifikat wiederherstellen?")) return;
        setActionLoading(`res-${certId}`);
        try {
            const res = await fetch(`${API_URL}/certificates/admin/${certId}/restore`, {
                method: "POST",
                headers: authHeaders(),
            });
            if (res.ok) { fetchCerts(); fetchStats(); }
        } catch {} finally {
            setActionLoading(null);
        }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

    return (
        <div className="space-y-6">
            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { label: "Gesamt", value: stats.total, icon: Award, color: "text-amber-400" },
                        { label: "Online", value: stats.online, icon: FileCheck, color: "text-blue-400" },
                        { label: "Praxis", value: stats.practical, icon: Users, color: "text-green-400" },
                        { label: "Widerrufen", value: stats.revoked, icon: XCircle, color: "text-red-400" },
                        { label: "Diesen Monat", value: stats.thisMonth, icon: CheckCircle, color: "text-purple-400" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-4 h-4 ${color}`} />
                                <span className="text-muted-foreground text-xs">{label}</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Name, E-Mail oder Zertifikat-Nr."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
                        className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">Alle Typen</option>
                        <option value="online">Online</option>
                        <option value="practical">Praxis</option>
                    </select>
                    <select
                        value={revokedFilter}
                        onChange={(e) => { setRevokedFilter(e.target.value as any); setPage(1); }}
                        className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="">Alle Status</option>
                        <option value="false">Gültig</option>
                        <option value="true">Widerrufen</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={fetchCerts} className="shrink-0">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">
                        Zertifikate ({total})
                    </h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : certs.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground text-sm">
                        Keine Zertifikate gefunden
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30">
                            <tr>
                                {["Code", "Name / E-Mail", "Typ", "Kurs", "Ausbildung", "Ausgestellt", "Status", ""].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                            {certs.map((cert) => (
                                <tr key={cert._id} className={`hover:bg-muted/20 transition-colors ${cert.revokedAt ? "opacity-60" : ""}`}>
                                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-amber-500 tracking-wider">
                        {cert.verificationCode}
                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-foreground text-xs">{cert.userName}</p>
                                        <p className="text-muted-foreground text-xs">{cert.userEmail}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant="outline"
                                            className={cert.type === "practical"
                                                ? "border-green-500/30 text-green-500 text-[10px]"
                                                : "border-blue-500/30 text-blue-500 text-[10px]"}
                                        >
                                            {cert.type === "practical" ? "Praxis" : "Online"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-xs text-foreground max-w-[150px] truncate">{cert.courseName}</p>
                                        {cert.trainingLocation && (
                                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{cert.trainingLocation}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDate(cert.trainingDate)}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDate(cert.issuedAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {cert.revokedAt ? (
                                            <div>
                                                <Badge variant="destructive" className="text-[10px]">Widerrufen</Badge>
                                                {cert.revokedReason && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[100px] truncate" title={cert.revokedReason}>
                                                        {cert.revokedReason}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="border-green-500/30 text-green-500 text-[10px]">
                                                Gültig
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleDownload(cert._id, cert.verificationCode)}
                                                disabled={actionLoading === `dl-${cert._id}`}
                                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                title="PDF herunterladen"
                                            >
                                                {actionLoading === `dl-${cert._id}` ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Download className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                            {cert.revokedAt ? (
                                                <button
                                                    onClick={() => handleRestore(cert._id)}
                                                    disabled={actionLoading === `res-${cert._id}`}
                                                    className="p-1.5 rounded-lg hover:bg-green-500/10 transition-colors text-muted-foreground hover:text-green-500"
                                                    title="Wiederherstellen"
                                                >
                                                    {actionLoading === `res-${cert._id}` ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => { setRevokeModal(cert); setRevokeReason(""); }}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
                                                    title="Widerrufen"
                                                >
                                                    <ShieldOff className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Seite {page} von {totalPages}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Revoke modal */}
            {revokeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                                <ShieldOff className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">Zertifikat widerrufen</h3>
                                <p className="text-muted-foreground text-xs">{revokeModal.verificationCode}</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Das Zertifikat von <strong>{revokeModal.userName}</strong> wird sofort ungültig.
                            Bestehende PDFs und Wallet-Passes werden bei Verifizierung als widerrufen angezeigt.
                        </p>
                        <label className="block text-xs text-muted-foreground mb-1.5">
                            Grund (optional)
                        </label>
                        <input
                            type="text"
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                            placeholder="z.B. Fehler bei der Ausstellung"
                            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setRevokeModal(null)}
                            >
                                Abbrechen
                            </Button>
                            <Button
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                onClick={handleRevoke}
                                disabled={actionLoading === `rev-${revokeModal._id}`}
                            >
                                {actionLoading === `rev-${revokeModal._id}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Widerrufen
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCertificates;